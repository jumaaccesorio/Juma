CREATE TABLE auth_users (
 id TEXT PRIMARY KEY,
 provider_sub TEXT NOT NULL UNIQUE,
 email TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL DEFAULT '',
 picture TEXT NOT NULL DEFAULT '',
 client_id INTEGER NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE auth_sessions (
 token_hash TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
 expires_at TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE oauth_states (
 state_hash TEXT PRIMARY KEY,
 code_verifier TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX auth_sessions_user_idx ON auth_sessions(user_id);
CREATE INDEX auth_sessions_expiry_idx ON auth_sessions(expires_at);
CREATE INDEX oauth_states_expiry_idx ON oauth_states(expires_at);
