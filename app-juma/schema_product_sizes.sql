-- ============================================================
-- JUMA ACCESSORY - TALLES Y STOCK POR VARIANTE
-- Ejecutar una vez en Supabase SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.product_sizes (
  id         BIGSERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size       TEXT NOT NULL CHECK (BTRIM(size) <> ''),
  stock      INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, size)
);

CREATE INDEX IF NOT EXISTS product_sizes_product_id_idx
  ON public.product_sizes(product_id);

ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_product_sizes" ON public.product_sizes;
CREATE POLICY "open_product_sizes"
  ON public.product_sizes
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_sizes TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.product_sizes_id_seq TO anon, authenticated;

