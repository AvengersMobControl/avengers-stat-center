-- AVENGERS-only private Kraken submissions. No route definitions or strategy in this public migration.
-- Apply on a private Neon branch, review grants, then promote separately.
CREATE SCHEMA IF NOT EXISTS avengers_kraken_private;
REVOKE ALL ON SCHEMA avengers_kraken_private FROM PUBLIC;

CREATE TABLE IF NOT EXISTS avengers_kraken_private.map_sequence (
  tickets_left smallint PRIMARY KEY CHECK (tickets_left BETWEEN 1 AND 56),
  map_code text NOT NULL CHECK (map_code ~ '^M([1-9]|10)$'),
  revised_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS avengers_kraken_private.routes (
  route_id text PRIMARY KEY CHECK (route_id ~ '^[a-z0-9_-]{2,40}$'),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 100),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  steps jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(steps) = 'array'),
  active boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS avengers_kraken_private.runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL CHECK (event_key ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  discord_user_id text NOT NULL CHECK (discord_user_id ~ '^[0-9]{17,22}$'),
  discord_username text NOT NULL CHECK (length(discord_username) BETWEEN 1 AND 100),
  route_id text,
  route_revision integer,
  route_snapshot jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending','approved','rejected','exported')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by text,
  review_note text,
  CHECK ((route_id IS NULL AND route_snapshot IS NULL AND route_revision IS NULL)
    OR (route_id IS NOT NULL AND route_snapshot IS NOT NULL AND route_revision IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS kraken_one_active_run_per_member
 ON avengers_kraken_private.runs(event_key,discord_user_id)
 WHERE status <> 'rejected';

CREATE TABLE IF NOT EXISTS avengers_kraken_private.battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES avengers_kraken_private.runs(id),
  battle_no smallint NOT NULL CHECK (battle_no BETWEEN 1 AND 56),
  tickets_left smallint NOT NULL CHECK (tickets_left BETWEEN 1 AND 56),
  map_code text NOT NULL CHECK (map_code ~ '^M([1-9]|10)$'),
  tickets_used smallint NOT NULL CHECK (tickets_used IN (1,3,5,10)),
  loadout text NOT NULL CHECK (loadout IN ('GC','SR')),
  damage_m numeric(15,3) NOT NULL CHECK (damage_m >= 0),
  notes text NOT NULL DEFAULT '' CHECK (length(notes) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  voided_at timestamptz,
  CHECK (tickets_used <= tickets_left)
);
CREATE UNIQUE INDEX IF NOT EXISTS kraken_one_live_battle_number
 ON avengers_kraken_private.battles(run_id,battle_no)
 WHERE voided_at IS NULL;
CREATE INDEX IF NOT EXISTS kraken_battles_live
 ON avengers_kraken_private.battles(run_id,battle_no)
 WHERE voided_at IS NULL;

CREATE TABLE IF NOT EXISTS avengers_kraken_private.audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  run_id uuid NOT NULL REFERENCES avengers_kraken_private.runs(id),
  actor_id text NOT NULL,
  action text NOT NULL CHECK (action IN
    ('start','battle_saved','undo','submit','approve','reject','edit_damage','exported')),
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON ALL TABLES IN SCHEMA avengers_kraken_private FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA avengers_kraken_private FROM PUBLIC;
-- Provision separate NON-superuser avengers_kraken_runtime in Neon.
-- After provisioning, grant this limited access; never grant to PUBLIC:
-- GRANT USAGE ON SCHEMA avengers_kraken_private TO avengers_kraken_runtime;
-- GRANT SELECT ON avengers_kraken_private.routes, avengers_kraken_private.map_sequence TO avengers_kraken_runtime;
-- GRANT SELECT,INSERT,UPDATE ON avengers_kraken_private.runs, avengers_kraken_private.battles TO avengers_kraken_runtime;
-- GRANT SELECT,INSERT ON avengers_kraken_private.audit TO avengers_kraken_runtime;
-- GRANT USAGE,SELECT ON SEQUENCE avengers_kraken_private.audit_id_seq TO avengers_kraken_runtime;
