-- Native private source-intake checkpoints; no results or website scores are changed.
-- All Discord identifiers, original-byte digests and proof errors remain private.
CREATE SCHEMA IF NOT EXISTS avengers_results_private;
CREATE TABLE IF NOT EXISTS avengers_results_private.channel_checkpoints (
  channel_key text PRIMARY KEY,
  last_completed_id text,
  resume_before_id text,
  resume_upper_id text,
  last_scan_complete boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT checkpoint_resume_pair CHECK ((resume_before_id IS NULL)=(resume_upper_id IS NULL))
);
CREATE TABLE IF NOT EXISTS avengers_results_private.source_messages (
  channel_key text NOT NULL,
  message_id text NOT NULL,
  message_timestamp timestamptz NOT NULL,
  attachment_count_total int NOT NULL CHECK (attachment_count_total>=0),
  image_count int NOT NULL CHECK (image_count>=0 AND image_count<=attachment_count_total),
  progress_hint boolean NOT NULL DEFAULT false,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(channel_key,message_id)
);
CREATE TABLE IF NOT EXISTS avengers_results_private.source_attachments (
  channel_key text NOT NULL,
  message_id text NOT NULL,
  attachment_id text NOT NULL,
  filename text NOT NULL,
  content_type text,
  expected_size bigint,
  status text NOT NULL CHECK(status IN
    ('pending','retry','verified_bytes','blocked','unsupported','not_image')),
  attempts int NOT NULL DEFAULT 0,
  next_retry_at timestamptz NOT NULL DEFAULT now(),
  image_sha256 text CHECK(image_sha256 IS NULL OR image_sha256 ~ '^[a-f0-9]{64}$'),
  byte_length bigint,
  verified_at timestamptz,
  last_error_code text,
  PRIMARY KEY(channel_key,attachment_id),
  FOREIGN KEY(channel_key,message_id)
    REFERENCES avengers_results_private.source_messages(channel_key,message_id)
);
CREATE INDEX IF NOT EXISTS source_attachments_pending
  ON avengers_results_private.source_attachments(status,next_retry_at);
CREATE TABLE IF NOT EXISTS avengers_results_private.collector_lease (
  lease_name text PRIMARY KEY,
  owner_id uuid NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS avengers_results_private.ingest_runs (
  run_id uuid PRIMARY KEY,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL,
  summary jsonb
);
CREATE INDEX IF NOT EXISTS results_ingest_runs_started
  ON avengers_results_private.ingest_runs(started_at DESC);
REVOKE ALL ON SCHEMA avengers_results_private FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA avengers_results_private FROM PUBLIC;
