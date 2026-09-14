CREATE TABLE product_reviews (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
 client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
 rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
 comment TEXT NOT NULL DEFAULT '',
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(product_id,client_id)
);

CREATE TABLE app_settings (
 key TEXT PRIMARY KEY,
 value TEXT NOT NULL DEFAULT ''
);

CREATE INDEX product_reviews_product_idx ON product_reviews(product_id,created_at);
CREATE INDEX product_reviews_client_idx ON product_reviews(client_id);
