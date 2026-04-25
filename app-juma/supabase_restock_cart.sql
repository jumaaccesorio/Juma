-- Ejecutar en Supabase SQL Editor para habilitar el Carrito Reposicion compartido.

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

ALTER TABLE restock_cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_restock_cart_items" ON restock_cart_items;
CREATE POLICY "open_restock_cart_items"
  ON restock_cart_items
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL ON restock_cart_items TO anon, authenticated;
GRANT ALL ON SEQUENCE restock_cart_items_id_seq TO anon, authenticated;
