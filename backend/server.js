require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
global.WebSocket = WebSocket;

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  for (const pair of cookieHeader.split(';')) {
    const [key, ...valParts] = pair.trim().split('=');
    if (key) cookies[key] = valParts.join('=');
  }
  return cookies;
}

const SpritesService = require('./services/spritesService');
const ConnectorService = require('./services/connectorService');
const sandboxesRouter = require('./routes/sandboxes');
const authRouter = require('./routes/auth');
const oauthRouter = require('./routes/oauth');
const gatewayRouter = require('./routes/gateway');
const { db, client: dbClient } = require('./db');
const { spriteOwnership } = require('./db/schema');
const { eq, and } = require('drizzle-orm');
const { JWT_SECRET } = require('./middleware/auth');

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws/terminal' });

const SPRITES_API_KEY = process.env.SPRITES_API_KEY;
const spritesService = new SpritesService(SPRITES_API_KEY);
const connectorService = new ConnectorService(SPRITES_API_KEY);

app.use('/api/auth', authRouter(db));
app.use('/api/sandboxes', sandboxesRouter(spritesService, db));
app.use('/api/oauth', oauthRouter(db, connectorService));
app.use('/api/github', gatewayRouter(db, connectorService));

wss.on('connection', async (ws, req) => {
  console.log('Client connected to terminal tunnel');

  const params = new URL(req.url, 'http://localhost').searchParams;
  const rawSpriteName = params.get('spriteName');

  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.token || params.get('token');

  if (!token) {
    ws.send('\r\n\x1b[31mError: Authentication required. Please log in.\x1b[0m\r\n');
    return ws.close();
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    ws.send('\r\n\x1b[31mError: Invalid or expired token.\x1b[0m\r\n');
    return ws.close();
  }

  if (!rawSpriteName) {
    ws.send('\r\n\x1b[31mError: spriteName not provided in connection URL.\x1b[0m\r\n');
    return ws.close();
  }

  const spriteName = rawSpriteName.toLowerCase().replace(/[^a-z0-9-]/g, '');

  const owned = await db
    .select()
    .from(spriteOwnership)
    .where(
      and(eq(spriteOwnership.userId, decoded.id), eq(spriteOwnership.spriteName, spriteName))
    );
  if (owned.length === 0) {
    ws.send('\r\n\x1b[31mError: You do not own this sandbox.\x1b[0m\r\n');
    return ws.close();
  }

  if (!SPRITES_API_KEY) {
    ws.send('\r\n\x1b[31mError: SPRITES_API_KEY is not set in backend .env\x1b[0m\r\n');
    return ws.close();
  }

  try {
    ws.send(`\x1b[36mConnecting to Sprite Sandbox (${spriteName}) via native API...\x1b[0m\r\n`);

    const { SpritesClient } = await import('@fly/sprites');
    const client = new SpritesClient(SPRITES_API_KEY);
    const sprite = client.sprite(spriteName);

    const cmd = sprite.spawn('bash', [], { tty: true });

    cmd.on('spawn', () => {
      ws.send(`\r\n\x1b[1;32mConnected natively to ${spriteName}!\x1b[0m\r\n`);
    });

    ws.on('message', (data) => {
      cmd.stdin.write(data);
    });

    cmd.stdout.on('data', (data) => {
      ws.send(data.toString('utf-8'));
    });

    cmd.stderr.on('data', (data) => {
      ws.send(data.toString('utf-8'));
    });

    cmd.on('exit', (code) => {
      ws.send(`\r\n\x1b[31mSession closed (exit code ${code}).\x1b[0m\r\n`);
      ws.close();
    });

    cmd.on('error', (err) => {
      ws.send(`\r\n\x1b[31mCommand Error: ${err.message}\x1b[0m\r\n`);
    });

    ws.on('close', () => {
      console.log('Terminal client disconnected');
      cmd.kill();
    });
  } catch (e) {
    console.error('Sprites SDK Connect err:', e);
    ws.send(`\r\n\x1b[31mSprites SDK Error: ${e.message}\x1b[0m\r\n`);
    ws.close();
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Sprites Backend running on http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  if (dbClient && typeof dbClient.close === 'function') {
    await dbClient.close();
  }
  server.close();
  process.exit(0);
});
