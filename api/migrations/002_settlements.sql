-- ============================================================
-- SplitWise – Database Migration 002: Settlements
-- ============================================================

CREATE TABLE IF NOT EXISTS settlements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     UUID REFERENCES groups(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  amount       NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status       VARCHAR(20) NOT NULL DEFAULT 'ACKNOWLEDGED', -- PENDING | ACKNOWLEDGED
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS settlements_group_idx ON settlements(group_id);
CREATE INDEX IF NOT EXISTS settlements_from_idx ON settlements(from_user_id);
CREATE INDEX IF NOT EXISTS settlements_to_idx ON settlements(to_user_id);
