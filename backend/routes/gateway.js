const express = require('express');
const { eq, and } = require('drizzle-orm');
const router = express.Router();

const { requireAuth } = require('../middleware/auth');

module.exports = function (db, connectorService) {
  const { githubConnections } = require('../db/schema');

  router.use(requireAuth);

  router.use(async (req, res) => {
    try {
      const rows = await db
        .select({ connectionId: githubConnections.connectionId })
        .from(githubConnections)
        .where(
          and(eq(githubConnections.userId, req.user.id), eq(githubConnections.status, 'active'))
        )
        .limit(1);

      const row = rows[0];
      if (!row) {
        return res.status(400).json({ error: 'No active GitHub connection' });
      }

      const path = req.url.replace(/^\/+/, '');
      const gatewayUrl = connectorService.buildGatewayUrl(row.connectionId, path);

      const fetchOpts = {
        method: req.method,
        headers: {
          Authorization: `Bearer ${connectorService.apiKey}`,
          'Content-Type': 'application/json',
        },
      };

      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length > 0) {
        fetchOpts.body = JSON.stringify(req.body);
      }

      const ghRes = await fetch(gatewayUrl, fetchOpts);
      const contentType = ghRes.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const data = await ghRes.json();
        res.status(ghRes.status).json(data);
      } else {
        const text = await ghRes.text();
        res.status(ghRes.status).send(text);
      }
    } catch (err) {
      console.error('Gateway proxy error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
