-- Contenido: cada pieza guarda su borrador y, si está publicada, la versión pública.
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('song', 'story', 'podcast', 'film', 'activity', 'page')),
  position INTEGER NOT NULL DEFAULT 0,
  draft TEXT NOT NULL,
  published TEXT,
  is_example INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  published_at TEXT
);
CREATE INDEX items_kind ON items (kind, position);

CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO settings (key, value) VALUES ('easterEgg', 'on'), ('dedication', '');

-- Archivos subidos a R2. Solo se sirven si una pieza publicada los usa.
CREATE TABLE media (
  key TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  name TEXT NOT NULL,
  is_public INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE admins (email TEXT PRIMARY KEY, password TEXT NOT NULL, created_at TEXT NOT NULL);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  csrf TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE login_failures (ip TEXT NOT NULL, email TEXT NOT NULL, at INTEGER NOT NULL);
CREATE INDEX login_failures_ip ON login_failures (ip, at);
CREATE INDEX login_failures_email ON login_failures (email, at);
