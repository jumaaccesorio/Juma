-- Application tables only. Supabase Auth is a separate migration.
-- Monetary values use INTEGER cents, preserving NUMERIC(12,2) precision.
CREATE TABLE categories (
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
 parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE clients (
 id INTEGER PRIMARY KEY AUTOINCREMENT, auth_id TEXT UNIQUE, name TEXT NOT NULL,
 email TEXT NOT NULL UNIQUE, phone TEXT NOT NULL DEFAULT '',
 is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE products (
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
 sub_name TEXT NOT NULL DEFAULT '', size TEXT NOT NULL DEFAULT '',
 category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
 is_featured INTEGER NOT NULL DEFAULT 0 CHECK(is_featured IN (0,1)),
 purchase_price_cents INTEGER NOT NULL DEFAULT 0, sale_price_cents INTEGER NOT NULL DEFAULT 0,
 stock INTEGER NOT NULL DEFAULT 0, initial_stock INTEGER NOT NULL DEFAULT 0,
 enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
 image TEXT DEFAULT '', image_thumb TEXT, image_card TEXT, image_full TEXT,
 source_url TEXT DEFAULT '', created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE product_sizes (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
 size TEXT NOT NULL, stock INTEGER NOT NULL DEFAULT 0,
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(product_id,size)
);
CREATE TABLE orders (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
 guest_name TEXT, guest_email TEXT, guest_phone TEXT,
 date TEXT NOT NULL DEFAULT (date('now')),
 status TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK(status IN ('PENDIENTE','REALIZADO')),
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE order_items (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
 quantity INTEGER NOT NULL DEFAULT 1, size TEXT,
 unit_sale_price_cents INTEGER NOT NULL DEFAULT 0, unit_purchase_price_cents INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE favorites (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
 product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), UNIQUE(client_id,product_id)
);
CREATE TABLE restock_cart_items (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 product_id INTEGER NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
 requested INTEGER NOT NULL DEFAULT 0 CHECK(requested IN (0,1)),
 in_cart INTEGER NOT NULL DEFAULT 0 CHECK(in_cart IN (0,1)),
 hidden INTEGER NOT NULL DEFAULT 0 CHECK(hidden IN (0,1)),
 is_manual INTEGER NOT NULL DEFAULT 0 CHECK(is_manual IN (0,1)),
 manual_quantity INTEGER NOT NULL DEFAULT 0,
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE finance_expenses (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 type TEXT NOT NULL DEFAULT 'EGRESO' CHECK(type IN ('INGRESO','EGRESO')),
 description TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT 'General',
 amount_cents INTEGER NOT NULL DEFAULT 0, date TEXT NOT NULL DEFAULT (date('now')),
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE hero_banner (
 id INTEGER PRIMARY KEY DEFAULT 1, tag TEXT NOT NULL DEFAULT '', title TEXT NOT NULL DEFAULT '',
 subtitle TEXT NOT NULL DEFAULT '', image TEXT NOT NULL DEFAULT ''
);
CREATE TABLE featured_panels (
 id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL DEFAULT '', cta TEXT NOT NULL DEFAULT 'Mira mas',
 image TEXT NOT NULL DEFAULT '',
 class_name TEXT NOT NULL DEFAULT 'card-left' CHECK(class_name IN ('card-left','card-top','card-bottom-left','card-bottom-right')),
 category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL
);
CREATE TABLE packaging_costs (
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
 unit_cost_cents INTEGER NOT NULL DEFAULT 0, quantity INTEGER NOT NULL DEFAULT 1,
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE community_subscribers (
 id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE,
 created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX categories_parent_idx ON categories(parent_id);
CREATE INDEX products_category_idx ON products(category_id);
CREATE INDEX products_catalog_idx ON products(enabled,id);
CREATE INDEX orders_client_idx ON orders(client_id,date);
CREATE INDEX order_items_order_idx ON order_items(order_id);
CREATE INDEX order_items_product_idx ON order_items(product_id);
CREATE INDEX favorites_product_idx ON favorites(product_id);
CREATE INDEX featured_panels_category_idx ON featured_panels(category_id);
CREATE INDEX finance_expenses_date_idx ON finance_expenses(date);
CREATE VIEW catalog_products AS
 SELECT p.id,p.name,p.sub_name,p.category_id,c.name AS category_name,p.is_featured,
 p.sale_price_cents / 100.0 AS sale_price,p.stock,p.enabled,
 p.image,p.image_thumb,p.image_card,p.image_full,p.created_at
 FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.enabled=1;
