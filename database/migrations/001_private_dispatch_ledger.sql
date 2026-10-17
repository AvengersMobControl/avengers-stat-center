-- AVENGERS #8: private publication ledger v1.
-- Apply only through reviewed Neon migration after explicit user authorization.
-- No Discord transport, tokens, public website endpoints, or source result data.
CREATE SCHEMA IF NOT EXISTS avengers_dispatch_private;
REVOKE ALL ON SCHEMA avengers_dispatch_private FROM PUBLIC;

CREATE TABLE IF NOT EXISTS avengers_dispatch_private.publication_slots (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('piggy','flash','kraken','space')),
  event_id text NOT NULL CHECK (length(event_id) BETWEEN 6 AND 140),
  event_time_clan text NOT NULL CHECK (event_time_clan IN ('AVENGERS','AV-2')),
  status text NOT NULL DEFAULT 'awaiting_manual_receipt'
    CHECK (status IN ('awaiting_manual_receipt','active','awaiting_old_retirement','manual_reconciliation_required')),
  row_version bigint NOT NULL DEFAULT 0 CHECK (row_version >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind,event_id,event_time_clan),
  CHECK (event_id LIKE kind || '|%')
);

CREATE TABLE IF NOT EXISTS avengers_dispatch_private.send_intents (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slot_id bigint NOT NULL REFERENCES avengers_dispatch_private.publication_slots(id) ON DELETE RESTRICT,
  intent_kind text NOT NULL CHECK (intent_kind IN ('first','correction')),
  intent_status text NOT NULL DEFAULT 'awaiting_manual_receipt'
    CHECK (intent_status IN ('awaiting_manual_receipt','receipt_recorded','canceled_after_manual_reconciliation')),
  plan_sha256 text NOT NULL CHECK (plan_sha256 ~ '^[0-9a-f]{64}$'),
  projection_sha256 text NOT NULL CHECK (projection_sha256 ~ '^[0-9a-f]{64}$'),
  image_sha256 text NOT NULL CHECK (image_sha256 ~ '^[0-9a-f]{64}$'),
  template_version text NOT NULL CHECK (length(template_version) BETWEEN 5 AND 80),
  edition text NOT NULL CHECK (length(edition) BETWEEN 65 AND 600),
  destination_channel_id text NOT NULL CHECK (destination_channel_id ~ '^[0-9]{15,22}$'),
  approved_by text NOT NULL CHECK (length(approved_by) BETWEEN 1 AND 120),
  approved_at timestamptz NOT NULL,
  approved_for_automatic_send boolean NOT NULL DEFAULT FALSE CHECK (approved_for_automatic_send = FALSE),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CHECK ((intent_status = 'awaiting_manual_receipt' AND resolved_at IS NULL)
      OR (intent_status <> 'awaiting_manual_receipt' AND resolved_at IS NOT NULL)),
  UNIQUE (slot_id,plan_sha256)
);
CREATE UNIQUE INDEX IF NOT EXISTS av_dispatch_one_unresolved_intent
 ON avengers_dispatch_private.send_intents(slot_id)
 WHERE intent_status = 'awaiting_manual_receipt';

CREATE TABLE IF NOT EXISTS avengers_dispatch_private.message_receipts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slot_id bigint NOT NULL REFERENCES avengers_dispatch_private.publication_slots(id) ON DELETE RESTRICT,
  intent_id bigint NOT NULL UNIQUE REFERENCES avengers_dispatch_private.send_intents(id) ON DELETE RESTRICT,
  discord_channel_id text NOT NULL CHECK (discord_channel_id ~ '^[0-9]{15,22}$'),
  discord_message_id text NOT NULL CHECK (discord_message_id ~ '^[0-9]{15,22}$'),
  projection_sha256 text NOT NULL CHECK (projection_sha256 ~ '^[0-9a-f]{64}$'),
  image_sha256 text NOT NULL CHECK (image_sha256 ~ '^[0-9a-f]{64}$'),
  template_version text NOT NULL CHECK (length(template_version) BETWEEN 5 AND 80),
  receipt_status text NOT NULL DEFAULT 'active'
    CHECK (receipt_status IN ('active','awaiting_manual_retirement','retired')),
  proof_method text NOT NULL CHECK (proof_method IN ('human_attestation','authenticated_discord_png_sha256')),
  verified_by text NOT NULL CHECK (length(verified_by) BETWEEN 1 AND 120),
  verified_at timestamptz NOT NULL,
  retired_at timestamptz,
  retirement_verified_by text,
  CHECK ((receipt_status = 'retired' AND retired_at IS NOT NULL AND retirement_verified_by IS NOT NULL)
    OR (receipt_status <> 'retired' AND retired_at IS NULL AND retirement_verified_by IS NULL)),
  UNIQUE (discord_channel_id,discord_message_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS av_dispatch_one_current_message
 ON avengers_dispatch_private.message_receipts(slot_id)
 WHERE receipt_status = 'active';
CREATE UNIQUE INDEX IF NOT EXISTS av_dispatch_one_retiring_message
 ON avengers_dispatch_private.message_receipts(slot_id)
 WHERE receipt_status = 'awaiting_manual_retirement';

CREATE TABLE IF NOT EXISTS avengers_dispatch_private.audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slot_id bigint NOT NULL REFERENCES avengers_dispatch_private.publication_slots(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN (
    'manual_authorization_recorded','manual_receipt_recorded','api_receipt_recorded',
    'replacement_receipt_recorded','old_message_retirement_attested',
    'manual_reconciliation_required','manual_intent_canceled')),
  actor text NOT NULL CHECK (length(actor) BETWEEN 1 AND 120),
  happened_at timestamptz NOT NULL DEFAULT now(),
  details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(details) = 'object')
);

CREATE TABLE IF NOT EXISTS avengers_dispatch_private.runtime_safety (
  singleton boolean PRIMARY KEY DEFAULT TRUE CHECK (singleton = TRUE),
  automatic_discord_send_enabled boolean NOT NULL DEFAULT FALSE CHECK (automatic_discord_send_enabled = FALSE),
  automatic_discord_delete_enabled boolean NOT NULL DEFAULT FALSE CHECK (automatic_discord_delete_enabled = FALSE),
  publication_endpoint_enabled boolean NOT NULL DEFAULT FALSE CHECK (publication_endpoint_enabled = FALSE)
);
INSERT INTO avengers_dispatch_private.runtime_safety(singleton)
 VALUES (TRUE) ON CONFLICT (singleton) DO NOTHING;

-- Existing Neon role is a dedicated login, but no data has been written yet.
-- Grant only the private schema/table operations needed for a later reviewed adapter.
-- No table DELETE or TRUNCATE privileges, no ability to edit immutable audit rows.
GRANT USAGE ON SCHEMA avengers_dispatch_private TO avengers_dispatch_app;
GRANT SELECT, INSERT, UPDATE ON avengers_dispatch_private.publication_slots,
  avengers_dispatch_private.send_intents,
  avengers_dispatch_private.message_receipts TO avengers_dispatch_app;
GRANT SELECT, INSERT ON avengers_dispatch_private.audit_events TO avengers_dispatch_app;
GRANT SELECT ON avengers_dispatch_private.runtime_safety TO avengers_dispatch_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA avengers_dispatch_private TO avengers_dispatch_app;
