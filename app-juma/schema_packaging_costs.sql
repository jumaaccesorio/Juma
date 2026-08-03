-- Tabla para gestionar costos de packaging en Supabase SQL Editor
CREATE TABLE IF NOT EXISTS packaging_costs (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  unit_cost   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  quantity    INT NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS y políticas de acceso abierto (acceso anon y authenticated)
ALTER TABLE packaging_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_packaging_costs" ON packaging_costs;

CREATE POLICY "open_packaging_costs" ON packaging_costs
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL ON packaging_costs TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
