# Event projection migration — issue #42

## Connected build implementation — October 16 continuation

`feat/connect-event-projection` replaces the published page's independent data scripts with one synchronous projected release bundle. `scripts/build-site.cjs` replays retained archives through `load-site-data.cjs`, migrates accepted event rows, applies `data/approved-event-updates.json`, refreshes historical inferred Kraken payouts from the updated dated clan evidence, runs the shared projection and materializes every existing browser data interface. Current roster status stays separate. Pages deploys `dist` after projection and real-browser tests; Vercel uses the same build. Content-addressed JS/CSS and versioned ledger/projection/Council/league/event-summary/review exports prevent mixing old summary caches with changed events.

The publication path is connected by this change; unattended screenshot ingestion remains OFF under #4. `scripts/stage-event-update.cjs update.json` previews exact affected members and versions. Dry-run previews may use unapproved candidates without changing their approval flag or accepted source file. Only a reviewed payload with `approved:true`, `expectedRevision` and a complete normalized `event` can be applied with `--apply`; retries do not duplicate it. Committing the accepted source change invokes the complete site build. The script never reads Discord, sends messages or pushes git.

**Verified source corrections:** the original workbook's `260730SR` event sheet and the Space Discord review PDF `(2)`, pages 19–20 (final claim screenshots, posts 74–78), confirm all six July 30 event-table values listed below. The workbook `Space` summary retained five July 19 scores and INTEN's July 24 score under July 30. Published histories now come from the accepted event rows. The July 30 Saber 49.8 history-only record lacks a matching event result and remains in the review export, not an invented accepted result. October 2 is stored at the already-approved ×1.5 actual score; normalization and achievements no longer apply `/0.6666`. Chuck aliases converge on the October roster spelling `AV-Chuck`.

**Identity/coverage treatment:** a legacy October Kraken import attributed both an AVENGERS 2,558.3 result and an AV-2 36.2 result to `AV-FrenchieUSA`. Leader confirmed on October 18 that the AV-2 result was `AV-Frenchie2` (36.2M damage, 18,100 Sparks), always a distinct account from the AVENGERS Frenchie. The previously unassigned reward is now credited to Frenchie2, and AV-2/league/recap clan totals remain exactly unchanged; member rewards now reconcile without an extra unassigned row. Source rows with no historical clan evidence remain explicitly unknown; there is no reward or country inference from current membership. Historical Kraken estimates retain their policy and dated evidence event, and recalculate after a prior event-clan correction.

**Validation:** 15 pure-core tests plus 13 site integration cases, existing roster/Spark/Council regression suites, and an independent every-member PB/reward check. Real-browser checks cover eleven pages in both clan filters, a rendered player profile, actual recap PNG download and mobile roster behavior. Four event types × two historical clans additionally exercise rendered insert/lower/revoke scenarios. Synthetic fixtures are only in temporary builds and are never committed as real event updates. Exact CI/merge/deployment evidence is recorded on #42.

## Original foundation checkpoint (historical; superseded by connected build above)

**Historical foundation status:** `scripts/event-projection-core.cjs` is not loaded by the website. It does not import Discord screenshots or replace legacy event files. No claims of whole-site correctness, deployment, complete source coverage, graphics generation or unattended ingestion follow from its unit tests. Issue #42 remains open and blocks #4.

The module supplies a reviewed, revisioned event ledger and a pure deterministic projection. It recalculates personal score histories, chronological PB transitions, averages (all-time, arena, calendar 2026, latest three), PB and rating ranks, rewards by category, historical clan totals, six league reward totals, and observed Council calculations. It preserves unknown rewards/scores, partial status and current membership separately from event-time clan. Rewards are explicit; no Kraken reconstruction from lifetime balances. Screenshot Gap contributes only to the displayed lifetime total. Missing snapshots and incomplete earned rewards are flagged. Flash counts are separate from competitive Piggy counts. The existing rating caps are preserved; a partial rating is explicitly flagged.

## Input contract

- `empty()` creates schema version 1. `apply(ledger, event, {approved:true, expectedRevision})` returns a new ledger and action; original inputs remain unchanged.
- Event: stable `id`, `kind` (`piggy`, `space`, `flash`, `kraken`), ISO `date`, `status` (`final`, `partial`, `revoked`), exact `unit`, source references, full replacement `rows`.
- Units: lines for Piggy/Flash, billion-lightyears for Space, million-damage for Kraken. Actual October 2 Space scores enter once; there is no score multiplier in the projection.
- Row: canonical `player`, explicit event-time `clan` (`AVENGERS` or `AV-2`), `score`, `sparks`, `stars`. Numeric values are nonnegative finite numbers or explicit `null`. Kraken Stars must be `null` (not a reward).
- Missing players are not created as zero-result participants. Partial events contribute only known observed rows and keep their partial flag. `firstRecorded` means first result in the available ledger, not proven first-ever participation.
- Exact replay is idempotent. Corrections replace the entire event with optimistic revision checking. Revocation is a retained event revision and removes its rows from projections. Prior and replacement event payloads are retained in the change log.
- Alias cycles, conflicting duplicate player results, unknown historical clans, negative rewards, wrong units and overlapping non-Flash event identities fail closed. Distinct same-day Flash events require distinct IDs; acquisition deduplication must establish those IDs from the source event, not message/repost IDs.
- `project(ledger, {aliases, members, snapshots, arenaStart})` returns a JSON-compatible snapshot and SHA-256 content version. Version changes cover event revisions, policy projection, aliases, membership and snapshots. It does **not yet implement browser cache invalidation** or establish a secure approval service; `approved` is a calling-workflow gate.
- Sources must be sanitized public provenance references before materialization. Never put private Discord identities, credentials or message text in a public release.

## Dependency map and required replacement adapters

| Source / dependent | Existing consumer | Projection / work still required |
|---|---|---|
| Embedded baseline, event patch scripts | `index.html`, `piggy-2026-10-11.js`, `space-2026-10-09.js`, archives/reconciliation scripts | Migrate to a reviewed ledger; stop cumulative `m.totalSparks += ...` and stored PB maxima |
| Piggy/Space events and histories | `index.html` overall/event/last-three/PB/trends/pot views | Materialize events, histories, overall fields, official pots and metadata from a shared release; preserve known pot totals separately from observed row sums |
| Member summaries and status | `index.html` overview/roster/ratings/records; `phase2.js` profiles/charts | Map projection into legacy fields or replace consumers; separate current status from historical clan; reconcile event-count definitions |
| Kraken monthly source | `kraken-data.js`, `kraken-history-complete.js`, `kraken.js` | Migrate month dates and explicit/inferred historical payouts with source evidence; replace hardcoded event-clan assumptions and PB caches |
| Flash source and per-Flash pages | `piggy-flash*-data.js`, backfills, `piggy-flashes.js` | Stable race/lobby identity, screenshot/repost dedup, canonical ledger adapter |
| Records, PB streaks, achievements and weekly recap | `community-highlights.js` | Replace independently built streams/caches; remove obsolete October 2 `value/0.6666` transformation after comparison tests |
| Four-category roster rewards | `roster-sparks-event-ledger.js`, `roster-event-breakdown.js` | Consume shared earned categories; preserve missing/reconstructed payout lineage, no screenshot awards |
| Six league pages/CSV | `clan-league-rewards.js` | Consume league projection; migrate historical Kraken estimates explicitly, no current-clan attribution or double counting |
| Council evidence/PDF | `scripts/council-minimums-core.cjs`, `scripts/report-council-minimums.cjs` | Core reused by projection; keep incomplete membership/attendance unverified; migrate report input and version outputs |
| Event PNGs/exports | #8, #4, per-event output paths | Generate from the exact same projection, including PB prior/new/% and first-recorded coverage; still unimplemented |
| Publication | `.github/workflows/pages.yml`, browser assets | Stage one versioned bundle; cross-consumer agreement gate before upload; asset versioning, rollback and deployed browser checks still unimplemented |

## Read-only legacy migration audit

Run `node scripts/audit-event-projection-migration.cjs`. Replays current data scripts in published order, stopping before application rendering; makes no network requests or data changes. Aliases with cycles are excluded from comparisons and reported as blockers. This inventories disagreements; it does not decide which conflicting source is correct or treat missing clan metadata as proof that the original clan is unknowable.

Baseline `c4a04090bde7c115031297c151d76ebb18f36272`, October 16, 2026:

| Check | Piggy | Space |
|---|---:|---:|
| Event dates | 41 | 52 |
| Result rows | 1,904 | 1,402 |
| Rows without explicit historical clan | 1,767 | 0 |
| Event/history score disagreements | 0 | 6 |
| History rows absent from event tables | 0 | 1 |
| Stored member PB disagreements | 3 | 24 |
| Rows with unknown Sparks / Stars | 0 / 0 | 22 / 23 |

Flash inventory: 178 events. Kraken: 9 months, 145 players. Alias cycle: `AV-CHUCK` ↔ `AV-Chuck`; do not silently merge or select a spelling during the migration.

The six Space conflicts are all July 30: INTEN 129.4 event / 132.4 history; Abu 128.6 / 281.7; GNSK 62.4 / 108; no 38.2 / 51.8; jacko 73.8 / 260; J1M 55.7 / 68.9. Compare source lineage before accepting either value. Example stored PB drift: HarryBallsagna 610.9360936093609 versus observed result/history maximum 549.9. These are **stored-source inconsistencies**, not independently verified replacement game scores.

## Original foundation verification and migration order (historical)

1. Foundation tests: `node --test scripts/event-projection-core.test.cjs`. Four event types × two clans test insert, duplicate, correction lowering a PB, revocation and restoration. Additional tests cover rewards, Screenshot Gap, aliases/transfers, distinct Frenchie accounts, partial/unknown data, exact Space units, ranks/ratings, Council rules, invalid inputs and deterministic versions.
2. Existing regression suite: roster breakdown, Spark view sources, Council policy and full 100-member reconciliation. These establish no regression to the untouched production source; they do not certify the new projection against every UI page.
3. Resolve alias cycle from the existing canonical-name evidence; build the migration adapter with per-row explicit or evidence-backed historical clan and provenance. Retain unknowns in a review queue; do not silently infer clan from present status or zero rewards.
4. Reconcile July 30 conflicts, history-only rows, October 2 transformations and stored PB drift. Review the full before/after diff for both clans.
5. Wire every table/profile/record/achievement/league/export/graphic to the versioned projection; add rendered cross-view fixture checks, historical payouts and source dedup tests. Do not selectively fix only PB displays.
6. Implement staged build/publication validation and rollback, test against exact GitHub Pages deployment SHA, then perform deployed browser checks before releasing #42's gate or unattended #4.

UTC #3 remains paused. Missing Oct 13 PF1 #5 stays closed. No Discord reads or posts are needed for this staging milestone.

## Remaining ingestion work and release verification

#4 still requires final-vs-progress screenshot validation, multi-image acquisition, public provenance sanitization, stable event/source deduplication, secure reviewed writes and an explicit pull schedule. A separate ChatGPT scheduled review is enabled daily around 8 AM America/Chicago (flexible morning window); it retrieves new final screenshots and presents parsed candidates. It does not auto-import or send Discord messages. The connector requires explicit approval of parsed results before publication. UTC #3 remains paused. Do not mark #4 operational merely because the shared data build passes.

Production verification must match the merged SHA's Pages deployment and `release-manifest.json` version, exercise both clan filters and the same profile/roster/PB facts, and record any unresolved browser behavior. Rollback is to revert the accepted update/implementation commit, rerun the same gated build and redeploy its complete artifact; never copy individual old summary files over a newer release. Retained source archives and append-only approved revisions preserve the review trail.
