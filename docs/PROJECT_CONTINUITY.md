# AVENGERS Mob Control — live project continuity

**Purpose:** persistent handoff for ANY new ChatGPT session, independent of a conversation's length. **This GitHub document and [DECISION_LOG.md](DECISION_LOG.md) are the living reference**; no repeated upload of a fresh ChatGPT Project file should be required when the GitHub connector is available. **Only AVENGERS/AV-2. Never mix with SAC/Lock It In.**

**Last reconciled:** 2026-10-16 UTC. **Validated main before this documentation PR:** `7c66e643351aa00ee748f8c8a1a392707fc23f6d`. The commit SHA is a dated baseline, not a permanent latest revision. Fetch live `main` before making code changes.

## Start here in a fresh chat
1. Read this file, [the live roadmap](../ROADMAP.md), [the dated decision log](DECISION_LOG.md), and [master issue #13](https://github.com/AvengersMobControl/avengers-stat-center/issues/13). Then inspect the issue and scripts relevant to the current request.
2. Latest **explicit** user decision supersedes older issue/README language. Distinguish **implemented**, **CI passing**, **merged**, **deployed**, and **verified in a browser**. Don't claim completion based only on a green build.
3. Continue the highest-priority **unpaused** task, rather than repeating completed steps or asking the leader to restate prior constraints. Preserve ambiguous/unavailable evidence as unknown; do not guess.
4. After completing a substantive milestone, **update the relevant GitHub issue, this file if status/requirements changed, and append the dated decision/result to [DECISION_LOG.md](DECISION_LOG.md)**. Confirm GitHub Pages deployment's merged SHA, not just a Vercel preview.
5. Deliver human-facing reports directly as **PDFs**, not GitHub Actions ZIP archives; send actual XLSX/CSV for requested data tables. Keep any handoff text searchable.
6. GitHub contents are operational source of truth; a Project-uploaded handoff/PDF is only a **dated convenience snapshot**, not self-updating.

## Sites, code and validation
- **Repository:** https://github.com/AvengersMobControl/avengers-stat-center (branch `main`).
- **Primary website:** https://avengersmobcontrol.github.io/avengers-stat-center/.
- **Vercel:** project `avengers-stat-center` under `league-hq`; build READY must not be mistaken for a verified production browser visit.
- **Master roadmap:** [issue #13](https://github.com/AvengersMobControl/avengers-stat-center/issues/13); detailed tasks: [issues #2–#12 and #34](https://github.com/AvengersMobControl/avengers-stat-center/issues); [ROADMAP.md](../ROADMAP.md).
- Core app `index.html`, event source scripts, `roster-event-breakdown.js`, `roster-sparks-event-ledger.js`, `clan-league-rewards.js`. Audit `scripts/audit-roster-reconciliation.cjs`, five-source tests `scripts/roster-event-breakdown.test.cjs`, cross-view tests `scripts/sparks-ui-source.test.cjs`, Council audit `scripts/report-council-minimums.cjs`.
- GitHub Pages deployment for merge `7c66e643351aa00ee748f8c8a1a392707fc23f6d` **succeeded**, as did Spark CI checks and Vercel READY. This doesn't certify live browser interactions without a separate smoke check.

## Important user rules (do not overwrite with stale README text)

**Sparks display, final user-approved formula, PR #39:**
```text
Logged Sparks  = Piggy Sparks + Space Sparks + Flash Sparks + Kraken Sparks
Screenshot Gap = max(0, historical all-time screenshot Sparks - Logged Sparks)
Total Sparks   = Logged Sparks + Screenshot Gap
```
- **Logged** category amounts are independently event-sourced; old `D.members.totalSparks` must not be interpreted as Kraken remainder. Historical Kraken payouts may be inferred from known damage × event-time clan rate; avoid June/October double-counting; unknown historical clan means no guessed payout.
- **Screenshot Gap is included only in displayed Total Sparks**, not relabeled as an earned event or mixed into Logged. The September 29 screenshots naturally precede subsequently earned Sparks: no warning triangles or negative discrepancy tooltips merely because Logged exceeds them. Keep three distinct roster columns `Logged Sparks`, `Screenshot Gap`, `Total Sparks`; the last must not duplicate Logged.
- **Logged Stars = Piggy + Space + Flash Stars**; no Kraken Stars.
- Screenshots may be rounded/truncated or taken on different dates; don't force-match by fabricating rewards. Exclude Zolika from clean within-history screenshot comparison benchmarks because they belonged to AVENGERS before the event-data period; **keep Zolika in the full roster audit**. Leader-corrected Animosity reference = **12,672,420**.

**Roster identity snapshot (2026-10-15):** **48 AVENGERS + 52 AV-2 tracked** (50 AV-2 screenshot entries and leader-added **AV-DrDetroit**, **AV-Starred**, their unavailable all-time screenshots remain unknown); **AV-Bubba0816 inactive**. **AV-Frenchie2** and **AV-Frenchie(-4)** are DISTINCT accounts. Aliases include `AV-Zolika.x.TheBoss`/`AV-ZolikaLoveKira` → `AV-Zolika.x.Kira`, `take.them.out` → `AV-ColdCreeps`, `Zolistar` → `AV-7-Star`; confirm exact canonical names/aliases from live data before editing. Always attribute a past event to **clan at the time of that event**, not today's roster location. Missing historical events, joins and rewards must remain unknown, never automatically counted as zero.

**Event rules and outputs:** Piggy/Space/Flash/Kraken results require actual final source screens, dedup across reposts/lobbies, exact player identity and event clan, appropriate score units; user-approved import only. **Piggy minimum 3,500 lines each race AND at least one 7,000-line result per five-week league; Space minimum 30B, except Sept 27, 2026 weekend 50B; rules effective Sept 11, 2026.** Do not label absent recorded attendance a violation without independent start-date and event completeness proof. Flashes have NO participation minimum but Spark/Star rewards count. For October 2 Space, use approved 50%-higher corrected scores, not the earlier 66.6% adjustment artifact. PDFs for Council summaries, prominently show PBs old/new and percent improvements in event graphics; show first-timers when present.

**Five-week leagues:** end **Apr 19, May 24, Jun 28, Aug 2, Sep 6, Oct 11 2026**, each spans 35 days ending in Kraken. Older Kraken estimates use **AVENGERS 750 Sparks / 1M damage**, **AV-2 500 / 1M**, only if event-time clan evidence supports the rate; October 11 payout independently recorded. The leader reported successive clan totals **165M → 171M**; these are reference figures awaiting fully audited source rollups, not values to force-match.

**Discord UTC/country: PAUSED BY USER.** `#3` code is merged but **scheduled checks OFF**, using feature gate `DISCORD_UTC_SYNC_ENABLED`; schedule if explicitly enabled is Mondays/Fridays 15:00 UTC. Channel `1422151197317529600`, Council role `1427090799052587038`. Secrets were configured; bot auth/channel read and checkpoint succeeded. A fresh test post was held in encrypted review because `explicit_game_name_required`; no accepted live roster update was proven. The user said **“table this — move on.”** Don't run Discord UTC testing, backfill, auto-scheduling or activation until they ask to resume. Never expose token, encryption key or private Discord IDs. Explicit country only; never infer country from UTC or group TZG from UTC. [Detailed UTC contract](discord-utc-roster.md).

**October 13 AVENGERS PF1 main leaderboard: CLOSED, NOT PLANNED.** Leader confirmed it cannot be supplied. Preserve known partial valid results; never ask for, invent, or extrapolate the missing main lobby ([issue #5](https://github.com/AvengersMobControl/avengers-stat-center/issues/5)).

**Kraken route optimizer:** research remains open: include Sirion/Combo champion comparisons, tickets and legal paths, user-approved scenarios forbidding 10-ticket allocations on maps 4/5/6, remaining-ticket fallbacks 55/40/15, source-to-AV map ID conversion preserving faint original IDs, damage-per-ticket metrics and outlier handling ([#10](https://github.com/AvengersMobControl/avengers-stat-center/issues/10)). Attack-video research must test whether strike lane relates to prior **cannon/colored champion** position before Kraken backs away/raises tentacle, NOT explain the already-known warning lane/consistent phase timing ([#11](https://github.com/AvengersMobControl/avengers-stat-center/issues/11)).

## Mandatory sitewide consistency contract (leader mandate, 2026-10-16)
**One approved new/corrected/retracted event must update ALL related parts of the website and generated outputs without any manual instructions to chase down secondary views.** No feature may be called complete because only its event leaderboard or roster value changed. [P0 issue #42](https://github.com/AvengersMobControl/avengers-stat-center/issues/42) is a release-blocking prerequisite for automatic [#4 Discord event-result ingestion](https://github.com/AvengersMobControl/avengers-stat-center/issues/4), supported by end-to-end [#9 QA](https://github.com/AvengersMobControl/avengers-stat-center/issues/9).

**Current code is only partially connected**: `index.html` and `phase2.js` still depend on precomputed `D.members.*PB/ratingTotal/eventsPlayed` and `D.piggy.overall/D.space.overall` in addition to the event histories, whereas other modules separately derive achievements, clan-league totals and roster rewards. This must be refactored into one canonical versioned event ledger and deterministic full-site projection/rebuild, or a provably equivalent architecture, BEFORE unattended imports. Apply event-time clan and identity aliases, exact/corrected scores, Sparks/Stars, PBs and prior PBs, averages, latest-three, ratings, rank tables, records, achievements, player profiles, trends, six-league/Council calculations, graphics and exports. Test Piggy/Space/Flash/Kraken, duplicates, corrected score (including lowered former PB), historical transfer/name changes, partial events and unaffected members. Do not count screenshot gap as an event payout; displayed Total Sparks stays **Logged + positive Screenshot Gap**. Publish all changed assets atomically and verify site pages agree before calling result imported. Open browser tabs may need reload; there is no current promise of a live push without refresh.



1. **NEXT: [#4 reliable Discord event-result ingestion](https://github.com/AvengersMobControl/avengers-stat-center/issues/4)**. Approved-channel final screenshots only; ignore progress images. Multi-image results across AVENGERS/AV-2, provenance, duplicate protection, alias/units, staging/dry-run and reviewed site update. Do not start unattended Discord ingestion or post results without permission.
2. [#8 consistent event PNG summaries](https://github.com/AvengersMobControl/avengers-stat-center/issues/8): data-driven Piggy/Space/Flash/Kraken reporting, PBs before/after, percent increase, first timers, no duplicate sends.
3. [#7 Council minimums reporting](https://github.com/AvengersMobControl/avengers-stat-center/issues/7): core/report engine and tests exist; validate historical membership, missing events and resulting compliance; deliver PDFs. A prior audit found 567 positive-score records, 65 below minimum and 8 near minimum in latest policy era; those are **records**, not established sanctions.
4. [#6 six-league accounting](https://github.com/AvengersMobControl/avengers-stat-center/issues/6): validate participant/clan Spark + Star rollups, reconstructed rewards, 165M/171M reference against actual events.
5. [#2 member identity/ledger reconciliation](https://github.com/AvengersMobControl/avengers-stat-center/issues/2), [#34 Sparks residual review](https://github.com/AvengersMobControl/avengers-stat-center/issues/34), [#9 deployment/QA](https://github.com/AvengersMobControl/avengers-stat-center/issues/9): verify unresolved aliases, source completeness, old snapshot precision, real browser UI; avoid regression.
6. [#10 Kraken route optimization](https://github.com/AvengersMobControl/avengers-stat-center/issues/10), [#11 video study](https://github.com/AvengersMobControl/avengers-stat-center/issues/11), [#12 player profiles/recruiting/guest passes](https://github.com/AvengersMobControl/avengers-stat-center/issues/12), after foundations.
7. **PAUSED** [#3 Discord UTC/country](https://github.com/AvengersMobControl/avengers-stat-center/issues/3). **CLOSED** [#5 missing Oct 13 PF1 main lobby](https://github.com/AvengersMobControl/avengers-stat-center/issues/5).

## Active #42 implementation checkpoint (October 16 continuation)
- PR #44 shipped the staging core. Branch `feat/connect-event-projection` now connects published data through `scripts/build-site.cjs`: one projected synchronous bundle, existing page adapters, shared Council/league/event-summary exports and content-addressed assets. Pages and Vercel build the same `dist` artifact; Pages gates projection and browser checks before upload.
- [EVENT_PROJECTION.md](EVENT_PROJECTION.md) records the source review, current architecture, reviewed-update CLI, verification scope and remaining #4 work. The original six July 30 conflicts were resolved against final screenshots (Space review PDF `(2)`, pages 19–20); obsolete October 2 rescaling and Chuck alias cycle are fixed. Saber history-only 49.8 stays in review. An ambiguous October Frenchie source retains 18,100 AV-2 Sparks as unassigned, without merging Frenchie2 and Frenchie(-4).
- Existing 48/52 current rosters are preserved. Unknown historical clans/payouts remain unknown. Historical Kraken estimates refresh from revised dated clan evidence; source partial coverage is exported explicitly.
- #4: a separate ChatGPT result-review task now runs daily around 8 AM America/Chicago (flexible morning window). Read-only access was verified for both clans. It prepares parsed candidates; automatic import/publication remains OFF until parsed-result approval. End-to-end reviewed import remains to be demonstrated; UTC #3 remains paused. Check #42 comments for exact CI, merge SHA, deployment and production browser evidence before claiming live verification.

## Critical recently merged work
- [PR #32](https://github.com/AvengersMobControl/avengers-stat-center/pull/32): Council six-period conservative observed-result audit (does not assume missing attendance equals a violation).
- [PRs #33/#35](https://github.com/AvengersMobControl/avengers-stat-center/pulls): diagnose Spark inflation, fix Animosity reference and exclude Zolika only as a complete-history benchmark.
- [PR #36](https://github.com/AvengersMobControl/avengers-stat-center/pull/36): rebuild Logged from four event sources, no phantom historical Kraken, avoid duplicate June/October.
- [PR #37](https://github.com/AvengersMobControl/avengers-stat-center/pull/37): player profiles, achievements and Kraken overview use updated Logged.
- [PR #38](https://github.com/AvengersMobControl/avengers-stat-center/pull/38): remove misleading warning triangles against older screenshots.
- **[PR #39](https://github.com/AvengersMobControl/avengers-stat-center/pull/39): final leader decision:** Total Sparks = Logged + positive Screenshot Gap; header, KPI, sorting and tests corrected; deployed.

## Ongoing maintenance rule
- **Code, events, images and detailed acceptance checklists** remain in their repository paths and linked GitHub issues. This handoff must not pretend to be a complete copy of every raw event record.
- Every meaningful merged PR should (a) update its issue, (b) append to [DECISION_LOG.md](DECISION_LOG.md), (c) update this file/roadmap if requirements or status changed, and (d) record exact deployment verification. Keep **one GitHub living reference**, with Project files optional for discovery.
- When user requests a new ChatGPT Project session, tell them **one short standing Project Instruction** suffices: “For AVENGERS tasks, read `docs/PROJECT_CONTINUITY.md`, `docs/DECISION_LOG.md`, `ROADMAP.md` and issue #13 from `AvengersMobControl/avengers-stat-center` first; follow newer user directions; do not mix with SAC.” It is NOT necessary to upload the PDF plus both text files.

## Reward / effort reporting rule (October 16)
Use 10:1 Stars:Sparks as a reconciliation check for Piggy/Flash/Space. Derive full Stars from exact Sparks only when Stars are rounded/missing, label the derivation, preserve conflicting directly visible rewards. Report full integer Stars and screenshot Share %. Sparks/Effort = Sparks per billion lightyears for Space (workbook formula); per line for Piggy/Flash. Lower ratio can identify unrewarded effort; compare within the same event/unit.

## October 16 approved publication and complete effort rollout
Leader explicitly approved the revised 44 AVENGERS + 22 AV-2 Space results for publication. `data/approved-event-updates.json` now records that approval; the normal canonical projection rebuilds every dependent total/PB/rating/history. Four AVENGERS PBs and three AV-2 PBs remain distinct. Zolika Stars = 4,153,180 (derived from exact Sparks; provenance retained).

Sparks/Effort applies to Piggy/Space overall and last-three views, event rows, player event logs, roster grouped columns/sorting, league reward tables/CSV, Flash performance/daily/result tables, totals and machine exports. Aggregate ratios use sum of matching known Sparks / sum of their effort, never averages of individual ratios; missing pairs are excluded and marked. Compare only within the same event/unit; there is no blended Piggy/Space/Flash ratio.

September 18 investigation: retained group 6 has four positive-distance records but zero reward placeholders and no final reward capture in the reviewed Space event window. Preserve the distances; replace unavailable rewards with null, mark partial coverage, explicitly explain missing lobby 6 (Animosity, MotherboardBeans, Nicefellow, ColdCreeps). Known AV rewards remain 56,995,119 Stars and 5,703,046 Sparks. Six AV lobbies are represented, five with known rewards. Full pot remains unavailable. No speculative pot or new screenshot-derived reward import.

`python3 scripts/render-space-summary.py <release.json> <output.png>` reproduces the approved navy/cyan/purple Space clan graphic with prominent old/new/% PBs, top ten full reward/share/effort columns, first-tracked entries and a clearly described effort shoutout panel. Do not use first-tracked as proof of first-ever in-game racing.

October 16 publication QA: latest Space preview, event result tables and historical PB/first-tracked lists must filter by event-time clan, never current roster status. Keep current status as an informational column. Browser assertions require all 44 AVENGERS and 22 AV-2 approved Oct 16 rows.

## October 16: Records dates and partial pot coverage correction
Records page had retained a display-only Oct 2 division by 0.6666 when choosing Space PB dates, despite canonical Oct 2 scores already having the approved 1.5 multiplier. Remove that display adjustment. Derive record date from the same actual unmodified score as the PB, earliest date for equal scores: HarryBallsagna 549.9B is August 30; JAMO 439.3B is October 9. Do not change scores to fit a date.

Partial player coverage does not mean lobby pots are unknown. Show a pot calculated from each represented lobby's known reward/share when every represented lobby has a usable anchor, mark estimates with ≈ and retain partial coverage notes. A truly reward-missing lobby still prevents a complete total (Sept 18 AV lobby 6). Leader explicitly says that Sept 18 screenshot will not be supplied: keep unknown, do not schedule further retrieval. Pot CSV exports include estimate flags/coverage and obey selected event-time clan.
