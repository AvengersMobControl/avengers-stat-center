# AVENGERS Stat Center

Mob Control statistics, historical event records, ratings, player profiles, current AVENGERS / AV-2 membership, and reporting tools.

**Public site:** https://avengersmobcontrol.github.io/avengers-stat-center/  
**Live project handoff:** [Current decisions and requirements](docs/PROJECT_CONTINUITY.md) · [Dated decision/implementation log](docs/DECISION_LOG.md)  
**Development tracker:** [Master issue #13](https://github.com/AvengersMobControl/avengers-stat-center/issues/13) · [Full roadmap](ROADMAP.md)

**For future ChatGPT sessions:** read the live GitHub handoff, log, roadmap and relevant issues before doing work. GitHub is the maintained continuity source; a ChatGPT Project-uploaded PDF/Markdown copy is optional and becomes stale unless manually replaced. The PDF is for human reading; do not make the leader re-upload it as a prerequisite for continuing work.

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

Total Sparks shown on roster = Logged Sparks + Screenshot Gap, where Screenshot Gap = max(0, earlier all-time screenshot Sparks minus Logged Sparks). Screenshot Gap is not a new event reward and must never inflate the four Logged categories. Older Sep 29 screenshots naturally lack Sparks earned afterward, so do not add warning triangles when Logged exceeds those snapshots. Missing historical results should remain explicitly unresolved.

## Automation status (updated October 16, 2026)
- **Discord UTC/country:** Encrypted integration code is merged and bot read access was verified. A real test submission remained pending for identity verification; the leader explicitly paused further UTC work. Monday/Friday automated polling remains **disabled** unless `DISCORD_UTC_SYNC_ENABLED=true` is set deliberately after approval. See [current continuation status](docs/PROJECT_CONTINUITY.md) and [issue #3](https://github.com/AvengersMobControl/avengers-stat-center/issues/3).
- **Event-result screenshot ingestion:** approval-gated read-only result review, capped-image pagination audits, stable result replays, and a source-image SHA-256 verifier exist. Genuine new results still require original authorized image bytes, verified final-only parsing, and explicit leader approval. **No unattended imports or Discord posting.** See [issue #4](https://github.com/AvengersMobControl/avengers-stat-center/issues/4) and [review guide](docs/RESULT_REVIEW_PIPELINE.md).
- **Do not pursue** the missing October 13 AVENGERS Piggy Flash 1 main lobby; [issue #5](https://github.com/AvengersMobControl/avengers-stat-center/issues/5) is closed as not planned.

Do **not** place raw Discord user IDs, bot tokens, or other private identifiers in public repository files. Do not infer country solely from UTC.

## Deployment and completion
The canonical public site is GitHub Pages. Every Pages deployment now stamps the source Git commit in the public HTML and release manifest, then checks the live public DOM, export versions and both clans in Chromium. Its result is attached to the exact GitHub commit as the `AVENGERS GitHub Pages production` status. **Most recently verified on 2026-10-16:** `6e1441f7e424c097864919fb3d20c5feb32133e2` ([passing GitHub Pages run](https://github.com/AvengersMobControl/avengers-stat-center/actions/runs/38979178450)). Confirm the status of **current** main before relying on it; Vercel READY alone is not proof of canonical production.

Separate **implemented**, **deployed**, and **verified**. A successful build is not enough: verify behavior and preserve historical data before closing a work item.

## Work planning
See [ROADMAP.md](ROADMAP.md), then use each linked GitHub issue for its checklist and acceptance criteria. AVENGERS/Mob Control and SAC/Lock It In are deliberately maintained as separate projects.
