-- AVENGERS issue #8. Restricted private database app role ONLY.
-- Execute in Neon prepared temporary branch first. Production requires review.
-- No Discord sends/deletes, no table rows changed, no public API endpoints.
-- Neon-created role initially inherits elevated neon_superuser membership:
-- REVOKE is mandatory: NOINHERIT alone is unsafe because SET ROLE can elevate.
REVOKE neon_superuser FROM avengers_dispatch_app;
ALTER ROLE avengers_dispatch_app NOSUPERUSER NOCREATEDB NOCREATEROLE
  NOREPLICATION NOBYPASSRLS;
REVOKE ALL PRIVILEGES ON DATABASE avengers_private FROM avengers_dispatch_app;
GRANT CONNECT ON DATABASE avengers_private TO avengers_dispatch_app;
GRANT USAGE ON SCHEMA avengers_dispatch_private TO avengers_dispatch_app;
GRANT SELECT, INSERT, UPDATE ON
  avengers_dispatch_private.publication_slots,
  avengers_dispatch_private.send_intents,
  avengers_dispatch_private.message_receipts
  TO avengers_dispatch_app;
GRANT SELECT, INSERT ON avengers_dispatch_private.audit_events TO avengers_dispatch_app;
GRANT SELECT ON avengers_dispatch_private.runtime_safety TO avengers_dispatch_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA avengers_dispatch_private
  TO avengers_dispatch_app;
-- No DELETE, TRUNCATE, CREATE, DDL, audit UPDATE, safety UPDATE,
-- GRANT OPTION or membership in any elevated role.
-- Existing Vercel DATABASE_URL remains owner credential until a separately
-- approved verified secret swap, with rollback/backups documented.
