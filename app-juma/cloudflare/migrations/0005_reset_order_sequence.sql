-- Orders now use SQLite's native AUTOINCREMENT again. Timestamp-based IDs were
-- removed, but they may have advanced sqlite_sequence even after deletion.
UPDATE sqlite_sequence
SET seq = (SELECT COALESCE(MAX(id), 0) FROM orders)
WHERE name = 'orders';
