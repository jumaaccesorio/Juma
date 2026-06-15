-- =====================================================
-- Tabla: community_subscribers
-- Almacena los emails de la sección "Unite a nuestra comunidad" del catálogo
-- =====================================================

CREATE TABLE IF NOT EXISTS community_subscribers (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE community_subscribers ENABLE ROW LEVEL SECURITY;

-- Permitir que cualquier visitante se suscriba (insert público)
CREATE POLICY "Allow public insert on community_subscribers"
  ON community_subscribers FOR INSERT
  WITH CHECK (true);

-- Permitir lectura (para admin)
CREATE POLICY "Allow authenticated read on community_subscribers"
  ON community_subscribers FOR SELECT
  USING (true);

-- Permitir borrar (para admin)
CREATE POLICY "Allow authenticated delete on community_subscribers"
  ON community_subscribers FOR DELETE
  USING (true);
