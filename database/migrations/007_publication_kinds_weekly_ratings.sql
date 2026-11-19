-- Allow the weekly recap (activated 2026-11-09) and the weekly Player Power Ratings
-- poster (2026-11-19) in the send-once ledger. Widening only: every existing row
-- still satisfies the new check. Without this, a 'weekly' or 'ratings' reservation
-- fails the CHECK and the publisher can never send them.
ALTER TABLE avengers_dispatch_private.publication_slots
  DROP CONSTRAINT publication_slots_kind_check,
  ADD CONSTRAINT publication_slots_kind_check
    CHECK (kind = ANY (ARRAY['piggy','flash','kraken','space','weekly','ratings']));
