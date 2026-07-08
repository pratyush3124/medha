const express = require('express');
const router = express.Router();

module.exports = function(spritesService) {
  router.get('/', async (req, res) => {
    try {
      const { prefix, max_results } = req.query;
      const result = await spritesService.listSprites({
        prefix,
        maxResults: max_results ? parseInt(max_results) : 50
      });

      const sandboxes = await Promise.all(
        result.sprites.map(async (sprite) => {
          try {
            const details = await spritesService.getSprite(sprite.name);
            return spritesService.mapToSandbox(details);
          } catch {
            return spritesService.mapToSandbox(sprite);
          }
        })
      );

      res.json({
        sandboxes,
        hasMore: result.has_more,
        continuationToken: result.next_continuation_token
      });
    } catch (err) {
      console.error('List sandboxes error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:name', async (req, res) => {
    try {
      const sprite = await spritesService.getSprite(req.params.name);
      res.json({ sandbox: spritesService.mapToSandbox(sprite) });
    } catch (err) {
      console.error('Get sandbox error:', err);
      res.status(err.message.includes('404') ? 404 : 500).json({ error: err.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const { name } = req.body;
      const rawName = name || 'sprite-' + Math.floor(Math.random() * 10000);
      const spriteName = rawName.toLowerCase().replace(/[^a-z0-9-]/g, '');

      const sprite = await spritesService.createSprite(spriteName);
      res.status(201).json({ sandbox: spritesService.mapToSandbox(sprite) });
    } catch (err) {
      console.error('Create sandbox error:', err);
      res.status(err.message.includes('400') ? 400 : 500).json({ error: err.message });
    }
  });

  router.delete('/:name', async (req, res) => {
    try {
      await spritesService.deleteSprite(req.params.name);
      res.status(204).send();
    } catch (err) {
      console.error('Delete sandbox error:', err);
      res.status(err.message.includes('404') ? 404 : 500).json({ error: err.message });
    }
  });

  return router;
};
