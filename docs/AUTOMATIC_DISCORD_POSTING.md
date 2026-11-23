# Automatic Discord event posts (leader-activated 2026-10-26; weekly recap added 2026-11-09)

On 2026-10-26 the leader approved the Space, Big Pig and Flash Set poster templates and told Claude to post event results automatically: "set it up please". This activates **unattended posting for AVENGERS Space Race, Big Pig and Piggy Flash Set summaries only**. AV-2 posting stays on hold until the leader says otherwise. Kraken is not included.

On 2026-11-09 the leader extended this to the weekly recap, to be sent **alongside** the Sunday/Big Pig post once that week's six events are all posted (see `docs/DECISION_LOG.md`). The weekly recap runs under its own authorization tag (`leader-standing-auto-discord-weekly-2026-11-09`), separate from the single-event tag, and is covered in its own subsection below.

## Schedule (America/Chicago)

| When | First look for | If not there |
| --- | --- | --- |
| Sunday 7:00 PM | Big Pig | Space Race |
| Tuesday–Friday 8:00 AM | Piggy Flash Set | — |
| Wednesday–Friday 8:00 AM (same run) | Space Race | Big Pig |

"There" means the event has final results on the site (imported under the standing website authorization) and has not been posted yet. A Flash Set is posted only once **all four PFs** have final results. Each event is posted at most once (Neon `publication_slots`).

## Each posting run

1. **Import results.** Follow `docs/AUTOMATIC_WEBSITE_RESULTS.md` for the event types this run checks. Merge the results PR and verify the Pages deploy first.
2. **Find what's eligible.** Check that the event has no row yet in `avengers_dispatch_private.publication_slots` for kind / event id / clan. Event ids are `space|<date>` and `piggy|<date>`; for Flash they are `flash|<setId>` with kind `flash`.
3. **Render the poster.**
   - Run `node scripts/export-event-summary.cjs approved-summary-release.json` to write `reports/approved-summary-release.json`.
   - Big Pig: `python3 scripts/render-bigpig-poster.py reports/approved-summary-release.json <out>.png --clan AVENGERS --event-id 'piggy|<date>'`
   - Space: `python3 scripts/render-space-poster.py ... --event-id 'space|<date>'`
   - Flash Set: `python3 scripts/render-flash-poster.py ... --set-id <setId>`
4. **Check the poster.** Open the PNG and look for overlapping, clipped or empty sections. If anything is wrong, fix the renderer in a separate PR (same rules), then re-render. Do not post a poster with layout faults.
5. **Write the message.** Keep it under 2,000 characters, starting with `@everyone`, following the leader's write-up rules (kept in the scheduled task's private instructions, not in this public repo). Every number in it must come from the poster or the export.
6. **Stage the post.** Run `python3 scripts/stage-discord-post.py --kind … --event-id … --clan AVENGERS --png … --body-file … --template <templateVersion from the sidecar JSON>`. Then `git add -f assets/reports/<file>` together with `data/discord-posts.json`, open a PR, and wait for the required checks.
7. **Arm the publisher before merging.** Generate a token with `openssl rand -hex 32`. Upsert these production env vars on Vercel project `avengers-stat-center`:
   - `AVENGERS_AUTO_PUBLISH_ONCE_SHA256` = sha256(token)
   - `AVENGERS_AUTO_PUBLISH_POST` = the staged post key(s), comma-separated
   - `AVENGERS_AUTO_PUBLISH_EXPIRES_UTC` = now + 3h
   - `AVENGERS_AUTO_PUBLISH_ENABLED` stays `true`

   Never print the token anywhere persistent.
8. **Merge and wait for the deploy.** Squash-merge, then wait for the `Vercel` commit status on the merge SHA to report success.
9. **Send.** From a short-lived Vercel sandbox (network allowlist `avengers-stat-center.vercel.app` only), call `GET https://avengers-stat-center.vercel.app/api/discord/publish-event?action=preflight&post=<url-encoded key>&token=<token>`. Continue only if it returns `ok:true` and `duplicateReserved:false`. Then call `action=send` exactly once per key.
   - **Never retry a 502.** It means a possible send; the slot is left `manual_reconciliation_required`. Do not guess.
   - A 409 means the event was already posted.
   - **Reconcile an ambiguous send yourself first, before asking the leader.** `api/discord/reconcile-send.js` is gated by its own token, separate from the publish token, in `AVENGERS_RECONCILE_TOKEN_SHA256` — minted and burned the same way as the publish token (never kept around raw): generate with `openssl rand -hex 32`, set the env var to its sha256, redeploy (editing the env var alone doesn't reach the running Lambda) and wait for it to go live, call the endpoint, then immediately set `AVENGERS_RECONCILE_TOKEN_SHA256` to the sha256 of a fresh random value to burn it again. Then call `GET https://avengers-stat-center.vercel.app/api/discord/reconcile-send?post=<url-encoded key>&token=<token>` from the same kind of short-lived, network-locked sandbox used for send. It only looks at a slot already flagged `manual_reconciliation_required`, reads the last 20 messages in the destination channel with the same bot credential, and records the receipt itself if and only if it finds a message from the bot whose body, attachment filename and attachment PNG SHA-256 are all byte-for-byte identical to the pinned post (`data/discord-posts.json`). It never sends, edits or deletes anything. `found:true` closes the loop exactly like a clean automatic send; `found:false` (any `reason`) means genuinely ask the leader to check Discord — do not retry `reconcile-send` in a loop, and do not fall back to guessing a message ID.
10. **Close out.**
    - Confirm the receipt row in Neon (`message_receipts` joined to `publication_slots`).
    - Burn the token by setting `AVENGERS_AUTO_PUBLISH_ONCE_SHA256` to the sha256 of a fresh random value.
    - Stop the sandbox.
    - Push-notify the leader with the Discord link: `https://discord.com/channels/1403361698177618081/1470175579058999386/<messageId>`.

## Weekly recap (sent alongside the Sunday/Big Pig post)

Once a week's six events (one Space, four Flash PFs, one Big Pig) have all been posted under the steps above, also send the weekly recap for that week:

1. **Export the facts.** `node scripts/export-event-summary.cjs approved-summary-release.json`, then `python3 scripts/build-weekly-recap-facts.py reports/approved-summary-release.json <out>-FACTS.json --week <ISO Monday> --clan AVENGERS`. This shells out to `scripts/export-weekly-review.cjs` and `scripts/weekly-recap-flash-combined.cjs` itself; it refuses to run if the week isn't exactly 6 events.
2. **Render.** `python3 scripts/render-weekly-recap-poster.py <out>-FACTS.json <out>-REVIEW.png` (background defaults to `assets/weekly/AVENGERS_WEEKLY_RECAP_MASTER_BACKGROUND_TEMPLATE_1440w.png`).
3. **Check the poster**, same as any other — look for clipping/overlap/empty sections before going further.
4. **Write the message** the same way (under 2,000 characters, starts with `@everyone`, every number from the FACTS json).
5. **Stage it**: `python3 scripts/stage-discord-post.py --kind weekly --event-id 'weekly|<ISO Monday>' --clan AVENGERS --png <out>-REVIEW.png --body-file … --template weekly-recap-poster-v1-20261109 --week-space-event 'space|<date>' --week-flash-set-id '<setId>' --week-piggy-event 'piggy|<date>'`. The three `--week-*` refs are the week's actual Space/Flash-Set/Big-Pig event ids; the publisher verifies all three against `data/approved-event-updates.json` before it will send.
6. **Everything else is identical** to the single-event flow: `git add -f`, PR, arm the token (the same `AVENGERS_AUTO_PUBLISH_POST` can list a weekly key alongside the Big Pig key for one armed run), merge, wait for deploy, sandboxed preflight/send, confirm the Neon receipt, burn the token, notify the leader.

## Player Power Ratings (sent with the weekly recap; leader 2026-11-19)

Every Sunday that the AVENGERS weekly recap goes out, also send the updated Player Power Ratings poster (the approved Nov 17 100-player design). If no weekly recap goes out that Sunday, skip ratings too.

1. **Refresh the Discord-bound AV-2 list, then export + snapshot.** Before exporting, regenerate `data/discord-bound-members.json` from the private `avengers_identity_private.discord_bindings` table in Neon (canonical names only, no Discord IDs/usernames) so it reflects any identity matches confirmed since the last run. Then `node scripts/export-ratings-poster.cjs <Sunday YYYY-MM-DD> --save-snapshot`. Writes `reports/ratings-<date>.json` (poster data + changes) and the immutable `data/ratings-history/ratings-<date>.json`. Selection is automatic (`data/ratings-poster-selection.json`, leader rule 2026-11-23): every Active member, every current AV-2 member in `data/discord-bound-members.json` (no slot cap), alumni filling to 100. Changes compare against the newest earlier snapshot, using rank among all current Active + AV-2 members (poster churn is never a "climb").
2. **Render.** `python3 scripts/render-ratings-poster.py reports/ratings-<date>.json reports/ratings-<date>.png` → 1800×4000 Discord PNG, a 3600×8000 `-FULL.png`, and a `-poster.json` sidecar (templateVersion `ratings-poster-v1-20261119`). Background: `assets/ratings/RATINGS_MASTER_APPROVED_2026-11-17_3600x8000.png`.
3. **Check the poster** as usual: leaders, both panels, footer counts, no clipping.
4. **Write the message** from `reports/ratings-<date>.json` → `changes`: significant climbs (`climbs[].significant`: ≥5 places or ≥0.25 rating among current members), new crowns, and any perfect 10s (`perfectTen`, `newPerfectTen`). First week (`firstWeek: true`): no climbs exist yet, so highlight perfect 10s only. Never invent a climb for `newlyRanked` players; welcome them instead.
5. **Stage**: `python3 scripts/stage-discord-post.py --kind ratings --event-id 'ratings|<date>' --clan AVENGERS --png reports/ratings-<date>.png --body-file … --template ratings-poster-v1-20261119`. It records the snapshot's SHA-256 (`ratingsRef`), which the publisher checks. Commit the snapshot with the post.
6. **Everything else is identical** to the weekly recap: same PR, same armed token (list the ratings key alongside the weekly key), same send/receipt/burn steps. Authorization tag: `leader-standing-auto-discord-ratings-2026-11-19`.

## Safety properties

- **Content is fixed by the repo.** The deployed repo (`data/discord-posts.json` plus the SHA-pinned PNG) decides what gets posted. Callers only pick which staged post to send.
- **Destination is fixed by env.** The destination comes from `AVENGERS_DISCORD_SUMMARY_CHANNEL_ID` and must be `1470175579058999386`.
- **Pings:** only `@everyone` may ping, and only when the write-up starts with it.
- **Duplicates:** the Neon send-once ledger blocks a second post for the same event. An uncertain send is marked `manual_reconciliation_required` and is never retried.
- **Readback:** after sending, the bot reads the message back and verifies both the text and the PNG bytes.
- **Neon switches:** the database-level `runtime_safety` switches stay false. They are role-privilege checks the publisher requires, not the authorization. The authorization for Space/Big Pig/Flash Set is the leader's 2026-10-26 activation (`leader-standing-auto-discord-2026-10-26`); the weekly recap carries its own, separate tag from the leader's 2026-11-09 decision (`leader-standing-auto-discord-weekly-2026-11-09`), recorded against all three constituent events it is built from.
- **Kill switch:** set `AVENGERS_AUTO_PUBLISH_ENABLED=false` (takes effect on the next deploy), or disable the scheduled tasks.
