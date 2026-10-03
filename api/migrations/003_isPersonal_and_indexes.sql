-- ============================================================
-- SplitWise – Migration 003: Add isPersonal flag + indexes
-- ============================================================

-- Add is_personal flag to expenses table (replaces fragile split-count heuristic)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_personal BOOLEAN NOT NULL DEFAULT FALSE;

-- Performance indexes
CREATE INDEX IF NOT EXISTS expenses_personal_idx ON expenses(group_id, is_personal);
CREATE INDEX IF NOT EXISTS expenses_paid_by_idx  ON expenses(paid_by);
CREATE INDEX IF NOT EXISTS splits_user_idx ON expense_splits(user_id);
