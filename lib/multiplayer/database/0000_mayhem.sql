CREATE TABLE mayhem_rooms (
  code TEXT PRIMARY KEY,
  revision INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  state TEXT NOT NULL
);
