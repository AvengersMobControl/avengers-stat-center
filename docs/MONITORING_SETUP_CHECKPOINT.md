# AVENGERS monitoring setup - verified 2026-10-17
## Scope and status
LIVE VERIFIED: canonical Pages website uptime; exact-commit release verification and isolated operational PostHog event; owner-only Better Stack email delivery.
No clan result, frozen unlogged Sparks, aliases, approved PNGs, publishing state or Neon changes as part of this infrastructure setup.

## Objects and isolation
- Shared administrative Better Stack team t617000 (one owner/admin), not account-level isolation.
- Existing monitor5085541 renamed AVENGERS - Stat Center, monitor group AVENGERS1538160. https://avengersmobcontrol.github.io/avengers-stat-center/ GET every3min, SSL validation ON, recovery3min, email-only, no paid alerts.
- PostHog project670043 AVENGERS - Stat Center in org Lock It In HQ. AV-only event avengers_pages_release, separate ingestion token/fingerprint.
- Encrypted AVENGERS_POSTHOG_PROJECT_TOKEN exists ONLY in this repo Actions secrets; AVENGERS_POSTHOG_ENABLED=true. Fixed project ID670043. No SAC source, tokens, heartbeat URLs, events or queues.
- Neon project wandering-dream-60244468 remains AV-only; not accessed or changed by monitoring setup. Restricted-role migration/private backend work remains existing separate #8 approval task.

## Production evidence
PR80 merged2ed17a63d369e0e2123bae011657c6a8d1ab8397 after privacy CI39007440283 and full projection/browser CI39007440211 SUCCESS.
Pages run39007847915/job117323863163 SUCCESS, including full-site projections, six-league reconciliation, approved PNG ledger validation, rendered browser checks, deployment and exact published commit/export/browser verification.
Final Actions log AVENGERS_TELEMETRY accepted. Independent AV project query returned avengers_pages_release, production, success/verified, release2ed17a63d369e0e2123bae011657c6a8d1ab8397 at2026-10-17 00:56:29CT.
Owner-only Better Stack test accepted; matching email received2026-10-17 00:59:40CT. Monitor observed UP repeatedly, no duplicate site monitor.
Source has7 privacy tests; no-network disabled/wrong-scope handling, allowlisted payload, fixed host and timeout/no retries pass.

## Monthly cost/privacy controls
User requires AV to remain within monthly free limits. All14 shared-org usage-product caps set to0 and read back after reload after explicit owner authorization. Paid overage ingestion is capped; caps can stop telemetry, so missing events must not trigger automatic paid upgrades.
No paid add-ons, custom Logs retention or AI SRE purchased. Logs custom retention is explicitly outside ingestion cap and remains unused. Do not claim a blanket guarantee against future unrelated account purchases.
No browser SDK, autocapture, replay, console recording, surveys, heatmaps, automatic exceptions/web vitals, profiles, raw errors/chat/member identities/private URLs or clan source data. Payload fixed project/environment/outcome/code/exact release and random operational distinct_id. IP anonymization and geo disabled.
Do not add broad PostHog LLM analytics or increase caps to troubleshoot. Repo opt-out AVENGERS_POSTHOG_ENABLED=false reverses delivery independently of Pages.

## Real workflow inventory
| Job | Trigger/cadence | Monitoring decision |
|---|---|---|
| Pages release | push main/manual, not periodic | Existing verification and commit status; one event after actual final live_verify outcome |
| Projection / roster audit / privacy tests | path-specific PR/push/manual | Existing CI checks/artifacts; no false recurring heartbeat |
| Discord UTC roster | Mon/Fri15UTC schedule present, feature gate PAUSED | No dispatch or heartbeat; #3 stays paused |
| Summary publisher | OFF | No sending/deletion or expected-heartbeat alarms |

No AV recurring heartbeat was created: this project has no verified active periodic business job requiring one. Event-driven release inactivity is normal, not a missed-job incident. Failed deployment attempts can emit a failure event after live verification fails; cancellations are skipped. PostHog delivery is best effort and never changes business result. It is not proof of Discord delivery or correctness of source ledger.
The shared disposable missed-heartbeat test used only SAC STAGING510983/incident1033400904 and owner email; that tests platform alert/recovery mechanics, not an AV scheduled task.

## Safe diagnostics / response
1. Read failed Pages job step and artifacts, then source commit/status; compare live public release to exact Actions source SHA. Do not infer latest main is already deployed.
2. Use existing projection/roster/PNG validation and public browser checks. Fix source/validation error before rerunning deployment. Do not recalculate frozen Sparks or edit ledger to silence a monitoring warning.
3. If PostHog lacks an event, first check AV opt-in/secret name, fixed project670043, sanitized accepted/unavailable log and monthly cap; never export raw exceptions/source data or use SAC token.
4. Website uptime failure is owner email; no phone/SMS or paid AI SRE. Existing GitHub CI produces actual technical diagnosis. Neither Better Stack nor PostHog automatically wakes an ordinary ChatGPT conversation.
5. Rollback telemetry by AVENGERS_POSTHOG_ENABLED=false; keep existing Pages verification and paused Discord gates. Do not apply Neon migrations/credential rotations as monitoring repairs.

## Return to AV normal conversation
Read docs/PROJECT_CONTINUITY.md, docs/DECISION_LOG.md, ROADMAP.md, latest master #13 and relevant issue comments. Resume the existing product task order from latest GitHub. Preserve temporarily approved PNGs under #8, frozen unlogged Sparks/1% policy, identity mappings, all linked cross-site projections. UTC #3 remains paused and automatic Discord publishing/deletion OFF. Restricted Neon runtime role/credential migration is separate unfinished work requiring its existing explicit approval.
