-- Keeps executions.updated_at in sync on UPDATE (INSERT still uses DEFAULT NOW()).
CREATE OR REPLACE FUNCTION rawswap_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS executions_touch_updated_at ON executions;
CREATE TRIGGER executions_touch_updated_at
  BEFORE UPDATE ON executions
  FOR EACH ROW
  EXECUTE FUNCTION rawswap_touch_updated_at();
