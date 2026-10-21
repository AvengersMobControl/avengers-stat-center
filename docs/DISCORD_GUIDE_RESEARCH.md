# AVENGERS Discord advice guide — research pipeline (issue #135)

**Status: code staged for review; NOT DEPLOYED, NO MESSAGES PULLED, NO GUIDE PUBLISHED.**

## Commissioner-selected Discord source scope — October 21, 2026

The commissioner selected **eight** source channels. Exact Discord channel IDs and date policy live in an encrypted Vercel allowlist, not in this public repository. The collector rejects every non-allowlisted channel and enforces the cutoff on the server.

| Source channel | Historical range | Priority |
| --- | --- | --- |
| clips-tips-n-tricks | Entire history | **First / highest** |
| space-race-strategy | Entire history | Standard |
| piggy-strategy | Entire history | Standard |
| pinata-strategy | Entire history | Standard |
| d-and-c-attackes | Since July 21, 2026 | Standard |
| coordinate-arena | Since July 21, 2026 | Standard |
| race-coordination | Since April 21, 2026 | Standard |
| general-chat | Since April 21, 2026 | Standard; high noise expected |

The two time boundaries are fixed at **2026-07-21 00:00 Central** and **2026-04-21 00:00 Central**, respectively, for this initial backfill—not sliding windows that would discard previously collected source. Do not import unrelated channels, and do not mistake general discussion for vetted advice. Exact source coverage and missing/inaccessible ranges must be recorded after a real pull.

The existing result-screenshot puller intentionally returns *image-bearing* posts from eight result channels. It does **not** constitute a comprehensive history of conversation. This separate source-research facility retrieves ordinary Discord messages, context links and thread metadata from explicitly approved channels without modifying or posting to Discord.

## Goal and editorial contract

1. Inventory the AVENGERS server's readable text/announcement/forum channels. Agree on scope, particularly private/council channels, before starting the deep backfill. Do not index DMs, other guilds or private discussions outside the approved scope.
2. Pull 100-message pages from the oldest available history through current messages, or newest-to-oldest with a persistent private cursor. Collect replies, pinned posts and thread messages; enumerate archived threads and active threads separately. Handle API rate limits and failed/inaccessible channels without silently marking them complete.
3. Keep immutable evidence metadata: message ID, channel ID, original Discord jump link, author/display name, message date, edit date, reply ID, attachment metadata and raw text in **private storage**. Deduplicate by original message ID and record coverage by channel and date. Message deletion or edits must be marked in future syncs, not silently erase reviewed conclusions.
4. Shortlist candidate advice, then group into **Loadouts & combinations, Return Attacks & defense, Piggy, Space, Flashes, Kraken, Clan League, resources/progression, and general techniques**. Automated keyword tags are *recall aids*, not a relevance or truth verdict. Pull surrounding messages to preserve the question/answer and qualifying conditions.
5. Each proposed guide item needs a short author-edited claim, source message link(s), evidence/conditions, original date, verification state (`reported`, `corroborated`, `tested`, `superseded`, `disputed`) and updated/reviewed date. Do not merge conflicting advice as if there were consensus, or present older patch-dependent tactics as current.
6. Present the approved, searchable guide behind the Vercel **server-side current-member** Discord OAuth gate, denying anonymous and all guest passes, **including permanent guest passes**. Never put proprietary strategy, raw source, guides or source summaries in the public GitHub repo, GitHub Pages artifacts, static bundles, exports or browser source before the auth decision. Private persistence and server-side rendering must be separately implemented and verified.

## Read-only research API (proposed)

`POST /api/discord/guide-research` uses the existing production server-side bot token and guild ID, with no send/delete code and no database writes. Requests must come from a signed, unexpired, non-guest **reviewer/council** session with fresh Discord guild-member readback, or from a private long-lived bearer secret reserved for automated backfill. CORS/origin checks apply to browser sessions. Both forms fail closed when not configured. Response headers are `Cache-Control: private, no-store`.

Actions:

- `{"action":"channels"}` — inventory text, announcement and forum parent channels in the configured guild, without messages.
- `{"action":"activeThreads"}` — inventory currently active threads across the configured guild.
- `{"action":"history","channelId":"...","limit":100,"beforeMessageId":"..."}` — one page of source messages and jump links, including keyword tags. Restricts the requested channel/thread to the configured guild.
- `{"action":"threads","channelId":"...","before":"2026-10-01T00:00:00Z"}` — one page of public archived threads for the selected in-guild parent channel; verify completeness and any non-public archived discussion separately.

The API currently returns data only to its authenticated caller and **does not persist messages**. Do not mistake a successful endpoint test for a completed historical backfill or an approved guide. The caller must separately implement a resumable private checkpoint and storage. Avoid pulling the entire guild in one serverless call (per-page approach prevents timeouts), and stop/retry according to Discord 429 `retryAfterMs`.

### Configuration

One or both of these private Vercel values authorize review:

- `AVENGERS_GUIDE_REVIEWER_IDS` or `AVENGERS_GUIDE_COUNCIL_ROLE_IDS`: comma-separated exact Discord snowflakes; the current guild membership of the signed session is checked for every request. Never put those IDs in a Pages data file.
- `AVENGERS_GUIDE_RESEARCH_SECRET`: at least 32 characters, server-to-server bearer credential. Keep it secret, do not place in client JS, query strings or logs.

Existing `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID` and `AUTH_SECRET` are required. No new Vercel values have been set by this branch. Never copy/decrypt Discord bot credentials into local source files or use a raw public endpoint.

`AVENGERS_GUIDE_CHANNELS_JSON` is a private JSON object keyed by exact Discord channel ID. Each object value specifies `since` (ISO UTC cutoff or `null` for full history) and `priority` (`primary` for clips/tips, otherwise `normal`). Missing or invalid configuration fails closed. Any thread inherits the approved parent channel's cutoff. The channel inventory displays only those eight approved parents, plus a list of any missing IDs; it does not reveal unrelated private guild channels.

### Security and release checklist

- [ ] Run unit tests: `node scripts/discord-guide-research.test.cjs`.
- [ ] Verify release includes only generic collection code, no strategy text or private channel data, and the public Pages build excludes any strategy response.
- [ ] Verify production Vercel session with configured reviewer ID/role; verify current Discord bot channel `Read Message History` permissions.
- [ ] Test direct API anonymous / valid and expired guest / permanent guest / forged and expired session / unauthorized server member / reviewer with revoked guild membership / authorized reviewer. Require no data for all unauthorized principals.
- [ ] Test mismatched guild channel/thread, API 403/404, rate limit, cursor pagination, archived threads and bot partial permissions with live source readback.
- [ ] Approve target channels and storage boundary. Start the private, resumable source backfill; record coverage and gaps.
- [ ] Council reviews draft claims; deploy the member-only guide with fresh membership enforcement and forbidden guest checks.

**Out of scope for this research API:** Discord posting, result imports, production automatic PNG dispatch, UTC roster sync, Kraken optimizer, SAC work, and any modification of historic event data.
