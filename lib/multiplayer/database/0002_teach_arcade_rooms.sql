CREATE TABLE IF NOT EXISTS teach_arcade_rooms (
  code TEXT PRIMARY KEY,
  revision INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  state TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS teach_arcade_lobby_codes (
  code TEXT PRIMARY KEY,
  game TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS teach_arcade_room_expiration ON teach_arcade_rooms (updated_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS teach_arcade_preview_rooms (
  code TEXT PRIMARY KEY,
  revision INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  state TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS teach_arcade_preview_lobby_codes (
  code TEXT PRIMARY KEY,
  game TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS teach_arcade_preview_room_expiration ON teach_arcade_preview_rooms (updated_at);
