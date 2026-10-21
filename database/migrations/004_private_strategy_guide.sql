-- AVENGERS private strategy knowledge archive. DDL only; no messages or credentials.
-- Apply ONLY to the AVENGERS Neon database after migration review.
CREATE SCHEMA IF NOT EXISTS avengers_guide_private;
REVOKE ALL ON SCHEMA avengers_guide_private FROM PUBLIC;

CREATE TABLE IF NOT EXISTS avengers_guide_private.source_messages (
  message_id text PRIMARY KEY CHECK (message_id ~ '^[0-9]{17,22}$'),
  guild_id text NOT NULL CHECK (guild_id ~ '^[0-9]{17,22}$'),
  channel_id text NOT NULL CHECK (channel_id ~ '^[0-9]{17,22}$'),
  parent_channel_id text,
  author_id text,
  author_name text NOT NULL DEFAULT '',
  source_timestamp timestamptz NOT NULL,
  edited_timestamp timestamptz,
  reply_to_message_id text,
  source_url text NOT NULL,
  body text NOT NULL DEFAULT '',
  embed_text text NOT NULL DEFAULT '',
  attachment_metadata jsonb NOT NULL DEFAULT '[]'::jsonb,
  candidate_topics text[] NOT NULL DEFAULT ARRAY[]::text[],
  pinned boolean NOT NULL DEFAULT false,
  deleted_on_discord boolean NOT NULL DEFAULT false,
  first_observed_at timestamptz NOT NULL DEFAULT now(),
  last_observed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS guide_msg_channel_time ON avengers_guide_private.source_messages(channel_id,source_timestamp DESC);
CREATE INDEX IF NOT EXISTS guide_msg_topics ON avengers_guide_private.source_messages USING gin (candidate_topics);

CREATE TABLE IF NOT EXISTS avengers_guide_private.channel_backfills (
  channel_id text PRIMARY KEY CHECK (channel_id ~ '^[0-9]{17,22}$'),
  parent_channel_id text,
  cutoff_at timestamptz,
  priority text NOT NULL DEFAULT 'normal' CHECK(priority IN('primary','normal')),
  next_before_message_id text,
  fetched_pages integer NOT NULL DEFAULT 0 CHECK(fetched_pages>=0),
  fetched_messages bigint NOT NULL DEFAULT 0 CHECK(fetched_messages>=0),
  earliest_fetched_at timestamptz,
  latest_fetched_at timestamptz,
  finished boolean NOT NULL DEFAULT false,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS avengers_guide_private.reviewed_tips (
  tip_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  topic text NOT NULL,
  statement text NOT NULL,
  conditions text NOT NULL DEFAULT '',
  review_state text NOT NULL DEFAULT 'reported'
    CHECK(review_state IN('reported','corroborated','tested','superseded','disputed')),
  source_message_ids text[] NOT NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON ALL TABLES IN SCHEMA avengers_guide_private FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA avengers_guide_private FROM PUBLIC;
-- Do NOT grant access to avengers_dispatch_runtime or avengers_guest_runtime.
-- Dedicated guide runtime credential/role and OAuth server gate are separate.
