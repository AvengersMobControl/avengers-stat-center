-- Additive, private-only migration for user-editable Kraken submissions.
-- Historical preset route snapshot stays intact for provenance when a player
-- overrides its ticket counts. The active route then behaves as Custom.
ALTER TABLE avengers_kraken_private.runs
  ADD COLUMN IF NOT EXISTS customized boolean NOT NULL DEFAULT false;
ALTER TABLE avengers_kraken_private.runs
  ADD COLUMN IF NOT EXISTS customized_at timestamptz;
-- Existing audit rows remain unchanged. Member edits, route conversion and
-- reopening use event-specific JSON details in the existing audit action
-- categories to retain compatibility with the existing CHECK constraint.
