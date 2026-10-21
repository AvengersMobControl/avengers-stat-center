-- AVENGERS #8: allow the reviewed automatic-Piggy dispatcher to be activated.
-- Defaults remain OFF. No flags are enabled by this migration.
ALTER TABLE avengers_dispatch_private.runtime_safety
  DROP CONSTRAINT IF EXISTS runtime_safety_automatic_discord_send_enabled_check;
ALTER TABLE avengers_dispatch_private.runtime_safety
  ADD CONSTRAINT runtime_safety_automatic_discord_send_requires_endpoint
  CHECK (NOT automatic_discord_send_enabled OR publication_endpoint_enabled);
ALTER TABLE avengers_dispatch_private.runtime_safety
  DROP CONSTRAINT IF EXISTS runtime_safety_publication_endpoint_enabled_check;
-- Automatic deletion remains hard-OFF, including when the send endpoint is active.
ALTER TABLE avengers_dispatch_private.runtime_safety
  DROP CONSTRAINT IF EXISTS runtime_safety_automatic_discord_delete_enabled_check;
ALTER TABLE avengers_dispatch_private.runtime_safety
  ADD CONSTRAINT runtime_safety_automatic_discord_delete_hard_off
  CHECK (automatic_discord_delete_enabled = FALSE);
ALTER TABLE avengers_dispatch_private.send_intents
  DROP CONSTRAINT IF EXISTS send_intents_approved_for_automatic_send_check;
