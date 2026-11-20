BEGIN;
CREATE TABLE IF NOT EXISTS avengers_identity_private.roster_editor_changes (
  revision integer PRIMARY KEY CHECK (revision > 0),
  request_id uuid UNIQUE NOT NULL,
  submitted_by text NOT NULL CHECK (submitted_by ~ '^[0-9]{17,22}$'),
  operation jsonb NOT NULL CHECK (jsonb_typeof(operation) = 'object'),
  submitted_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON avengers_identity_private.roster_editor_changes FROM PUBLIC;
GRANT SELECT, INSERT ON avengers_identity_private.roster_editor_changes TO avengers_identity_runtime;
COMMIT;
