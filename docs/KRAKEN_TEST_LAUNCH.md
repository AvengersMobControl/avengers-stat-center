# Temporary AVENGERS Discord /kraken test launch — November 12, 2026

**User request:** Make `/kraken` visible and usable in Discord immediately so members can test submission, then replace the placeholder routes/maps with Saturday's approved data. User explicitly authorized discarding test entries. No automatic master spreadsheet import.

- Private Neon active event: `2026-11-12`, Vercel production `AVENGERS_KRAKEN_TEST_MODE=true`.
- **Dummy maps**: 56 ticket-left map positions use the synthetic placeholder `M10`. **THIS IS NOT THE REAL GAME SEQUENCE.**
- **Dummy preset**: `test-quickrun`, seven battles using sample x10/x10/x10/x10/x10/x5/x1 with alternating placeholder SR/GC. **THIS IS NOT AN APPROVED ROUTE.** `Custom Route` also available with user-selected x1/x3/x5/x10 and SR/GC.
- The member interface prominently shows a TEST ONLY banner. Guild slash response is ephemeral and identifies the test state. CSV exports are named `TEST-DO-NOT-IMPORT`; data remain isolated to event `2026-11-12`.
- The private review queue supports test submissions; the master DPT workbook **is never touched automatically**.
- One-time `/api/discord/kraken-setup` endpoint is protected by a 256-bit expiring secret stored exclusively in private Neon. This endpoint checks the bot's current application/interaction URL and existing guild commands; it refuses to replace another interaction handler or hijack an app's other slash commands. It configures the endpoint only if compatible, registers only `/kraken` for the AVENGERS guild, and verifies API readback.
- Existing backend signed Ed25519 verification, authenticated Discord guild membership, non-guest access and private Neon role restrictions remain mandatory.
- **Before real Kraken Saturday:** Use a fresh event key, set test mode to false, replace ALL 56 placeholder map records with the authoritative sequence, disable and replace the `test-quickrun` preset with confirmed real routes. Never mix or import `2026-11-12` test runs into the master workbook. Do not change/test SAC.
- After successful live registration, remove or permanently disable the one-off registration endpoint. The one-time capability is consumed.

**Status updates should be based on Discord API registration/readback and signed endpoint verification, never on a GitHub merge alone.**

## Verified live registration 2026-11-12

Discord accepted and returned command 1570681165852053565 in the AVENGERS guild, bound to the verified signed interaction endpoint. Test event/route are disposable; official Saturday sequence pending.
