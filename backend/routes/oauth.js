const express = require('express');
const { randomUUID } = require('crypto');
const { eq, and, ne, desc } = require('drizzle-orm');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');

const pendingOAuth = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [state, entry] of pendingOAuth) {
    if (now - entry.createdAt > 10 * 60 * 1000) {
      pendingOAuth.delete(state);
    }
  }
}, 60 * 1000);

module.exports = function (db, connectorService) {
  const { githubConnections } = require('../db/schema');

  router.post('/github/initiate', requireAuth, async (req, res) => {
    try {
      const scopes = ['repo', 'read:user'];

      const beforeConnections = await connectorService.listConnections();
      const beforeIds = new Set(beforeConnections.map((c) => c.id));

      const { authorize_url, state } = await connectorService.startGitHubOAuth(scopes);

      pendingOAuth.set(state, {
        userId: req.user.id,
        beforeIds,
        createdAt: Date.now(),
      });

      await db.insert(githubConnections).values({
        id: randomUUID(),
        userId: req.user.id,
        connectionId: 'pending:' + state,
        scopes: JSON.stringify(scopes),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      res.json({ authorize_url, state });
    } catch (err) {
      console.error('OAuth initiate error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/github/confirm', requireAuth, async (req, res) => {
    try {
      const { state } = req.body;
      if (!state) {
        return res.status(400).json({ error: 'Missing state parameter' });
      }

      const pending = pendingOAuth.get(state);
      if (!pending) {
        return res.status(400).json({ error: 'Invalid or expired OAuth state' });
      }
      if (pending.userId !== req.user.id) {
        return res.status(403).json({ error: 'OAuth state does not belong to this user' });
      }

      const currentConnections = await connectorService.listConnections();
      const newConnections = currentConnections.filter((c) => !pending.beforeIds.has(c.id));

      if (newConnections.length === 0) {
        return res.status(404).json({
          status: 'not_found',
          message: 'No new connection detected. Make sure you completed the GitHub authorization.',
        });
      }

      const newConn = newConnections[newConnections.length - 1];
      const now = new Date().toISOString();

      await db
        .update(githubConnections)
        .set({ connectionId: newConn.id, status: 'active', confirmedAt: now })
        .where(
          and(eq(githubConnections.userId, req.user.id), eq(githubConnections.status, 'pending'))
        );

      await connectorService.updateAccessPolicy(newConn.id, {
        sprite_labels: [req.user.sprite_label],
      });

      pendingOAuth.delete(state);

      let githubUsername = null;
      try {
        const gatewayUrl = connectorService.buildGatewayUrl(newConn.id, 'user');
        const ghRes = await fetch(gatewayUrl, {
          headers: { Authorization: `Bearer ${connectorService.apiKey}` },
        });
        if (ghRes.ok) {
          const ghData = await ghRes.json();
          githubUsername = ghData.login;
          await db
            .update(githubConnections)
            .set({ githubUsername })
            .where(eq(githubConnections.connectionId, newConn.id));
        }
      } catch (e) {
        console.error('Could not fetch GitHub username:', e.message);
      }

      res.json({
        connection: {
          connection_id: newConn.id,
          github_username: githubUsername,
          status: 'active',
        },
      });
    } catch (err) {
      console.error('OAuth confirm error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/github/status', requireAuth, async (req, res) => {
    try {
      const rows = await db
        .select()
        .from(githubConnections)
        .where(
          and(eq(githubConnections.userId, req.user.id), ne(githubConnections.status, 'revoked'))
        )
        .orderBy(desc(githubConnections.createdAt));

      res.json({ connections: rows });
    } catch (err) {
      console.error('GitHub status error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/github/connections/:id', requireAuth, async (req, res) => {
    try {
      const rows = await db
        .select()
        .from(githubConnections)
        .where(
          and(
            eq(githubConnections.id, req.params.id),
            eq(githubConnections.userId, req.user.id)
          )
        );
      const row = rows[0];

      if (!row) {
        return res.status(404).json({ error: 'Connection not found' });
      }

      if (row.connectionId && !row.connectionId.startsWith('pending:')) {
        try {
          await connectorService.deleteConnection(row.connectionId);
        } catch (e) {
          console.error('Could not delete connector from Sprites:', e.message);
        }
      }

      await db
        .update(githubConnections)
        .set({ status: 'revoked' })
        .where(eq(githubConnections.id, row.id));
      res.json({ ok: true });
    } catch (err) {
      console.error('Delete connection error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
