# AVENGERS private Discord publication database — migration approval required

**State (2026-10-16/17):** PostgreSQL 17 Neon project `avengers-stat-center-private`, database `avengers_private`, connected to Vercel project `league-hq/avengers-stat-center` via encrypted **production-only** `AVENGERS_DISPATCH_DATABASE_URL`. The app is not using it to publish anything. No actual Discord message IDs, screenshots, bot tokens, payout figures or personal secrets are committed to GitHub.

## Prepared, not applied in production

`database/migrations/001_private_dispatch_ledger.sql` creates a private namespace with five tables:

| Table | Purpose |
|---|---|
| `publication_slots` | One unique event type + event ID + **event-time clan**; status and optimistic version |
| `send_intents` | Explicit plan/edition/source SHA approval; one unresolved intent per event; no automatic sending |
| `message_receipts` | Private posted message/channel IDs, PNG digest, verification type and retirement state |
| `audit_events` | Private append-only receipt/authorization history, no public exports |
| `runtime_safety` | Hard database CHECK constraints: automatic Discord send/delete and publication endpoint flags always **FALSE** |

Indexes limit each publication to one current message, one message awaiting manual retirement and one unresolved send intent. One receipt is globally unique per Discord message identity. A six-column composite foreign key binds a receipt to its intended event **and** Discord channel, projection/image hashes and template version, avoiding wrong-channel or wrong-image receipts. All message IDs are strings, never JavaScript floating-point integers. Foreign keys are RESTRICTive; there is no drop/truncate/delete in the migration.

Temporary Neon branch (last prepared version) was validated by read-only SQL: **5 tables, all expected unique indexes, cross-intent foreign key, all kill switches false, no rows, zero explicit application-role grants**. No new tables exist in production; temporary migration must not be mistaken for deployment.

## Security finding: role still elevated

Neon's `create_postgres_role` API created `avengers_dispatch_app` **with inherited `neon_superuser` membership, including SET ROLE**. Even with narrow-looking table grants it effectively has elevated privileges. The reviewed migration deliberately grants this role **NO** table privileges. Do **not** use its current credentials for a public/serverless endpoint. The current Vercel encrypted DATABASE_URL uses a database-owner account; that connection must likewise NOT be exposed to a public request handler.

Provision a genuinely nonprivileged credential, verify **effective** privileges (`has_table_privilege`, `pg_auth_members`, `pg_roles`, not only explicit GRANT rows), and rotate the server-only production connection to that restricted role before any live publication workflow. That requires a separate reviewed role/access migration. PostgreSQL row-level locks, an atomic transaction and CAS on `row_version` are needed for any future adapter; a schema alone is not a proven idempotent transport.

## How to proceed

1. Explicit leader approval is required to apply the currently **prepared** migration on Neon production and to clean up the superseded temporary migration branch. Use the Neon migration tool's `complete_database_migration` with the migration context from the preparation step and the exact SQL file. Until approved, do NOT apply it. The current prepared migration ID is `4e339ecb-c779-44c1-a5da-9c3c786e74b3`; its temporary branch is `br-fragrant-night-b5le2syd` and parent production branch is `br-hidden-sound-b59pbiav`. A superseded first-attempt temporary branch `br-curly-voice-b5qqhmoy` must be explicitly deleted only after authorization. Project ID: `wandering-dream-60244468`. Database: `avengers_private`.
2. After approval, verify production five-table schema, private permissions, zero message rows, kill switches false, exact deploy SHA and no public API endpoint.
3. Separately define restricted app-role privileges, private API authentication, allowed guild/target channels, signed review authorization, posted PNG SHA verification, unknown-outcome reconciliation and explicit correction deletion approval. Tests must simulate concurrent sends, crashes and permission failures before the first real Discord message.
4. Do not activate automatic message publication, deletion, the UTC roster pipeline or unreviewed result ingest. The previously approved Space and temporarily approved Piggy, Flash and Kraken templates remain unchanged.

**No Discord sends/deletes are authorized by this database migration or by temporary approval of PNG appearance.** Project records: issue #8, ROADMAP, DECISION_LOG and PROJECT_CONTINUITY.
