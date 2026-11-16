# Resumable AVENGERS source intake — 2026-11-15

This is a **private read-only Discord screenshot collector**. It is NOT an event parser, result importer, website publisher, roster updater, PNG generator or Discord sender. Website publication still requires guarded source-bound event staging and independent live website verification.

## Why it exists

The Friday/Sunday ChatGPT automations have repeatedly stopped before publication, while task status still said "completed." Their read-only Discord connector also caps returned image previews at eight. This collector moves source enumeration and original-byte verification into repeatable Vercel/Neon code rather than relying on one uninterrupted chat.

## Execution and guarantees

- Production Vercel Cron runs daily at 12:00 UTC and authenticates through CRON_SECRET. The pre-existing DISCORD_PULL_SECRET can also authorize a manual read-only recovery call. No unauthenticated intake run is allowed.
- Discord Bot REST obtains **complete original attachment lists** for every message in all eight configured channels, instead of relying on the client preview slice. Every attachment (including non-image and unsupported image files) gets a private source record.
- Private Neon schema avengers_results_private stores channel watermarks, within-window continuation cursors, message and attachment counts, image hashes, bounded retries, run outcomes and a concurrency lease. Raw signed URLs are not persisted, logged or published.
- A page of messages and all its attachment metadata must be saved before the cursor advances. If a run stops mid-window, its next invocation continues from the saved boundary; a new post received during that continuation is discovered after it completes. Writes are idempotent.
- Original Discord CDN bytes are retrieved with the repository's proven retrieveOriginal validator (strict source URL, matching attachment IDs, content type, length and signature); SHA-256 is stored privately. A checksum is **not** proof that a screenshot depicts final CLAIM results or that all player rows were imported.
- A failed source download stays in a bounded retry queue; repeated failures become blocked, never silently successful. An unscanned channel, pending/blocked proof, unsupported image or incomplete pagination means **incomplete**, never "no-change."
- A daily GitHub Actions job independently checks the public health endpoint; it returns only dates, status and aggregate counts. Its failure is not a website publication and cannot be misreported as one.

## Review and actual website publication (separate)

The authorized website-only ChatGPT/agent review must still inspect original final screenshots, correlate every visible in-scope clan row, resolve canonical historical aliases, hold ambiguous identities privately, and apply only verified new rows through assemble-result-review and stage-event-update with current digest and standing authorization. Run the complete projection/CI/browser verification and compare exact public Git SHA and versioned exports. Record only sanitized counts/dates/hashes in public issue #4. Never infer website success from a native intake heartbeat or Vercel preview.

## Deployment

Run database/migrations/006_private_results_intake.sql against the existing private AVENGERS dispatch database, configure a production-only encrypted CRON_SECRET (existing DISCORD_BOT_TOKEN and AVENGERS_DISPATCH_DATABASE_URL are reused), and deploy. Check node --test scripts/results-intake-core.test.cjs, all required release tests, an authorized source-intake invocation and the independent health endpoint.

The daily cron provides durable backfill and recovery; it does not guarantee that Friday/Sunday events are already published. Those schedules remain enabled until an independently verified automatic website publisher fully replaces them. No duplicate ChatGPT scheduled task is introduced.
