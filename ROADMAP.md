# AVENGERS development roadmap

**Canonical tracker:** [Master roadmap issue #13](https://github.com/AvengersMobControl/avengers-stat-center/issues/13)  
**Last organized:** 2026-10-15

This plan covers **AVENGERS / AV-2 Mob Control only**. Do not combine with SAC/Lock It In work.

## Current priorities

| Priority | Workstream | Issue | State as of Oct 15 |
|---|---|---|---|
| P0 | Roster, identities, lifetime Spark/Star ledger | [#2](https://github.com/AvengersMobControl/avengers-stat-center/issues/2) | Partially implemented; reconciliation required |
| P0 | Discord UTC/country intake | [#3](https://github.com/AvengersMobControl/avengers-stat-center/issues/3) | Development branch; do not merge without safety fixes |
| P0 | Discord event screenshot ingestion | [#4](https://github.com/AvengersMobControl/avengers-stat-center/issues/4) | Retrieval partial; validation/import outstanding |
| P0 | Missing AVENGERS Piggy Flash 1 | [#5](https://github.com/AvengersMobControl/avengers-stat-center/issues/5) | Data gap |
| P1 | Production deployment and regression coverage | [#9](https://github.com/AvengersMobControl/avengers-stat-center/issues/9) | Verification outstanding |
| P1 | Six Clan League reports | [#6](https://github.com/AvengersMobControl/avengers-stat-center/issues/6) | Partially implemented |
| P1 | Council minimums and near-minimum reports | [#7](https://github.com/AvengersMobControl/avengers-stat-center/issues/7) | Manual workflows; automate |
| P1 | Event PNG and Discord summaries | [#8](https://github.com/AvengersMobControl/avengers-stat-center/issues/8) | Partially implemented |
| P2 | Kraken route optimizer | [#10](https://github.com/AvengersMobControl/avengers-stat-center/issues/10) | Prototypes/research |
| P2 | Kraken attack-onset targeting study | [#11](https://github.com/AvengersMobControl/avengers-stat-center/issues/11) | Inconclusive |
| P2 | Unified player profiles and recruitment UX | [#12](https://github.com/AvengersMobControl/avengers-stat-center/issues/12) | Core UI exists; integrations pending |

## Current roster facts
- October 15, 2026 screenshot roster: 48 AVENGERS, 50 AV-2.
- Leadership explicitly added **DrDetroit** and **Starred** to AV-2, giving 52 tracked AV-2 roster entries. No unverified lifetime Spark/Star totals should be assigned to them.
- Bubba remains inactive; Frenchie2 and Frenchie(-4) are distinct accounts.
- Preserve the **event-time** clan on past Piggy/Space/Flash/Kraken records.

## Accounting invariants
- Logged Sparks = Piggy + Space + Flash + Kraken.
- Logged Stars = Piggy + Space + Flash. There is no Kraken Stars column.
- Lifetime snapshots **are not additional event awards**.
- Unlogged totals must not silently conceal duplicate payouts, mapping errors or negative differences.
- Missing data stays unknown, not zero.
- A correction to historical scores must update dependent leaderboards, personal bests and Clan League summaries without double counting.

## Automated data ingestion rules
- Apply new event results only after event and player identity verification.
- Reject preliminary screenshots. Preserve sources for final records.
- Keep Discord secrets and raw Discord IDs out of public repository files and browser data.
- Discord UTC offsets do **not** establish nationality/country. Accept only explicit country disclosures.
- Discord nickname alone is not a sufficiently trusted account-linking mechanism without safeguards.
- Detect channel backlog pagination, retries and duplicate messages.

## Definition of complete
All work moves independently through **Implemented → Deployed → Verified**. Only close an issue when its acceptance criteria have passed and the evidence is recorded. A GitHub/Vercel build marked READY is not sufficient.

## Operating order
1. Reconcile roster/ledger truth and protect historic data.
2. Secure UTC intake and complete end-to-end tests before merging into production.
3. Complete Discord event import and missing PF1 recovery.
4. Add six-league and council reporting.
5. Automate consistent event graphics.
6. Extend Kraken optimization, video research and player experiences.

For detailed tasks and dependencies, follow the linked GitHub issues rather than copying separate chat checklists.
