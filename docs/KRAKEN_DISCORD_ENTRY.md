# AVENGERS private `/kraken` member entry — stage gate

Status: server-side code and private Neon tables are provisioned. **No live route data or confirmed command registration yet.** The leader will provide the full map sequence and the official preset routes on Saturday. No fabricated map positions, ticket plans or strategy are seeded in public code or private production.

## Member flow
- Discord `/kraken` replies **ephemerally** with a link to a verified Discord OAuth member-only Vercel form.
- Choose verified game account (two distinct Frenchie accounts can share the same Discord user ID); if not yet linked, the submission remains explicitly unlinked for leader review.
- Choose approved preset route or Custom Route. Both use the **same one-battle-at-a-time** mobile form.
- Each battle shows automatic battle number, tickets left and map. Presets also auto-fill ticket count and SR/GC loadout; Custom lets members select x1/x3/x5/x10 and SR/GC. Enter damage (M) and optional notes. Save; undo; resume later.
- All 56 tickets must be accounted for before submission. Only the server computes maps, ticket balances and preset selections.
- Submitted data is private and locked pending the leader's review. Leader may correct damage and notes, approve/reject, and export approved runs as spreadsheet-compatible CSV; **no automatic master workbook import**. Duplicate imports must be checked using the stable run ID.
- Member identity resolution uses already-private Neon `avengers_identity_private.discord_bindings` and requires a verified Discord snowflake. Unlinked profiles are kept flagged rather than inferred from mutable nicknames.

## Security
- Route definitions, map sequence, presets, battle performance and analytical data live **only in private Neon**. This public repo contains generic validation/schema/UI source code but no proprietary route inputs.
- Guild membership verified on every request; guest, permanent guest and anonymous sessions denied. Reviewer role derived from Discord server owner/Admin/Manage Guild or private reviewer allowlist. All APIs use no-store, an exact POST Origin + JSON-only gate, and private database grants.
- Command interactions must verify raw Ed25519 bytes and respond only with ephemeral text/link; no result or strategy posted to Discord.
- Sensitive database URL and origin are Vercel **server-side** production environment settings.
- Private runtime role can SELECT routes/map lookups, write member drafts and battle entries, append audits, and cannot edit private routing strategy tables.

## Launch blockers
1. Leader's **Saturday official 56-ticket map sequence** and selectable route prescriptions, loaded into private Neon after validation.
2. Set correct Kraken event date in production `AVENGERS_KRAKEN_ACTIVE_EVENT`; keep unset until ready.
3. Configure Discord app public key `DISCORD_PUBLIC_KEY` server-side and register the guild `/kraken` command only after verifying a signed PING and non-guest access.
4. CI pass plus production Vercel endpoint authentication tests. Verify no private data in static Pages exports.
5. One supervised complete member run and review CSV; do not auto-import master spreadsheet.
