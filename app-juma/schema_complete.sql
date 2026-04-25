-- ============================================================
-- JUMA ACCESSORY - ESQUEMA COMPLETO DE BASE DE DATOS
-- Version: 2.0
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. CATEGORIAS
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  parent_id  INT REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. CLIENTES
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id         SERIAL PRIMARY KEY,
  auth_id    UUID UNIQUE,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  phone      TEXT NOT NULL DEFAULT '',
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- ============================================================
-- 3. PRODUCTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  sub_name       TEXT NOT NULL DEFAULT '',
  category_id    INT REFERENCES categories(id) ON DELETE SET NULL,
  is_featured    BOOLEAN NOT NULL DEFAULT FALSE,
  purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  sale_price     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stock          INT NOT NULL DEFAULT 0,
  initial_stock  INT NOT NULL DEFAULT 0,
  enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  image          TEXT DEFAULT '',
  source_url     TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. PEDIDOS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id           SERIAL PRIMARY KEY,
  client_id    INT REFERENCES clients(id) ON DELETE SET NULL,
  guest_name   TEXT,
  guest_email  TEXT,
  guest_phone  TEXT,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  status       TEXT NOT NULL DEFAULT 'PENDIENTE'
                 CHECK (status IN ('PENDIENTE', 'REALIZADO')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. ITEMS DE PEDIDO
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id                  SERIAL PRIMARY KEY,
  order_id            INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id          INT REFERENCES products(id) ON DELETE SET NULL,
  quantity            INT NOT NULL DEFAULT 1,
  unit_sale_price     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  unit_purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0
);

-- ============================================================
-- 6. CARRITO DE REPOSICION
-- ============================================================
CREATE TABLE IF NOT EXISTS restock_cart_items (
  id              SERIAL PRIMARY KEY,
  product_id      INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  requested       BOOLEAN NOT NULL DEFAULT FALSE,
  in_cart         BOOLEAN NOT NULL DEFAULT FALSE,
  hidden          BOOLEAN NOT NULL DEFAULT FALSE,
  is_manual       BOOLEAN NOT NULL DEFAULT FALSE,
  manual_quantity INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id)
);

-- ============================================================
-- 7. EGRESOS MANUALES
-- ============================================================
CREATE TABLE IF NOT EXISTS finance_expenses (
  id          SERIAL PRIMARY KEY,
  type        TEXT NOT NULL DEFAULT 'EGRESO'
                CHECK (type IN ('INGRESO', 'EGRESO')),
  description TEXT NOT NULL,
  detail      TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL DEFAULT 'General',
  amount      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE finance_expenses
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'EGRESO';

ALTER TABLE finance_expenses
  DROP CONSTRAINT IF EXISTS finance_expenses_type_check;

ALTER TABLE finance_expenses
  ADD CONSTRAINT finance_expenses_type_check CHECK (type IN ('INGRESO', 'EGRESO'));

-- ============================================================
-- 8. FAVORITOS
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
  id         SERIAL PRIMARY KEY,
  client_id  INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, product_id)
);

-- ============================================================
-- 9. BANNER PRINCIPAL
-- ============================================================
CREATE TABLE IF NOT EXISTS hero_banner (
  id       INT PRIMARY KEY DEFAULT 1,
  tag      TEXT NOT NULL DEFAULT 'Tienda online minorista',
  title    TEXT NOT NULL DEFAULT '3 Cuotas Sin Interes',
  subtitle TEXT NOT NULL DEFAULT '20% off efectivo / 10% off transferencia',
  image    TEXT NOT NULL DEFAULT ''
);

INSERT INTO hero_banner (id, tag, title, subtitle, image)
VALUES (
  1,
  'Tienda online minorista',
  '3 Cuotas Sin Interes',
  '20% off efectivo / 10% off transferencia',
  'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1800&q=80'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. CARTELES DESTACADOS
-- ============================================================
CREATE TABLE IF NOT EXISTS featured_panels (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL DEFAULT '',
  cta         TEXT NOT NULL DEFAULT 'Mira mas',
  image       TEXT NOT NULL DEFAULT '',
  class_name  TEXT NOT NULL DEFAULT 'card-left'
                CHECK (class_name IN ('card-left','card-top','card-bottom-left','card-bottom-right')),
  category_id INT REFERENCES categories(id) ON DELETE SET NULL
);

INSERT INTO featured_panels (id, title, cta, image, class_name) VALUES
  ('blanco',     'Acero Quirurgico Blanco', 'Mira mas', 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1400&q=80', 'card-left'),
  ('dorado',     'Acero Dorado',            'Mira mas', 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?auto=format&fit=crop&w=1200&q=80', 'card-top'),
  ('quirurgico', 'Acero Quirurgico',        'Mira mas', 'https://images.unsplash.com/photo-1588444650700-6d6db1f6f7fd?auto=format&fit=crop&w=1200&q=80', 'card-bottom-left'),
  ('charms',     'Pulseras Charms',         'Mira mas', 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1200&q=80', 'card-bottom-right')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE restock_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites        ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_banner      ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_panels  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_categories" ON categories;
CREATE POLICY "open_categories" ON categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_clients" ON clients;
CREATE POLICY "open_clients" ON clients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_products" ON products;
CREATE POLICY "open_products" ON products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_orders" ON orders;
CREATE POLICY "open_orders" ON orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_order_items" ON order_items;
CREATE POLICY "open_order_items" ON order_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_restock_cart_items" ON restock_cart_items;
CREATE POLICY "open_restock_cart_items" ON restock_cart_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_finance_expenses" ON finance_expenses;
CREATE POLICY "open_finance_expenses" ON finance_expenses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_favorites" ON favorites;
CREATE POLICY "open_favorites" ON favorites FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_hero_banner" ON hero_banner;
CREATE POLICY "open_hero_banner" ON hero_banner FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_featured_panels" ON featured_panels;
CREATE POLICY "open_featured_panels" ON featured_panels FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 12. PERMISOS
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================================
-- FIN
-- ============================================================
