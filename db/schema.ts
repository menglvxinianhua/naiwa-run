import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const players = sqliteTable('players', {id:text('id').primaryKey(),name:text('name').notNull(),created:integer('created').notNull()});
export const runs = sqliteTable('runs', {id:text('id').primaryKey(),player:text('player').notNull().references(()=>players.id),started:integer('started').notNull(),score:integer('score'),duration:integer('duration')},t=>[index('idx_runs_player_started').on(t.player,t.started),index('idx_runs_score').on(t.score)]);
