require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
global.WebSocket = WebSocket;

const SpritesService = require('./services/spritesService');
const sandboxesRouter = require('./routes/sandboxes');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws/terminal' });

const SPRITES_API_KEY = process.env.SPRITES_API_KEY;
const spritesService = new SpritesService(SPRITES_API_KEY);

app.use('/api/sandboxes', sandboxesRouter(spritesService));

wss.on('connection', async (ws, req) => {
  console.log('Client connected to terminal tunnel');
  
  // Extract spriteName from query params
  const params = new URL(req.url, 'http://localhost').searchParams;
  const rawSpriteName = params.get('spriteName');

  if (!rawSpriteName) {
    ws.send('\\r\\n\\x1b[31mError: spriteName not provided in connection URL.\\x1b[0m\\r\\n');
    return ws.close();
  }

  const spriteName = rawSpriteName.toLowerCase().replace(/[^a-z0-9-]/g, '');

  if (!SPRITES_API_KEY) {
    ws.send('\\r\\n\\x1b[31mError: SPRITES_API_KEY is not set in backend .env\\x1b[0m\\r\\n');
    return ws.close();
  }

  try {
    ws.send(`\\x1b[36mConnecting to Sprite Sandbox (${spriteName}) via native API...\\x1b[0m\\r\\n`);
    
    const { SpritesClient } = await import('@fly/sprites');
    const client = new SpritesClient(SPRITES_API_KEY);
    const sprite = client.sprite(spriteName);
    
    // Spawn a shell using the native WebSocket protocol
    const cmd = sprite.spawn('bash', [], { tty: true });

    cmd.on('spawn', () => {
      ws.send(`\\r\\n\\x1b[1;32mConnected natively to ${spriteName}!\\x1b[0m\\r\\n`);
    });

    // 1. Browser -> Server (WebSocket) -> Sprite (stdin)
    ws.on('message', (data) => {
      cmd.stdin.write(data);
    });

    // 2. Sprite (stdout/stderr) -> Server -> Browser (WebSocket)
    cmd.stdout.on('data', (data) => {
      ws.send(data.toString('utf-8'));
    });

    cmd.stderr.on('data', (data) => {
      ws.send(data.toString('utf-8'));
    });

    cmd.on('exit', (code) => {
      ws.send(`\\r\\n\\x1b[31mSession closed (exit code ${code}).\\x1b[0m\\r\\n`);
      ws.close();
    });

    cmd.on('error', (err) => {
      ws.send(`\\r\\n\\x1b[31mCommand Error: ${err.message}\\x1b[0m\\r\\n`);
    });

    ws.on('close', () => {
      console.log('Terminal client disconnected');
      cmd.kill();
    });

  } catch(e) {
    console.error("Sprites SDK Connect err:", e);
    ws.send(`\\r\\n\\x1b[31mSprites SDK Error: ${e.message}\\x1b[0m\\r\\n`);
    ws.close();
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Sprites Backend running on http://localhost:${PORT}`);
});
