-- ============================================================
-- JUMA ACCESSORY - RESEÑAS Y CONFIGURACIÓN
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. RESEÑAS DE PRODUCTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id         SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  client_id  INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  rating     INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, client_id)
);

-- ============================================================
-- 2. CONFIGURACIÓN DE LA APP
-- ============================================================
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT ''
);

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_product_reviews" ON product_reviews;
CREATE POLICY "open_product_reviews" ON product_reviews FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_app_settings" ON app_settings;
CREATE POLICY "open_app_settings" ON app_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 4. PERMISOS
-- ============================================================
GRANT ALL ON product_reviews TO anon, authenticated;
GRANT ALL ON app_settings TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE product_reviews_id_seq TO anon, authenticated;

-- ============================================================
-- FIN
-- ============================================================
