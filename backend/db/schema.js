const { sqliteTable, text } = require('drizzle-orm/sqlite-core');

const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  spriteLabel: text('sprite_label').notNull().unique(),
  createdAt: text('created_at').notNull(),
});

const githubConnections = sqliteTable('github_connections', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  connectionId: text('connection_id').notNull(),
  githubUsername: text('github_username'),
  scopes: text('scopes').notNull().default('[]'),
  status: text('status').notNull().default('pending'),
  createdAt: text('created_at').notNull(),
  confirmedAt: text('confirmed_at'),
});

const spriteOwnership = sqliteTable('sprite_ownership', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  spriteName: text('sprite_name').notNull().unique(),
  createdAt: text('created_at').notNull(),
});

module.exports = { users, githubConnections, spriteOwnership };
