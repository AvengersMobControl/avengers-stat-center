-- AVENGERS #8: create an independently restricted private runtime role.
-- Neon API-created avengers_dispatch_app inherits neon_superuser and cannot have
-- that membership revoked with current account privileges. NEVER use that role.
-- SQL CREATE ROLE deliberately avoids Neon's API-created superuser membership.
-- This role is created by SQL with PostgreSQL's restricted defaults; no
-- public handler is created and dispatch kill switches remain hard-disabled.
CREATE ROLE avengers_dispatch_runtime LOGIN;
GRANT CONNECT ON DATABASE avengers_private TO avengers_dispatch_runtime;
GRANT USAGE ON SCHEMA avengers_dispatch_private TO avengers_dispatch_runtime;
GRANT SELECT, INSERT, UPDATE ON
  avengers_dispatch_private.publication_slots,
  avengers_dispatch_private.send_intents,
  avengers_dispatch_private.message_receipts
  TO avengers_dispatch_runtime;
GRANT SELECT, INSERT ON avengers_dispatch_private.audit_events
  TO avengers_dispatch_runtime;
GRANT SELECT ON avengers_dispatch_private.runtime_safety
  TO avengers_dispatch_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA avengers_dispatch_private
  TO avengers_dispatch_runtime;
-- No GRANT OPTION, database CREATE, table DELETE/TRUNCATE, audit UPDATE,
-- kill-switch UPDATE or membership in neon_superuser. Before runtime use,
-- verify effective privileges and database-connection credentials.
