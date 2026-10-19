# One accepted event → all AVENGERS website statistics (Issue #42)

**Last verified:** 2026-10-19. The site is a static release rebuilt from one canonical accepted source; no subscription or unattended Discord import. Council issue #7 is explicitly out of scope.

## Accepted source and transformation graph

```
Approved, versioned inputs and retained source archives:
  data/approved-event-updates.json                 (item-level reviewed result revisions)
  data/approved-post-kraken-no-spark-sets.json     (nine exact zero-Spark first Flash sets)
  data/sparks-prior-to-logging-2026-10-16.json     (28 immutable Unlogged balance entries)
  retained historic Piggy / Space / Flash / Kraken archives and snapshots
    |
    v
scripts/load-site-data.cjs → scripts/migrate-event-ledger.cjs
    |      preserves source row, event-time clan, alias, score/reward, status
    v
scripts/event-projection-core.cjs [apply / normalize / project]
    |      approvals, expected revisions, corrections/revocations, unknown rewards
    |      computes member histories, PB transitions, prior/current PB,
    |      record dates, last-3 / current arena / year averages,
    |      category Sparks/Stars, known payout coverage, ratings, period totals
    v
scripts/create-site-release.cjs
    |      builds D.members + D.piggy/space.events/history/overall,
    |      K.kraken event + monthly member scores, F.flash rows,
    |      breakdowns for roster, player profile, six league rows,
    |      sourced eligibility/rank/achievement consumers
    v
scripts/build-site.cjs (single immutable release)
    ├── dist/release-data.<sha>.js
    │    window.AVENGERS_DATA
    │    window.AVENGERS_EVENT_PROJECTION
    │    window.AVENGERS_EVENT_RELEASE
    │    roster breakdown, status labels and history
    ├── dist/index.html (one data-release-version + source-commit)
    ├── content-hashed .js/.css (no stale script mix)
    └── dist/exports/{eventSummaries,projection,ledger,
                     council,leagues,review}.<projectionVersion>.json
          each export has matching version and canonical data
```

## Browser consumers and no-drift checks

| Material statistic | Authoritative computed record | Visible/format consumer | Regression |
|---|---|---|---|
| Raw event scoreboard, corrections and status | `projection.events` + `D.piggy/space.events`, `F.events`, `K` | `index.html`, `phase2.js` | `site-release.test.cjs`, `fullsite-accepted-ingestion-gate.test.cjs`, Playwright |
| Score and original lobby PBs, record date, rank provenance | `projection.people.kinds.*.pbs`, historical exact event-time data | `index.html`, `phase2.js`, `space-rank-history.js`, `roster-piggy-pb-rank.js` | source rank/PB browser tests |
| Per-player past/last 3/arena-year averages; ratings | `projection.people.kinds`, `D.members`, `D.piggy/space.overall` | Overall, Rankings, player profiles | fullsite + site-release + Playwright |
| Logged Sparks and Stars, Unlogged and lifetime total | `projection.people.categories`, `earned`, **fixed priorToLogging** | roster, profile, category totals | audit-roster-reconciliation, `site-release.test.cjs` |
| Event-time clan and six five-week periods | `projection.leagues`, `release.leagues` (historical source clans) | `clan-league-rewards.js` and JSON/CSV | `audit-six-clan-leagues.cjs`, `audit-six-clan-leagues.test.cjs` |
| Achievements / community history | canonical projection and derived event streams | `community-highlights.js`, achievements/records | source and browser tests |
| Derived event PNG **drafts only** | `export-event-summary.cjs`, `export-weekly-review.cjs` | review JSON, original-art renderer, unsent message TXT | event-summary and weekly tests; **auto-sending OFF** |
| Council source projection (no Council issue #7 new work) | existing `projection.council` only | existing export | existing CI unchanged |

## Accepted event change test contract

[PR #105](https://github.com/AvengersMobControl/avengers-stat-center/pull/105) adds `scripts/fullsite-accepted-ingestion-gate.test.cjs`: for EACH Piggy, Space, Flash, Kraken, simulate a reviewed but unapproved insert (reject for real apply), an accepted insert, a changed/decreased correction at exact revision, then explicit revocation. Recalculate all materialized category payouts, recorded member history, roster totals and historical clan attribution; prove `Total=Logged + fixed Unlogged`, no Kraken Stars, six period data and one immutable release version exported across HTML and JSON. Existing integration and browser smoke tests check rank, achievements, history, compensation for incomplete sources and actual page content. Site release fails if any required proof fails. Actual publication requires CI, merged reviewed PR, exact deployed Git SHA, public export and browser checks.

**Scope limitations, NOT bugs to hide:** incomplete screenshots can create unknown member/reward counts; a final captured lobby does NOT attest complete all-clan coverage; past Kraken payout estimates are labeled; all six league accounting is an audited aggregate of *recorded sources*, not a certified all-pot statement. A currently open browser tab does not live-update without reload; the site is static. The older reported 165M → 171M is an approximate external reference whose precise scope is unknown.

**New Discord screenshot acceptance still separate (issue #4):** bound original Discord attachment bytes hash, independent human final-vs-progress image review, name/clan/score/payout verification, private/source identifier, missing-coverage disclaimer, approved item-level source revision, whole-site update and explicit publication gate. A source-only text claim or transformed image preview is not sufficient. A new input never automatically approves or sends anything. UTC #3 paused, Discord PNG posting OFF, AV-2 October18 held, Council #7 excluded.
