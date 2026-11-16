# Resumable AVENGERS source intake â€” 2026-11-15

This is a **private read-only Discord screenshot collector**. It is NOT an event parser, result importer, website publisher, roster updater, PNG generator or Discord sender. Website publication still requires guarded source-bound event staging and independent live website verification.

## Why it exists

The Friday/Sunday ChatGPT automations have repeatedly stopped before publication, while task status still said "completed." Their read-only Discord connector also caps returned image previews at eight. This collector moves source enumeration and original-byte verification into repeatable Vercel/Neon code rather than relying on one uninterrupted chat.

## Execution and guarantees

- Production Vercel Cron runs daily at 12:00 UTC and authenticates through CRON_SECRET. The pre-existing DISCORD_PULL_SECRET can also authorize a manual read-only recovery call. No unauthenticated intake run is allowed.
- Discord Bot REST obtains **complete original attachment lists** for every message in all eight configured channels, instead of relying on the client preview slice. Every attachment (including non-image and unsupported image files) gets a private source record.
- Private Neon schema avengers_results_private stores channel watermarks, within-window continuation cursors, message and attachment counts, image hashes, bounded retries, run outcomes and a concurrency lease. Raw signed URLs are not persisted, logged or published.
- A page of¶»§q«^