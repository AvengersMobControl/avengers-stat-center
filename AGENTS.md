# AVENGERS Mob Control — Agent Operating Instructions

## 2026-11-18 — LATEST: AV-2 Piggy Flash is ONE unnumbered weekly pool, four results per member

- AV-2 Flash results CANNOT be differentiated as PF1, PF2, PF3 or PF4. Never assign AV-2 Flash to one of the four numbered AVENGERS events, and never hold a valid AV-2 Flash score solely because a PF number is absent.
- Use a separate `flash|YYYY-MM-DD|av2pool` event per **source-supported week-ending Friday**. Event metadata: `{pool:"av2-week",poolWeek:"YYYY-MM-DD"}`. Store up to four distinct result entries per canonical player in that event, differentiated by `metadata.poolSlot` 1–4. Slots are personal arbitrary identifiers, NOT a shared chronology, round number or correspondence with PF1–4; each entry must reference the actual source original image SHA-256. Deduplicate repeat/overlapping screenshots and reject fifth results, copied originals across slots, or imagined scores.
- Include each verified entry independently in history, Flash effort, PB, ratings, totals, Sparks/Stars, achievements and recap. Exclude exactly one-line Flash placeholders for either clan. Preserve original AVENGERS PF1–4 events and Kraken monthly manual-only rule; Friday/Sunday schedules remain unchanged. Late AV-2 screenshots may join an older verified weekly pool.
- This rule SUPERSEDES the November 18 earlier requirement to find an AVENGERS PF number and append AV-2 rows to that event. No AV-2 PF-number matching is needed or permitted.


## 2026-11-18 — AV-2 Flash inclusion (newest leader correction)

- Collect and import final AV-2 Piggy Flash screenshots from the mixed `av2` channel alongside the existing four AVENGERS Flash channels. AV-2 Flash is **not** excluded. Late screenshots remain eligible since the last full AV-2 result checkpoint; keep original source SHA, rank, Score lines, Stars, Sparks and Share metadata. Exclude only **one-line Flash** results for either clan; do NOT exclude 1-line Big Pig.
- Tie each AV-2 Flash row to a source-grounded Flash set number and event date, preserve original AVENGERS rows in the shared event, and use the canonical account with `clan='AV-2'` for event-time attribution. Update history, PB, rating, rewards, totals and site when published. If no verified date/set, hold privately instead of inventing placement or an event; missing AV-2 lobbies must not delay independently verified other results.
- Kraken is still **manual only**, and the established Friday 02:00–07:30 / Sunday 16:00–18:30 Central schedules do not change.

## 2026-11-18 — Leader correction: monthly Kraken is MANUAL ONLY

- Remove `kraken` from both Friday and Sunday **scheduled** source-channel scans and publication stop conditions. Do not poll/retrieve Kraken results on either recurring results automation. Leader will supply the once-per-month Kraken screenshots explicitly; process those on manual request only.
- Keep the Kraken channel configured for explicit manual retrieval, existing accepted AVENGERS/AV-2 Kraken event types, canonical identities, and historical results. Do not remove Kraken from the website or modify Discord/PNG posting rules.
- Friday remains 02:00–07:30 Central, Sunday 16:00–18:30; weekly Flash/Space/Piggy/AV-2 schedule unchanged.

## 2026-11-18 — Leader-approved bounded collection and publication windows

- STOP 24/7 Discord polling. Vercel source collection is now allowed only
  Friday 02:00–07:30 or Sunday 16:00–18:30 America/Chicago,
  every five minutes INSIDE those windows only. Hard CST/CDT local guard,
  no Discord/Neon access outside them, and no more scans after a verified
  website-publication stop receipt. Native cron remains source-only:
  separate existing ChatGPT jobs own player verification and website apply.
- Friday: Flash1–4 first, ALL screenshots since Monday 06:00; then
  Space screenshots since Wednesday 06:00 (all 6+ lobbies, including solos).
  If no final Space Race, use Friday Piggy instead. Always check AV-2
  late sources since last successful published/fully accounted checkpoint,
  excluding monthly Kraken, and INCLUDING AV-2 Flash.
- Sunday: Big Pig at 16:00 first, Space fallback if no final Piggy;
  inspect AV-2 late posts too. Partial AV-2 is not a blocker to separately
  verified AVENGERS website rows; preserve source-bound private holds.
- User alert: Existing Friday/Sunday automations now start at 02:00/16:00
  and run an explicit end-of-window check at 07:30/18:30. Any failure to get
  expected final results on the live GitHub Pages site must be brought to the
  leader's attention as FAILED PUBLICATION before Claude discovers it.
  Claude alone handles PNG/Discord posting after website release.
- Details and DST/retry/stop logic: docs/RESULTS_SOURCE_INTAKE.md.
  These November 18 rules supersede prior all-day cron, daily review, Friday
  Space-only priority, and AV-2 Kraken exclusion guidance.


These instructions apply to all work in `AvengersMobControl/avengers-stat-center`. Keep SAC / Lock It In (`sac-club`) separate.

## Claude takeover — 2026-10-25

On 2026-10-25 the leader moved day-to-day operation of this project from ChatGPT to Claude and paused the ChatGPT daily results pull/post task. Rules in this file, `docs/PROJECT_CONTINUITY.md`, `docs/DECISION_LOG.md` and `ROADMAP.md` carry over unchanged; GitHub stays the continuity source.

Claude tooling, for discovery: Vercel and Neon MCP tools (`mcp__Vercel__*`, `mcp__Neon__*`), GitHub through `gh api` REST from the session (GraphQL and repository-settings writes are blocked there; merges need a human review), and the AVENGERS Discord Results connector once added in Claude's connector settings (`https://avengers-stat-center.vercel.app/mcp`, accepted for Claude since PR #145). Scheduled results runs (Sunday evening, weekday mornings) never overlap; only one may run at a time.

## Import pipeline split — 2026-11-01 (ChatGPT imports, Claude posts)

The leader moved results **import** (pulling screenshots from Discord and pushing final results into the website/repo) to ChatGPT. Claude's job for Space, Big Pig and Piggy Flash Set results is now narrower: **check the website/repo for newly-imported final results not yet posted** (compare `reports/approved-summary-release.json` / the approved event ledger against Neon `avengers_dispatch_private.publication_slots`), **generate the poster PNG and the Discord write-up**, and **post to Discord** — the posting mechanics, authorization, destination, idempotency and AV-2-on-hold rules below are unchanged. Claude does not need to pull the `AVENGERS_Discord_Results` connector to import new results anymore; that connector may still be used read-only if explicitly asked to cross-check something. See `docs/DECISION_LOG.md` 2026-11-01 entry.

## Automatic event posting — 2026-10-26 (leader activation)

The leader approved the Space, Big Pig and Flash Set poster templates and activated **automatic posting of AVENGERS Space Race, Big Pig and Piggy Flash Set summaries** to #Performance Statistics on a fixed schedule (Sun 7 PM CT: Big Pig, else Space; Tue–Fri 8 AM CT: Flash Sets; Wed–Fri 8 AM CT: Space, else Big Pig). The procedure is `docs/AUTOMATIC_DISCORD_POSTING.md`, using `api/discord/publish-event.js`. This supersedes "unattended/automatic event-summary dispatch stays disabled" below **for those three event types and AVENGERS only**. AV-2 posting stays on hold; Kraken is not included; Discord deletes are never automatic.

**2026-11-09 addition:** the weekly recap (six events: Space, four Flash PFs, Big Pig) is now sent automatically too, **alongside** that week's Sunday/Big Pig post, under its own authorization tag (`leader-standing-auto-discord-weekly-2026-11-09`). Build it with `scripts/build-weekly-recap-facts.py` + `scripts/render-weekly-recap-poster.py` — see `docs/AUTOMATIC_DISCORD_POSTING.md`'s "Weekly recap" section. `docs/WEEKLY_RECAP_PREVIEW.md` and `scripts/render-weekly-event-review.py` are an earlier, never-approved prototype; do not use them for this.

**2026-11-19 addition:** the weekly **Player Power Ratings** poster now goes out with the Sunday weekly recap (own tag `leader-standing-auto-discord-ratings-2026-11-19`); see `docs/AUTOMATIC_DISCORD_POSTING.md` → "Player Power Ratings". Posting runs are Friday 8 AM and Sunday 7 PM Central only, plus backup runs Friday 9 AM / Sunday 8 PM that post only if the main run posted nothing.

**2026-11-17 addition:** Kraken still is **not** part of this standing activation — every Kraken month/clan needs its own fresh explicit leader direction. The poster format, write-up conventions and full one-time send pipeline (including the two stale pre-Kraken guards that had to be fixed — the publisher's `KINDS` check and `middleware.js`'s static-asset allowlist, both now Kraken-ready) are written up in `docs/KRAKEN_DISCORD_POSTING.md` so a future "send it" doesn't have to rediscover them.

## Current Discord authorization policy — 2026-10-22 (supersedes conflicting older manual-send wording)

**Leader-directed one-time publication:** If the leader explicitly says **"send," "post," or "push"** a specified item/report to Discord (including a clear follow-up such as "send it" or "go"), that instruction **IS the publication authorization** for that one-time item. **Act immediately through the connected AVENGERS GitHub/Vercel/Neon/server-side Discord tools, without requesting a second approval, asking for a repeated "approved," moving to another mode, or interpreting an old "do not send" instruction as a blanket prohibition.** A prior approved final image/content remains approved when the leader subsequently orders it sent.

**Separate controls, not conflicting bans:**
- **Unsolicited posts and unattended/automatic event-summary dispatch stay disabled** until specifically activated. An explicitly ordered manual/one-shot publication is neither unsolicited nor unattended; the disabled automatic switches **do not prohibit** the authorized one-time send.
- **Read-only screenshot review, analysis, preview generation, and website-only releases never send Discord posts on their own.** Historical notes such as "never post from this task," "no Discord sends," "requires separate posting approval," or "posting OFF" are **scoped to those tasks/at that time** and do **not** override a later explicit leader instruction to publish a specific report.
- Keep event-specific **data integrity, valid final artwork/source, destination allowlist, pending/uncertain-send reconciliation, and at-most-once duplicate protection**. These are genuine verification requirements, not excuses to demand repeated user permission. Never enable global automatic dispatch, post to another channel, delete an old message, or cross AVENGERS/AV-2/SAC boundaries solely because one report was ordered sent.
- **After every send attempt, tell the leader the outcome immediately.** On success, provide the live Discord link, message ID, channel, and attachment verification. On failure, explain the **exact observed technical blocker** and whether a send might have happened; never invent success or blindly retry an ambiguous send. Do not burn repeated hosting/CI usage on speculative paths.

**Default event-summary destination:** Discord #Performance Statistics, channel `1470175579058999386`, for both AVENGERS and AV-2. This is the current operating policy and takes precedence over older *manual-post authorization* wording, while historical entries remain factual records of their original checkpoints.

## Mandatory startup — DO NOT falsely deny tool access

**Before claiming GitHub, Vercel, Neon, or Discord work is impossible, ALWAYS inventory the tools actually available in the current chat.** These are real, previously used project integrations, not hypothetical suggestions:

- **GitHub:** `mcp__GitHub__*` — read and update repository files/issues/PRs, merge, check runs.
- **Vercel:** `mcp__Vercel__*` — inspect deployments, configure environment, inspect runtime, deploy.
- **Neon:** `mcp__Neon__*` — inspect and, when authorized, modify AVENGERS database/migrations.
- **Discord:** direct `mcp__AVENGERS_Discord_Results__pull_discord_results` is **read-only**. Outbound posting **has already been proven** using the AVENGERS Vercel server-side bot and Discord API, not the read-only connector. NEVER claim “we cannot post to Discord” solely because a direct Discord-send connector is absent. Existing verified one-shot post: Discord `#Performance Statistics`, channel `1470175579058999386`, message `1562154155416752139`; see PRs #121–#123 and `docs/AUTO_DISCORD_PNG_ROLLOUT.md`.

### Required discovery step

If the tools are offered through a generic tool-orchestration entrypoint, **discover them**, e.g. enumerate `ALL_TOOLS` and filter by the four prefixes above. Tool namespaces may not be directly listed in the initial model-facing schema and may need `functions.exec` discovery. An inability to see an explicit direct tool on the surface is **not evidence that no integration exists**.

For an action request:
1. Read current `docs/PROJECT_CONTINUITY.md`, `docs/DECISION_LOG.md`, `ROADMAP.md`, and relevant issues, then inventory relevant tools.
2. Call the matching connected tool; inspect exact argument schema; follow the established repo→Vercel→Neon→Discord server-side pipeline as applicable.
3. Distinguish **tool availability**, **action authorization**, **feature maturity**, **production safety holds**, and **one actual attempt failing**. Never conflate these or claim no tools exist because a feature is disabled or a hold needs an authorized release.
4. If a live path fails, describe the specific observed error and pursue a supported path. Do not respond with generic “I lack GitHub/Vercel/Neon/Discord control tools,” suggest a manual workaround, or route to another mode without first checking the connected integrations.
5. If no write path exists **after actual discovery**, state the *specific* missing operation and what was checked; do not make categorical claims beyond the evidence.
6. For consequential writes, retain existing approvals, source provenance, secret handling, data-integrity gates, and safe no-duplicate Discord send behavior. Never invent success or claim a deployment/post without a receipt.

**Why this exists:** On 2026-10-20 the assistant falsely claimed GitHub/Vercel/Neon/Discord control tools were unavailable despite using all three repository/hosting/database integrations and successfully verifying a one-shot Discord PNG post earlier the same day. The leader explicitly demanded this never recur. The issue was failure to discover/consult integrations, *not* that they were actually absent.

### AVENGERS reporting context

- Production report destination for **both** AVENGERS and AV-2 PNGs plus accompanying write-ups: `#Performance Statistics`, channel `1470175579058999386`.
- The October 20 one-shot test demonstrated Discord send, authenticated readback and a duplicate-blocked reservation. **It did not activate unattended posting.**
- The leader's later explicit request to **enable automatic reporting and release/send the held October 18 AV-2 Piggy results** must be addressed using the actual available integrations and current source/approval state, not dismissed as impossible due to fictitious missing tools. Do not claim it has been executed unless verified.
- Preserve security and correctness: real original approved art, verified data, separate AV-2 PB rules, conservative idempotence, private credentials, and no SAC crossover.
