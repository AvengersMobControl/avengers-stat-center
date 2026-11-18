# Resumable AVENGERS source intake

This implements ONLY private screenshot retrieval and original-byte SHA-256.
It does not parse screenshots into player rows, classify new members, approve
events, update the public event ledger, create PNGs or send Discord posts.
Only independently verified website releases constitute publication.

## Collector

- **Schedule (leader, 2026-11-18):** runs only in the hour before each posting
  run — Sunday 6 PM and Friday 7 AM America/Chicago. Vercel cron fires at
  :00/:20/:40 in both the CST and CDT UTC hours; the handler ignores calls
  outside the window, so it stays correct across daylight saving. Each call
  sweeps all eight channels, paging (50 messages a page) until every message
  inside the lookback is accounted for; if a sweep runs out of time the
  checkpoints carry over to the :20/:40 calls. Protected by CRON_SECRET.
- It reads the Discord API directly, bypassing the client connector's eight
  image cap. All original attachments are accounted for; each supported
  image is fetched from its authenticated CDN URL through the existing
  retrieveOriginal code. The original image bytes and signed URLs are
  never persisted in logs or the repository.
- Uses the EXISTING Neon avengers_results_private tables: collector_lease,
  channel_checkpoints, source_messages, source_attachments and ingest_runs.
  The source table SHA-256 receipts and cursor are durable. A failed source
  download records a private retry without advancing the page cursor.
  Previously verified attachments are reused on a retry. Lookback: 9 days.
- On completion of an older-page cycle, the next scan restarts from newest
  posts to capture new material. Repeated, overlapping runs are serialized
  per channel by the database lease.
- Success of source intake is never labeled success of result publication.
  Additional gates remain final screenshot visual confirmation, all player
  rows accounted, exact event attribution, historical aliases and identities,
  original proof binding, guarded dry-run/apply, CI, public Git SHA/projection,
  and browser verification.

## Operator controls

Private POST to /api/discord/result-intake using existing production
DISCORD_PULL_SECRET Bearer. Body channelKey selects one of the eight
configured channels. Body action=status returns a sanitized channel summary:
source cycle/checkpoint state, verified original attachment counts,
incomplete source posts, and retry counts; no Discord IDs, names or media.

The source run status is persisted in avengers_results_private.ingest_runs.
This has no Discord send pathway, no public checkpoint details, and no
connection to SAC/Lock It In.

## Deployment verification

- Required CI tests must pass, including a ten-image post and failure resume.
- Check Vercel production CRON_SECRET, bot token, database URL presence (never
  print the values) and confirm actual cron deployment and plan support.
- Verify a real private source-intake run and a subsequent resumed scan before
  declaring the collector operational.
- Existing Friday and Sunday website-release tasks stay enabled until the
  entire publication portion is independently replaced and live-verified.
