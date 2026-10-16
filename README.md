# AVENGERS Stat Center

Mob Control statistics, historical event records, ratings, player profiles, current AVENGERS / AV-2 membership, and reporting tools.

**Public site:** https://avengersmobcontrol.github.io/avengers-stat-center/  
**Development tracker:** [Master issue #13](https://github.com/AvengersMobControl/avengers-stat-center/issues/13) · [Full roadmap](ROADMAP.md)

## Data and website
The application currently uses `index.html` and associated local data/source scripts. It includes Piggy/Space/Flash/Kraken records, ratings, player history, achievements, clan views and exports. The historical arena era begins August 1, 2026.

**Do not use the previously documented September 2026 “latest event” dates as evidence of current data freshness.** The event ledgers, dated screenshot snapshots and import history are the sources to validate for each event category. Different event types can have different latest verified dates.

### Current roster snapshot (October 15, 2026)
- AVENGERS: 48 screenshot-confirmed entries.
- AV-2: 50 screenshot-confirmed entries plus DrDetroit and Starred added at the clan leader's direction (52 tracked roster entries).
- Lifetime Spark/Star totals missing for the two manually added members are unknown, **not zero or inferred**.
- Historical player aliases and clan-at-event attribution must be preserved.

## Event membership and accounting
Event results belong to the clan in the original result screenshot, **not the player's current clan**. Current membership changes cannot retroactively move historical results.

Logged Sparks = Piggy + Space + Flash + Kraken.  
Logged Stars = Piggy + Space + Flash; do not create Kraken Stars.

All-time screenshot snapshots are reconciliation references, not additive reward transactions. Missing historical results should remain explicitly unresolved.

## Automation status
An experimental UTC/Country Discord sync exists in `feat/discord-utc-roster-sync`. **It is not approved as a production-ready integration.** It needs the safety, current-roster freshness, identity assurance, pagination and end-to-end checks tracked in [#3](https://github.com/AvengersMobControl/avengers-stat-center/issues/3).

Do **not** place raw Discord user IDs, bot tokens, or other private identifiers in public repository files. Do not infer country solely from UTC.

## Deployment and completion
The repository includes a GitHub Pages publishing workflow. Additional Vercel previews are not necessarily the canonical production site.

Separate **implemented**, **deployed**, and **verified**. A successful build is not enough: verify behavior and preserve historical data before closing a work item.

## Work planning
See [ROADMAP.md](ROADMAP.md), then use each linked GitHub issue for its checklist and acceptance criteria. AVENGERS/Mob Control and SAC/Lock It In are deliberately maintained as separate projects.
