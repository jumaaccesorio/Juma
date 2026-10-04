ALTER TABLE orders ADD COLUMN delivery_json TEXT;
ALTER TABLE orders ADD COLUMN checkout_key TEXT;
ALTER TABLE orders ADD COLUMN checkout_hash TEXT;
CREATE UNIQUE INDEX orders_checkout_key ON orders(checkout_key) WHERE checkout_key IS NOT NULL;
