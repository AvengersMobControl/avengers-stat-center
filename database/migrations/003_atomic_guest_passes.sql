-- Atomic guest pass reservations for AVENGERS only (not SAC).
CREATE SCHEMA IF NOT EXISTS avengers_guest_private;
CREATE TABLE IF NOT EXISTS avengers_guest_private.passes (
  pass_hash char(64) PRIMARY KEY,
  creator_id text NOT NULL,
  expires_at timestamptz NOT NULL,
  allowed_uses smallint NOT NULL CHECK (allowed_uses BETWEEN 1 AND 10),
  used_count smallint NOT NULL DEFAULT 0 CHECK (used_count >= 0 AND used_count <= allowed_uses),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- PostgreSQL UPDATE ... RETURNING serializes concurrent reservations.
-- Restrict schema/table privileges to a dedicated app role in deployment.
