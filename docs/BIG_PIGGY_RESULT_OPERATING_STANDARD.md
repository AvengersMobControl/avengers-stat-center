# Big Piggy Race Results — Operating Standard

**Updated:** 2026-10-21  
**Scope:** AVENGERS Mob Control Stat Center only; covers both event-time AVENGERS and AV-2 results. Never apply to SAC / Lock It In.  
**Current status:** review-only. This document does not enable scheduled collection, imports, or Discord posting.

## 1. What this covers

“Big Piggy” means a normal **Piggy Race** event, not Piggy Flash PF1–PF4. One event may have separate lobbies and separate event-time clan attribution. Keep the source review, canonical website update, PNG, accompanying message, and Discord dispatch tied to one immutable accepted event version.

The stable source event identity is **piggy|YYYY-MM-DD**, using the date assigned to the race in the canonical event source and the America/Chicago event schedule. Do not derive the event date from when a screenshot was posted. Each report is scoped to one event and one clan; AVENGERS and AV-2 are separate publications.

## 2. Current verified state — automation is not enabled

As checked on 2026-10-21:

- Vercel has a production-only fixed destination configured for Discord **Performance Statistics**, channel **1470175579058999386**. That is routing configuration, not an active sender.
- A supervised one-shot synthetic PNG/message canary succeeded, including authenticated Discord readback and duplicate-attempt rejection. It proved the transport only; it was not a real race report and did not approve a template or activate automation.
- The live Neon production row in **avengers_dispatch_private.runtime_safety** was queried using the restricted runtime role. **automatic_discord_send_enabled = false**, **automatic_discord_delete_enabled = false**, and **publication_endpoint_enabled = false**.
- The repository has no Big Piggy collection/dispatch cron in **vercel.json**, and no GitHub Actions workflow that automatically pulls Piggy results and posts the resulting report. The Pages workflow tests and renders preview PNGs; it does not post to Discord.
- **docs/EVENT_PNGS.md** remains review-only. The summary sidecar and planner do not authorize a send.

Therefore there is currently no unattended end-to-end flow that detects race completion, collects and verifies screenshots, imports results, renders a final PNG and message, and posts them. Result retrieval/import and publication must remain explicitly reviewed until the separate automation rollout is implemented, tested, and activated.

The existing Piggy reporting rules live in **docs/PIGGY_REPORTING_STANDARD.md**. This document adds the operational source-to-site-to-report sequence; it does not replace those content/design requirements.

## 3. Event trigger and source collection

1. Confirm the race’s actual scheduled end in America/Chicago. The current Piggy standard records the Friday **2026-10-23 02:00** end for the upcoming race. This time is a trigger reference, not proof that a deployed watcher is running.
2. Do not create a second schedule if an existing one is claimed to exist. First verify its deployed configuration, timezone, last successful run, and actual source access. If that cannot be verified, initiate a manual review after the race ends.
3. Pull only the approved Piggy result sources: the configured **piggy** and **av2** result-channel keys, as applicable. The connected screenshot pull is read-only; it does not prove completeness, import results, or authorize posting. Current result-channel pulls are explicitly initiated, not silently run.
4. Paginate the full event window using **docs/RESULT_REVIEW_PIPELINE.md** and **scripts/audit-result-pagination.cjs**. The connector returns at most eight images per call. If a page hits the eight-image cap, use the documented overlap cursor (the second-oldest returned message) so a multi-attachment message at the boundary is not silently truncated. If one message alone fills the cap, stop as blocked. Continue until the documented date boundary is proven; do not treat one full page as complete coverage.
5. Visually classify every candidate image as final, preliminary, progress, or unrelated. Only a final scoreboard can support final results. A high score, a reward amount, or an image digest does not prove the image is final.
6. For each final screenshot, retrieve and verify the actual original Discord CDN bytes with **scripts/fetch-original-discord-image.cjs** and bind the returned SHA-256 receipt to the exact image manually reviewed. A ChatGPT/connector preview, re-encoded WebP, message ID, attachment ID, or URL hash is not an original-image proof.
7. Keep signed URLs, raw images, message/attachment IDs, and private proof manifests out of the public repository, static site, public artifacts, and ordinary logs.

## 4. Transcription and result validation

Record the event date, event-time clan, lobby identity, original game rank, canonical player identity, lines, and Stars/Sparks only when supported by the source. Preserve unknown values as unknown; never convert missing rewards to zero. Record actual source rank, not a re-ranking based on lines.

- **Separate lobbies stay separate.** Never combine two small lobbies to meet a participation threshold or compare one lobby’s rank against another lobby’s rank. Use the game’s actual rank and the correct lobby cohort.
- **Overlapping screenshots:** deduplicate only when canonical player identity, event-time clan, lobby, and original rank establish the same row. Repeated values must agree. Any conflicting score, reward, clan, or rank blocks the candidate until resolved against the originals.
- **One line means nonparticipation** for Piggy and Piggy Flash, per the 2026-10-21 decision. Retain the original source evidence, but exclude those placeholder rows from participation, totals, averages, event counts, PBs, first appearances, rankings, profiles, and report denominators.
- **Clan attribution is event-time attribution.** Current roster membership does not rewrite historic results. Resolve aliases through the approved identity map; do not merge similar-looking accounts or invent Discord IDs.
- **Coverage is explicit.** A partial/cropped leaderboard remains partial unless the source set independently establishes completeness. Do not infer that missing ranks contain no clan members unless reliable source evidence establishes that fact for that event.
- **Totals must reconcile.** Recalculate unique participating rows, total lines, average lines per participating player, source-known Stars and Sparks, per-lobby rank uniqueness, and clan/event totals. Report known sums separately from missing values. A source screenshot’s rounded whole-lobby pot is not the clan’s earned Stars.
- **PBs are independent metrics.** Line PBs compare actual lines with the player’s prior qualifying line PB. Finishing-place PBs use actual source rank, not lines: at least **30 distinct AVENGERS participants in the same lobby** for an AVENGERS Piggy Race, or at least **five distinct AV-2 participants in the same lobby** for an AV-2 Piggy Race. Do not count Piggy Flashes. Transfers do not erase a player’s historical event-time clan or merge the two clan-specific PB streams.
- **First tracked is not first-ever.** Use the full accepted historical source, not only the latest screenshots or current roster. A player’s first AVENGERS Piggy participation can be their first AVENGERS appearance even if their earlier history was with AV-2.
- **AV-2 rake:** where the Piggy standard calls for RAKE %, sum the displayed share percentages for every AV-2 participant in that lobby, including participants outside the Top 10. Label it as the sum of displayed shares; do not substitute earned Stars divided by the whole-lobby pot. For AVENGERS, do not invent a rake formula or show it unless the approved source/report specification defines it.

## 5. Build a review packet before any canonical import

1. Assemble the candidate using **scripts/assemble-result-review.cjs**, with the private original-image proof receipts. It must fail closed for missing, mismatched, duplicated, or unused proofs.
2. Keep the candidate **unapproved** while reconciling all rows. Generate the deterministic before/after packet with **scripts/report-ingest-candidate.cjs**. It must show added, corrected, removed, unchanged, duplicate, rejected, unknown-reward, and coverage counts, plus the projection fingerprint and impacted-member/sitewide deltas.
3. Independently check the source transcript against the original final screenshots, event-time clan/lobby, original ranks, alias mappings, and reward fields. Recompute the summary metrics from the exact candidate.
4. Present the exact proposed rows/revision and review packet to the leader. Template approval is not data approval; prior approval of another race is not approval of this race. A previous result approval is not approval of a changed correction.
5. Only after explicit approval of those exact rows may the approved candidate be staged through **scripts/stage-event-update.cjs**. Do not bypass **data/ingestion-result-holds.json**; check the current hold file and latest continuity/issue state for the specific event rather than relying on older narrative text.
6. If the source is incomplete, an identity or clan is unresolved, any row conflicts, or the totals cannot be reconciled, stop and report the specific blocker. Do not publish a fabricated complete leaderboard.

## 6. Publish the canonical website data first

- Apply only the explicitly approved event update through the normal reviewed branch/PR path. No automatic import or direct production mutation.
- Rebuild the single canonical projection and every dependent view: event tables, histories, profiles, line PBs and rank PBs, averages, rankings, achievements, roster/event totals, clan-league accounting, and exports.
- Run the repository’s source/projection, site-release, six-league, Piggy PB/benchmark, and browser regression gates. Review the full data diff, not just the Piggy leaderboard.
- Do not call results “live” because a local test passes, a PR exists, or a Vercel deployment is READY. Require the exact GitHub Pages production commit, versioned exports, and post-deploy browser verification; record the Vercel mirror status separately.
- A correction that changes accepted rows must rebuild the entire dependent projection and create a new source/version fingerprint. Do not silently extend or mutate a previously published event.

## 7. Generate the PNG and written message from the same accepted version

1. Export the canonical accepted projection using **scripts/export-event-summary.cjs**.
2. Render separate clan-specific Piggy reports using **scripts/render-event-summary.py** with kind **piggy** and clan **AVENGERS** or **AV-2**. Do not generate the facts, player names, ranks, PBs, or milestones with an image model.
3. Use the pinned approved Piggy template and only original approved character assets from **docs/APPROVED_CHARACTER_ASSETS.md**. The candidate finishing-place-PB panel is a separate revised design and must not silently replace the pinned template until visually approved and versioned.
4. Follow **docs/PIGGY_REPORTING_STANDARD.md** for the required content: headline metrics, line PBs with previous/new values and dates, qualifying finishing-place PBs, first clan appearances, Top 10 by actual lines, sourced milestones and the exact benchmark legend, sensible reflow, and the coverage footer. Keep the graphic readable; accuracy and completeness outrank decoration. Do not add redundant Stars/Sparks/share columns to the Top 10.
5. Inspect the PNG visually and programmatically: dimensions, open/render success, exact names, ranks, lines, totals, PB dates and transitions, thresholds, source coverage, approved original-art hashes, and no clipped/overlapping content. Check its sidecar for matching event ID, event-time clan, projection version, template version, and PNG SHA-256.
6. Draft the accompanying Discord message from that same frozen payload/version. Use only verified accomplishments and verified player-to-Discord-ID mappings. The text and PNG must not disagree or draw facts from different versions.
7. A rendered image or message preview is still **review-only**. The current sidecar/planner must remain not-ready-to-post until the specific publication gate has been released.

## 8. Discord publication and the future automatic path

The one destination for both clans’ PNGs **and their accompanying written messages** is Discord **Performance Statistics**, channel **1470175579058999386**. Do not post the report to screenshot-intake channels or split its image and commentary across channels.

**Current behavior:** no automatic sender or scheduled Piggy dispatch is enabled. The configured channel ID and successful synthetic canary do not override the false production safety switches. Do not send a report during source review or because a race has ended.

For a future supervised one-off, show the leader the final PNG and exact message first and use only the explicitly approved edition. For unattended posting, implement and verify all of the following before a separate activation:

- A verified event-completion trigger and source collector with timezone correctness, pagination checkpoints, retries, rate-limit handling, and explicit coverage reporting.
- Final-result classification and original-CDN-byte proof; idempotent, approval-gated source import and full sitewide publication verification.
- A private, least-privilege runtime identity; server-only bot transport; fixed channel allowlist; and production readiness checks. Public Pages assets and logs must never contain tokens, private source URLs, or private Discord IDs.
- A durable unique publication identity **event kind + event ID + event-time clan**. The edition must also bind the accepted projection version, approved template version, and PNG SHA-256. Repeated requests for the same edition must be a no-op.
- Reservation/intent before send, durable receipt after send, authenticated Discord readback of exact text and image bytes, and safe handling of concurrency, crashes, uncertain timeouts, HTTP 429/retry-after, and corrected editions. Never blindly retry an uncertain send. Corrections require an approved new edition and verified replacement receipt; automatic deletion remains separately gated.
- An actual supervised test using an approved report and approved original art, not just a synthetic transport canary; tested kill switches and rollback; monitoring of missing/late events and failed receipts.
- A separately recorded activation of the automatic-send feature after the above gates pass. The operating standard itself is not activation approval.

## 9. Fail-closed checklist

Hold the import/report/send if any of these are true:

- No verified final scoreboard, original-image receipt, or event identity.
- Pagination does not prove the event window was covered, or the leaderboard coverage is incomplete but the report claims complete.
- Conflicting duplicate rows, unknown event-time clan/lobby, unresolved identity, unsupported rank, or unexplained totals.
- Unknown payouts were converted to zero, one-line placeholders were counted as participants, or a PB was derived from lines instead of actual finishing rank.
- PNG/message do not use the same accepted projection version; a revised/unapproved template or unapproved character asset is used.
- The exact PNG cannot be opened/read back, text is clipped, a key metric disagrees with the source, or the source-to-site release cannot be verified.
- A previous send is pending/uncertain, no verified receipt exists, or any required production safety flag/credential/permission/readback check fails.

**Acceptance for each Piggy event:** source coverage and original-image proofs recorded privately; exact rows and metrics approved; import applied once; sitewide projections and exact live Pages exports/browser verified; PNG and message match one immutable version; approved artwork verified; publication receipt/readback recorded. Automatic posting is a separate milestone and must remain off until its own activation gate is complete.
