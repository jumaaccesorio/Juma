-- Script para agregar el sistema de Favoritos
-- Corre este script en el SQL Editor de Supabase

-- Tabla de favoritos de clientes
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, product_id),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Agregar category_id a featured_panels para vincular paneles del home a categorías
ALTER TABLE featured_panels ADD COLUMN IF NOT EXISTS category_id INT;
ALTER TABLE featured_panels ADD CONSTRAINT fk_panel_category
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Permisos
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON favorites;
CREATE POLICY "Public Access" ON favorites FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
