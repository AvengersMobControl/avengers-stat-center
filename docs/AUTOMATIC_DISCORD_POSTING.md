# Automatic Discord event posts (leader-activated 2026-10-26)

On 2026-10-26 the leader approved the Space, Big Pig and Flash Set poster templates and told Claude to post event results automatically: "set it up please". This activates **unattended posting for AVENGERS Space Race, Big Pig and Piggy Flash Set summaries only**. AV-2 posting stays on hold until the leader says otherwise. Kraken is not included.

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
   - **Never retry a 502.** It means a possible send. Tell the leader.
   - A 409 means the event was already posted.
10. **Close out.**
    - Confirm the receipt row in Neon (`message_receipts` joined to `publication_slots`).
    - Burn the token by setting `AVENGERS_AUTO_PUBLISH_ONCE_SHA256` to the sha256 of a fresh random value.
    - Stop the sandbox.
    - Push-notify the leader with the Discord link: `https://discord.com/channels/1403361698177618081/1470175579058999386/<messageId>`.

## Safety properties

- **Content is fixed by the repo.** The deployed repo (`data/discord-posts.json` plus the SHA-pinned PNG) decides what gets posted. Callers only pick which staged post to send.
- **Destination is fixed by env.** The destination comes from `AVENGERS_DISCORD_SUMMARY_CHANNEL_ID` and must be `1470175579058999386`.
- **Pings:** only `@everyone` may ping, and only when the write-up starts with it.
- **Duplicates:** the Neon send-once ledger blocks a second post for the same event. An uncertain send is marked `manual_reconciliation_required` and is never retried.
- **Readback:** after sending, the bot reads the message back and verifies both the text and the PNG bytes.
- **Neon switches:** the database-level `runtime_safety` switches stay false. They are role-privilege checks the publisher requires, not the authorization. The authorization is the leader's 2026-10-26 activation, recorded as `leader-standing-auto-discord-2026-10-26`.
- **Kill switch:** set `AVENGERS_AUTO_PUBLISH_ENABLED=false` (takes effect on the next deploy), or disable the scheduled tasks.
