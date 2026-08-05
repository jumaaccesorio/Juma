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

-- Insertar valor por defecto para el periodo de destacados (1 = 1 mes)
INSERT INTO app_settings (key, value)
VALUES ('featured_products_period', '1')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 3. FUNCIÓN RPC: PRODUCTOS MÁS VENDIDOS
-- ============================================================
CREATE OR REPLACE FUNCTION get_best_selling_products(months_back INT DEFAULT 1, max_results INT DEFAULT 8)
RETURNS TABLE (
  product_id INT,
  total_sold BIGINT
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      oi.product_id,
      SUM(oi.quantity)::BIGINT AS total_sold
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status = 'REALIZADO'
      AND o.date >= (CURRENT_DATE - (months_back * INTERVAL '1 month'))::DATE
      AND oi.product_id IS NOT NULL
    GROUP BY oi.product_id
    ORDER BY total_sold DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_product_reviews" ON product_reviews;
CREATE POLICY "open_product_reviews" ON product_reviews FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_app_settings" ON app_settings;
CREATE POLICY "open_app_settings" ON app_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 5. PERMISOS
-- ============================================================
GRANT ALL ON product_reviews TO anon, authenticated;
GRANT ALL ON app_settings TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE product_reviews_id_seq TO anon, authenticated;

-- ============================================================
-- FIN
-- ============================================================
