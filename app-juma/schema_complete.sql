-- ============================================================
-- JUMA ACCESSORY - ESQUEMA COMPLETO DE BASE DE DATOS
-- Versión: 2.0 (Marzo 2025)
-- Ejecutar en: Supabase SQL Editor (una sola vez, en orden)
-- ============================================================

-- ============================================================
-- 1. CATEGORÍAS
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
  auth_id    UUID UNIQUE,          -- Referencia al usuario de Supabase Auth
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  phone      TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. PRODUCTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
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
-- 6. FAVORITOS
-- ============================================================
CREATE TABLE IF NOT EXISTS favorites (
  id         SERIAL PRIMARY KEY,
  client_id  INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, product_id)
);

-- ============================================================
-- 7. BANNER PRINCIPAL (una sola fila, id = 1)
-- ============================================================
CREATE TABLE IF NOT EXISTS hero_banner (
  id       INT PRIMARY KEY DEFAULT 1,
  tag      TEXT NOT NULL DEFAULT 'Tienda online minorista',
  title    TEXT NOT NULL DEFAULT '3 Cuotas Sin Interes',
  subtitle TEXT NOT NULL DEFAULT '20% off efectivo / 10% off transferencia',
  image    TEXT NOT NULL DEFAULT ''
);

-- Inserta la fila por defecto si no existe
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
-- 8. CARTELES DESTACADOS (featured panels)
-- ============================================================
CREATE TABLE IF NOT EXISTS featured_panels (
  id          TEXT PRIMARY KEY,     -- Ej: 'blanco', 'dorado', etc.
  title       TEXT NOT NULL DEFAULT '',
  cta         TEXT NOT NULL DEFAULT 'Mira mas',
  image       TEXT NOT NULL DEFAULT '',
  class_name  TEXT NOT NULL DEFAULT 'card-left'
                CHECK (class_name IN ('card-left','card-top','card-bottom-left','card-bottom-right')),
  category_id INT REFERENCES categories(id) ON DELETE SET NULL
);

-- Paneles por defecto
INSERT INTO featured_panels (id, title, cta, image, class_name) VALUES
  ('blanco',     'Acero Quirurgico Blanco', 'Mira mas', 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1400&q=80', 'card-left'),
  ('dorado',     'Acero Dorado',            'Mira mas', 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?auto=format&fit=crop&w=1200&q=80', 'card-top'),
  ('quirurgico', 'Acero Quirurgico',        'Mira mas', 'https://images.unsplash.com/photo-1588444650700-6d6db1f6f7fd?auto=format&fit=crop&w=1200&q=80', 'card-bottom-left'),
  ('charms',     'Pulseras Charms',         'Mira mas', 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1200&q=80', 'card-bottom-right')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- Política abierta para simplificar el acceso desde el frontend.
-- ============================================================

-- Habilitar RLS en cada tabla
ALTER TABLE categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_banner     ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_panels ENABLE ROW LEVEL SECURITY;

-- Política: acceso total a cualquier rol (anon + authenticated)
-- categories
CREATE POLICY "open_categories" ON categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- clients
CREATE POLICY "open_clients" ON clients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- products
CREATE POLICY "open_products" ON products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- orders
CREATE POLICY "open_orders" ON orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- order_items
CREATE POLICY "open_order_items" ON order_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- favorites
CREATE POLICY "open_favorites" ON favorites FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- hero_banner
CREATE POLICY "open_hero_banner" ON hero_banner FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
-- featured_panels
CREATE POLICY "open_featured_panels" ON featured_panels FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 10. PERMISOS DE SCHEMA
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES    IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
