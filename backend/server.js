require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
global.WebSocket = WebSocket; // Override native WS to fix proxy/TLS issues


const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws/terminal' });

// ---------------------------------------------------------
// 🔑 CREDENTIALS LOADED FROM .ENV
// ---------------------------------------------------------
const SPRITES_API_KEY = process.env.SPRITES_API_KEY;


let sandboxes = [];

app.get('/api/sandboxes', (req, res) => {
  res.json({ sandboxes });
});

app.post('/api/sandboxes', async (req, res) => {
  const { name } = req.body;
  // Sprites names must be lowercase and alphanumeric
  const rawName = name || 'sprite-' + Math.floor(Math.random() * 10000);
  const spriteName = rawName.toLowerCase().replace(/[^a-z0-9-]/g, '');
  
  // ----------------------------------------------------------------------
  // 📡 Sprites.dev API Integration
  // ----------------------------------------------------------------------
  let spriteHost = '127.0.0.1';
  let spriteId = 'sbx_' + Math.random().toString(36).substring(7);

  if (SPRITES_API_KEY) {
    try {
      const response = await fetch('https://api.sprites.dev/v1/sprites', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${SPRITES_API_KEY}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ name: spriteName })
      });
      const data = await response.json();
      if (data.url) {
        // Remove https:// and trailing paths to get the host
        spriteHost = data.url.replace('https://', '').replace('http://', '').split('/')[0];
        spriteId = data.id;
      } else {
        console.error("Sprites API error:", data);
        return res.status(400).json({ error: "Failed to create Sprite: " + JSON.stringify(data) });
      }
    } catch (e) {
      console.error("Failed to call Sprites API", e);
      return res.status(500).json({ error: "Failed to call Sprites API: " + e.message });
    }
  }

  const newSandbox = {
    id: spriteId,
    name: spriteName,
    status: 'Running',
    ip: spriteHost
  };
  
  sandboxes.push(newSandbox);
  res.json({ sandbox: newSandbox });
});

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
