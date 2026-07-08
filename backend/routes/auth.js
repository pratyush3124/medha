const express = require('express');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const { eq } = require('drizzle-orm');
const router = express.Router();

const { requireAuth, signToken } = require('../middleware/auth');

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

module.exports = function (db) {
  const { users } = require('../db/schema');

  router.post('/register', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      const normalizedEmail = email.toLowerCase();
      const existing = await db.select().from(users).where(eq(users.email, normalizedEmail));
      if (existing.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const id = randomUUID();
      const spriteLabel = 'user:' + id.slice(0, 8);
      const passwordHash = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();

      await db.insert(users).values({
        id,
        email: normalizedEmail,
        passwordHash,
        spriteLabel,
        createdAt: now,
      });

      const user = { id, email: normalizedEmail, sprite_label: spriteLabel };
      const token = signToken(user);

      res.cookie('token', token, COOKIE_OPTS);
      res.status(201).json({ user });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const normalizedEmail = email.toLowerCase();
      const rows = await db.select().from(users).where(eq(users.email, normalizedEmail));
      const row = rows[0];
      if (!row) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const match = await bcrypt.compare(password, row.passwordHash);
      if (!match) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = { id: row.id, email: row.email, sprite_label: row.spriteLabel };
      const token = signToken(user);

      res.cookie('token', token, COOKIE_OPTS);
      res.json({ user });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  router.post('/logout', (req, res) => {
    res.clearCookie('token', COOKIE_OPTS);
    res.json({ ok: true });
  });

  router.get('/me', requireAuth, (req, res) => {
    res.json({
      user: { id: req.user.id, email: req.user.email, sprite_label: req.user.sprite_label },
    });
  });

  return router;
};
