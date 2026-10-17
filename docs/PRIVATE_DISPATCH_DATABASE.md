## October 16/17 — Restricted runtime role design (prepared, NOT yet production)

**Access-control finding:** Neon `create_postgres_role` placed `avengers_dispatch_app` in the elevated `neon_superuser` group with both `INHERIT` and `SET ROLE` permissions. It could DELETE private ledger rows and modify the supposedly hard-off runtime safety flags despite no direct grants. The production account's SQL role **cannot revoke** the managed `neon_superuser` membership (`permission denied`). Do NOT use or advertise that auto-created role as least privilege.

**Working alternative:** A **SQL-created** `avengers_dispatch_runtime` role, using PostgreSQL defaults, was prepared on a **temporary** Neon branch. Verified `rolsuper=false`, `rolcreaterole=false`, `rolcreatedb=false`, `rolcanlogin=true`, with **zero inherited roles**. It has only `CONNECT` to this DB, `USAGE` on `avengers_dispatch_private`, `SELECT/INSERT/UPDATE` on publication slots/intents/receipts, `SELECT/INSERT` on private audit events and `SELECT` on kill switches. Effective privilege queries verified `slots INSERT=true`, `slots DELETE=false`, `audit INSERT=true`, `audit UPDATE=false`, `safety SELECT=true`, `safety UPDATE=false`, `database CREATE=false`. All kill switches stayed FALSE, source data/receipts zero. Actual limited-role login **not yet tested**, because the SQL-created role has `rolpassword=NULL`.

Versioned migration: `database/migrations/002_restrict_dispatch_app_role.sql` (**historical filename**, contents actually create `avengers_dispatch_runtime`; leave the old elevated role unused). The **exact executable SQL** is provided without leading commentary because Neon's migration parser rejected commented versions with a syntax error. Only use the reviewed SQL, not ad hoc GRANTs. New static Node regression and CI ensure no elevated role membership, DELETE/TRUNCATE/CREATE, kill-switch writes or hardcoded credentials.

- **Neon prepared migration:** `7ae71335-068f-48cb-abf8-73bee07abad8`
- **Temporary branch:** `br-holy-credit-b5isd6p4` (reviewed test branch; NO production application yet)
- **Parent production branch:** `br-hidden-sound-b59pbiav`
- **Project / database:** `wandering-dream-60244468` / `avengers_private`
- **Production Vercel secret:** existing encrypted `AVENGERS_DISPATCH_DATABASE_URL` **still uses owner credentials**; no secret rotation or runtime changes yet.

**Next explicit approval required:** Neon `complete_database_migration` for the exact versioned SQL, followed by production read-only inspection. Neither tests nor a GitHub merge authorize applying to production automatically. Password initialization must be done *separately* through an authorized private secrets channel: Neon cannot reset a role with a null password (HTTP 422); the available tool would require setting a cryptographically strong initial password by a protected mechanism first. NEVER commit/embed passwords, print connection strings, or insert secrets in CI logs. After that, validate an actual session as restricted role, and only then rotate Vercel's **production-only encrypted secret**, with a tested rollback procedure. Do not expose a serverless handler or activate Discord sends/deletes until end-to-end verification and separate leader approval. The old elevated auto-created role should be disabled only after explicit reviewed migration, if confirmed unused.

Superseded earlier test branch `br-young-glitter-b5xbpfh0` was canceled and deleted; the current test branch `br-holy-credit-b5isd6p4` is the only prepared role migration. No public website, roster, historical Sparks, accepted event payout or approved PNG changes.

---

## Current production deployment — VERIFIED (2026-10-16/17)
**This section supersedes the historical temporary-branch status below.** Leader explicitly approved the production migration and cleanup. Migration `4e339ecb-c779-44c1-a5da-9c3c786e74b3` was applied to Neon project `wandering-dream-60244468` / branch `br-hidden-sound-b59pbiav` / DB `avengers_private` from the reviewed `001_private_dispatch_ledger.sql`. All five tables, three uniqueness safety indexes, six-column intent/receipt FK, zero ledger/audit rows and three hard-off runtime flags were verified on actual production. The approved temporary branch `br-fragrant-night-b5le2syd` and older superseded `br-curly-voice-b5qqhmoy` are **both deleted**, leaving production alone. The Vercel `AVENGERS_DISPATCH_DATABASE_URL` remains encrypted and production-only.

**Critical unresolved permission issue:** Neon-created `avengers_dispatch_app` inherits an elevated role. The migration granted it no additional explicit privileges; this **does not** neutralize its inherited privileges. Vercel also currently has an owner-level database connection. No live serverless/public endpoint may use these credentials until a truly restricted role is independently verified and the production application credential is rotated. No Discord transport, send/delete operation or automatic publishing was enabled. Further runtime integration and explicit authorization remain required. Everything below about *migration not yet applied* is historical pre-deployment guidance and should not be followed as current instructions.

---

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
