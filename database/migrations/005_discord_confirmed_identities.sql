-- PRIVATE AVENGERS identity links. Confirmed usernames and IDs are stored
-- exclusively in private Neon, not seeded into this public migration.
CREATE SCHEMA IF NOT EXISTS avengers_identity_private;
CREATE TABLE IF NOT EXISTS avengers_identity_private.discord_bindings (
  discord_username text NOT NULL CHECK (discord_username ~ '^[a-z0-9._]{2,32}$'),
  canonical_name text NOT NULL CHECK (length(canonical_name) BETWEEN 2 AND 128),
  discord_user_id text CHECK (discord_user_id IS NULL OR discord_user_id ~ '^[0-9]{17,22}$'),
  expected_joined_at timestamptz NOT NULL,
  source text NOT NULL DEFAULT 'leader-confirmed-2026-11-12',
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (discord_username,canonical_name)
);
REVOKE ALL ON SCHEMA avengers_identity_private FROM PUBLIC;
REVOKE ALL ON avengers_identity_private.discord_bindings FROM PUBLIC;
-- Provision avengers_identity_runtime as a non-superuser READ-ONLY role first.
GRANT USAGE ON SCHEMA avengers_identity_private TO avengers_identity_runtime;
GRANT SELECT ON avengers_identity_private.discord_bindings TO avengers_identity_runtime;
GRANT UPDATE (discord_user_id,verified_at) ON avengers_identity_private.discord_bindings TO avengers_identity_runtime;
-- No INSERT, DELETE, route strategy, or SAC access to this runtime role.
