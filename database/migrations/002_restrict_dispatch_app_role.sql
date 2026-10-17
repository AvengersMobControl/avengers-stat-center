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
