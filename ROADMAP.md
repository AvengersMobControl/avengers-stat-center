# AVENGERS / AV-2 Mob Control — living development roadmap

**Updated:** 2026-10-16 UTC. **AVENGERS ONLY — never mix with SAC / Lock It In.**
- [Project continuity handoff](docs/PROJECT_CONTINUITY.md) — user rules, identities, current code and pause decisions.
- [Dated decision / implementation log](docs/DECISION_LOG.md) — append every meaningful milestone and record verification evidence.
- **Canonical work tracker:** [master issue #13](https://github.com/AvengersMobControl/avengers-stat-center/issues/13), with individual GitHub issues for acceptance criteria.
- **Main site:** https://avengersmobcontrol.github.io/avengers-stat-center/.

## Priority and accurate current state

| Order | Workstream | Status / next action |
|---|---|---|
| **NEXT / P0** | [#4 Event-result screenshot ingestion](https://github.com/AvengersMobControl/avengers-stat-center/issues/4) | Partial retrieval exists; end-to-end final-only multi-image import not verified. Start with approved-channel, read-only/sample dry-run, provenance and alias dedup. No unattended publication without leader authorization. |
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

**The next practical session should begin with issue #4, planning a validated read-only ingestion sample.** Do not automatically access/result-post to Discord without leader authorization.
