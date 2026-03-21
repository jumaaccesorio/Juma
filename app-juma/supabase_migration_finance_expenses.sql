CREATE TABLE IF NOT EXISTS finance_expenses (
  id          SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  detail      TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL DEFAULT 'General',
  amount      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE finance_expenses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'finance_expenses'
      AND policyname = 'open_finance_expenses'
  ) THEN
    CREATE POLICY "open_finance_expenses"
      ON finance_expenses
      FOR ALL
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

GRANT ALL ON TABLE finance_expenses TO anon, authenticated;
GRANT ALL ON SEQUENCE finance_expenses_id_seq TO anon, authenticated;
