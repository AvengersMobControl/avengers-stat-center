# AVENGERS / AV-2 Mob Control — living development roadmap

**Updated:** 2026-10-16 UTC. **AVENGERS ONLY — never mix with SAC / Lock It In.**
- [Project continuity handoff](docs/PROJECT_CONTINUITY.md) — user rules, identities, current code and pause decisions.
- [Dated decision / implementation log](docs/DECISION_LOG.md) — append every meaningful milestone and record verification evidence.
- **Canonical work tracker:** [master issue #13](https://github.com/AvengersMobControl/avengers-stat-center/issues/13), with individual GitHub issues for acceptance criteria.
- **Main site:** https://avengersmobcontrol.github.io/avengers-stat-center/.

## Priority and accurate current state

| Order | Workstream | Status / next action |
|---|---|---|
| **P0 — release gate** | [#42 Event → every dependent site view](https://github.com/AvengersMobControl/avengers-stat-center/issues/42) | **New leader mandate:** an accepted/corrected event updates every PB, history, average, rating, ranking, roster, record, achievement, clan/league total and export through a shared deterministic rebuild and sitewide tests. Existing code is partly disconnected; do not claim already implemented. Blocks unattended event ingestion. |
| **NEXT / P0** | [#4 Event-result screenshot ingestion](https://github.com/AvengersMobControl/avengers-stat-center/issues/4) | Start with approved read-only ingestion sample; implement together with **#42** cross-site propagation, duplicate/correction tests and atomic full-site publication. No unattended Discord reads/posts without user authorization. |
| P1 | [#8 Event summary images](https://github.com/AvengersMobControl/avengers-stat-center/issues/8) | Standardize Piggy/Space/Flash/Kraken data-driven graphics; prominent PB previous/new, % improvements, first-time players; avoid duplicate posts. |
| P1 | [#7 Council minimums/near-miss reporting](https://github.com/AvengersMobControl/avengers-stat-center/issues/7) | **Core analysis and tests shipped in PR #32**. Need validate join dates, event completeness and Council outputs; PDF deliverable, not GitHub ZIP. |
| P1 | [#6 Six five-week league accounting](https://github.com/AvengersMobControl/avengers-stat-center/issues/6) | Six periods rendered; validate true event-clan attribution, historical Kraken estimates, and leader's 165M → 171M reference against event records. |
| P1 | [#2 Roster identity and accounting](https://github.com/AvengersMobControl/avengers-stat-center/issues/2) / [#34 Spark source gaps](https://github.com/AvengersMobControl/avengers-stat-center/issues/34) | **100-player four-category Logged fix shipped; Total Sparks = Logged + positive Screenshot Gap**. Continue aliases/transfer/completeness/rounding evidence; don't fabricate amounts. |
| P1 | [#9 Deployment, UI and regression protection](https://github.com/AvengersMobControl/avengers-stat-center/issues/9) | Recent main GitHub Pages and Vercel deploys succeeded; still improve actual rendered UI verification, CI smoke, rollback docs and stale metadata. |
| P2 | [#10 Kraken route optimizer](https://github.com/AvengersMobControl/avengers-stat-center/issues/10) | Existing research/prototypes; legal ticket-path engine and champion/map matching remain. |
| P2 | [#11 Kraken attack video study](https://github.com/AvengersMobControl/avengers-stat-center/issues/11) | Answer pre-warning targeting hypothesis with data, not descriptions of known gameplay mechanics. |
| P2 | [#12 Profiles, recruitment and guest passes](https://github.com/AvengersMobControl/avengers-stat-center/issues/12) | Profiles and Sparks views exist; recruitment/guest-pass and transfer UX remain. |
| **PAUSED** | [#3 Discord UTC/country ingestion](https://github.com/AvengersMobControl/avengers-stat-center/issues/3) | Implemented encrypted sync and tested bot read; **live submission blocked by identity validation; user explicitly paused**. Monday/Friday schedule OFF. Don't restart without permission. |
| **CLOSED** | [#5 Missing Oct 13 PF1 main leaderboard](https://github.com/AvengersMobControl/avengers-stat-center/issues/5) | **Not planned**: user confirmed unavailable. Preserve partial validated entries; do not chase or guess. |


## October 16 next ingestion milestone (review-only)
Implemented a review-side assembler for multiple *already parsed, human-verified* final screenshot result captures: digest-based repost deduplication, event/clan/score sanity checks, progress exclusion, conflict quarantine and a guaranteed unapproved staged candidate. New tests form a Pages/PR release gate. See docs/RESULT_REVIEW_PIPELINE.md. **No connector image reading, automated Discord ingestion, parsed-result approval or real event publication has been enabled.** Next step for #4: test this intake with a representative authorized read-only multi-image review, preserve accurate source hashes and uncertainties, then demonstrate explicitly approved end-to-end import and exact production Pages verification. #3 UTC sync stays paused.

## #42 connected build checkpoint — October 16
`feat/connect-event-projection` connects published data to the shared projection: migration/revision overlays, synchronous page bundle, histories/PBs/ratings/roster/Kraken/league/achievement/recap adapters, versioned exports and publication/browser gates. See [EVENT_PROJECTION.md](docs/EVENT_PROJECTION.md) for verified source corrections and explicit unknown/unassigned records. Check #42 for exact merged-SHA deployment/browser evidence. #4 remains unfinished end to end. Daily morning screenshot review is now scheduled around 8 AM America/Chicago; parsed-result approval is required before any source write/publication. Automated import is OFF.

## Current accepted accounting requirements

```text
Logged Sparks  = Piggy + Space + Flash + Kraken  [independently recorded]
Screenshot Gap = max(0, earlier all-time screenshot Sparks − Logged Sparks)
Total Sparks   = Logged Sparks + Screenshot Gap [roster display]
Logged Stars   = Piggy Stars + Space Stars + Flash Stars
```

No Kraken Stars; no legacy Sparks remainder silently recast as Kraken. Keep screenshot gap out of individual event payout categories. A Sept 29 in-game snapshot legitimately predates later Spark earnings: no warning triangles merely because logged is higher than that old screenshot.

Event participation and Sparks/Stars belong to the original event-time clan, even after transfers. All sourced player IDs/names must be canonicalized and distinct. Missing data/attendance/join dates remain UNKNOWN; cannot assume zero or sanctions from absent leaderboard rows.

**Current roster baseline:** 48 AVENGERS; 52 AV-2 (50 screenshot + leader-added DrDetroit and Starred, screenshot totals for those two unknown). Bubba inactive, Frenchie2 distinct from Frenchie(-4).

**League/minimums:** five-week cycles, last six ending Apr 19, May 24, Jun 28, Aug 2, Sep 6 and Oct 11 2026; Piggy >=3,500 lines each race and >=7,000 once/league; Space >=30B except Sep 27 weekend 50B; policy effective Sept 11. Flashes count for Sparks, not compliance. Verify historical coverage and event-time clan before final judgments.

## Latest completed fixes — do not repeat

- [PR #36](https://github.com/AvengersMobControl/avengers-stat-center/pull/36): independently sourced Logged and reconstructed historical Kraken, 100-player invariant.
- [PR #37](https://github.com/AvengersMobControl/avengers-stat-center/pull/37): profiles/achievements/Kraken overview use the corrected event-backed ledger.
- [PR #38](https://github.com/AvengersMobControl/avengers-stat-center/pull/38): remove outdated screenshot warnings.
- **[PR #39](https://github.com/AvengersMobControl/avengers-stat-center/pull/39)**: Total Sparks column and KPI restored as Logged + nonnegative Screenshot Gap. Main commit `7c66e643351aa00ee748f8c8a1a392707fc23f6d`, CI passed, GitHub Pages deploy succeeded. Always fetch latest GitHub main; this historical SHA won't stay current.
- [PR #32](https://github.com/AvengersMobControl/avengers-stat-center/pull/32): Council minimum observed-result reports and six-league audit engine.

## Safe work and proof of completion
1. Verify the current `main` commit, these living docs, latest user instructions, relevant issue/source data and unknowns; design a small testable change.
2. Implement in branch/PR, preserve provenance and event-time clan, deduplicate imports, keep Discord tokens/IDs out of public assets.
3. Run applicable tests; include regressions for the specific bug; DO NOT merge failing accounting or privacy checks.
4. Merge and verify **GitHub Pages deployed that exact commit**. Separately verify browser behavior where possible.
5. Update the detailed issue and append a new entry to `docs/DECISION_LOG.md`. Update this roadmap and `docs/PROJECT_CONTINUITY.md` when priorities/policies change. Mark implemented, deployed and verified separately.
6. Deliver finished report PDFs directly, not artifact ZIP links. Keep AVENGERS completely separate from SAC.

**The next practical session should begin with #42 + #4 together: map all site dependencies, then validate an end-to-end read-only event-ingestion sample.** Do not automatically access/result-post to Discord without leader authorization.

- October16: leader adds full-integer Stars, ratio reconciliation/derived provenance, screenshot Share %, and Sparks/Effort reporting. Event table/CSV/export implementation underway; October16 candidate remains unapproved.
- October 16 follow-up: leader approved 66 Space results. Extended paired Sparks/Effort to relevant summary/profile/roster/league/Flash/export views; corrected September 18 missing-reward semantics and visible coverage explanation; restored approved Space PNG design in reproducible renderer. Deployment/validation evidence belongs in issues #8 and #13.

## October 16 verified final-result replay sample
A live, read-only source review inspected both Oct 16 AV-2 final Space screenshot halves and the Oct 11 Piggy final captures. All nine visible AV-2 score/reward triples already match the approved Oct 16 canonical event; AV-Witch-king is the preexisting documented alias of AV-EXCALIBUR. A new regression replays overlapping evidence against the approved 66-row event with no changes, canonical alias merging, unchanged source hashes and identical projected version. **No new results published.** The connector did not provide original JPEG byte hashes and limits image count per response. Next real ingestion slice must obtain authenticated original-image SHA-256 and fully page final event captures, then secure parsed-result approval; do not turn on unattended importer or touch paused #3.

## October 16 #4 capped result-channel retrieval gate
Three real authorized read-only Space channel pages (8 images each) using intentional overlap moved past the Oct 16 event window to Oct 15/Oct 9; the first eight-image page was incomplete. New `scripts/audit-result-pagination.cjs` and regression tests reject missing overlap, gaps, exhausted single-message caps and unproven date coverage. New `scripts/hash-original-image.cjs` can hash locally downloaded original image bytes after explicit reviewer attestation, but the viewer's WebP image output is not verified as the original JPEG; **live byte provenance remains unresolved**. Docs: `docs/RESULT_REVIEW_PIPELINE.md`. After tests/deploy, next #4 slice is acquire authenticated original attachment bytes or equivalent trusted digest from a supported connector, manually inspect every final claim, compare to the approved ledger, and obtain explicit approval before importing a genuinely new event and verifying all downstream pages. No auto-publication or #3 UTC reactivation.

## October 16 #4 source integrity + Pages publication gate
Added a private-stdin-only Discord CDN source-image downloader with strict host/path/ID/redirect/content-type/size/original-file checks and a raw-byte SHA-256; images and signed URLs are not stored. **Current ChatGPT environment has not retrieved a real original Discord image**; external authorized runtime and connector URL access are still required to demonstrate this step. Added source Git commit to the static release manifest/HTML and mandatory **post-deploy** GitHub Pages live browser/export/manifest checks, eliminating reliance on predeploy-only green tests. Next: verify main Pages workflow is actually green at the exact published SHA; arrange a legitimate original-image fetch via the authorized reviewer runtime, visually validate a genuinely new final race, obtain parsed-result approval, then deploy one coherent cross-site update. Import/UTC schedules remain OFF where previously paused.

- October 16: user-supplied pre-Space lifetime Sparks ranks 1–40 and Hoops historical Sept29 12,416,538 baseline. The persistent dated Screenshot Gap is calculated against event Sparks *earned before* the screenshot and must survive subsequent logged rewards. See #2/#34 for verification.

- Oct 16 transfer reconciliation: clan All-time Sparks scoreboard resets on each AVENGERS/AV-2 transfer. Preserve player identity across moves, partition dated screenshots by source clan and verified stint, retain strongest positive uncovered floor in each overlap, sum independent floors once with four-event Logged. Hoops Sep29 AV 12,416,538 + subsequent rewards. PR #59 and #2/#34; don't infer missing stint history.

## October 16 source fixture privacy cleanup and verified Pages baseline
Latest verified Pages public manifest/browser status: main `6e1441f7e424c097864919fb3d20c5feb32133e2` (run 38979178450), before concurrent transfer-accounting #59 on `fc0bedf06569c53ae6eba62eaaa2891d075efa83`. Every new current main SHA requires its own Pages status. Replace non-synthetic Discord source attachment test IDs to avoid embedding source metadata in public fixtures. A read-only connector exposed original JPEG references, but authentic source bytes remain unavailable to this runtime. #4 original-byte ingestion and leader-approved new-result test still open. Do not undo recent transfer-aware Spark fixes, turn on imports, or revive paused UTC #3.

- Oct 16 full roster Sparks recovery audit (#63): audit all 100 current people, confirm 92 screenshot-evidenced identities and eight unknown, 33 people have 2,193,525.25 Sparks restored versus the superseded last-screenshot model, none decrease; documented Unlogged totals 32,906,303.1. Keep per-clan/stint floors, remove old UI single-screenshot fallback and publish consistent roster/profile. Document release SHA and browser verification on #2/#34.

## October 16 #8 reproducible PNGs — new sibling templates pending visual approval
Keep the approved Space renderer unchanged. New read-only event summary export/render path creates navy/cyan/purple Piggy/Flash/Kraken previews per event-time clan, historical PB previous/new/%, first-tracked, exact source rewards and explicit unknown/partial values, with no Kraken Stars or cross-unit Sparks/Effort. PR/Pages CI re-renders **six** accepted-ledger PNGs (two clans × three event types), stores PNG+manifest artifacts for leader to review; sidecars include event identity/source projection SHA and `readyToPost:false`. See `docs/EVENT_PNGS.md`, issue #8 for visual design approval and later idempotent Discord dispatch. No event source writes or unattended messages. 

- Oct 16 final Sparks historical accounting: **Sparks Prior to Logging** is one fixed value per canonical member, supported by largest positive screenshot difference against all prior independently Logged rewards (pre-Oct16 screenshots exclude Oct16 Space payout). 41 baselines totaling 32,734,751.6 Sparks are explicitly frozen; six candidate residuals under 1,000 are withheld for rounding review. New event logs only increase Logged. PR #66 and release status in #2/#34.
