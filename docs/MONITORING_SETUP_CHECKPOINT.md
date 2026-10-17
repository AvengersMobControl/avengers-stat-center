# AVENGERS monitoring setup checkpoint — 2026-10-17
AVENGERS / AV-2 ONLY. Workstream #78; master #13. Infrastructure is IN PROGRESS.

## Verified baseline
- main before monitoring work: be4966d3a028164cf01ceb3d7e8b455b9ea54386.
- GitHub Pages run 38998966990 and staged projection run 38998967003 SUCCESS for that SHA.
- Public Pages root GET HTTP200 independently observed. Existing Pages workflow contains exact live SHA/export/browser verification after deploy. Root availability alone is not stats integrity evidence.
- Vercel project env metadata inspected with decrypt=false: encrypted production AVENGERS_DISPATCH_DATABASE_URL plus project-scoped Discord/auth secrets. No PostHog/heartbeat key shown. No credential values decrypted.
- No Discord publication, UTC run, migration, data correction or PNG modification performed.

## Actual automation inventory
| Workflow | Trigger | Monitoring consequence |
| --- | --- | --- |
| pages.yml | push main / manual | event-driven release; report failure and successful exact-SHA live verification, not daily absence |
| event-projection-test.yml | source CI | gate releases; CI failure signal, no recurring absence expectation |
| roster-reconciliation-audit.yml | filtered PR / manual | no scheduled heartbeat |
| discord-utc-roster.yml | Mon/Fri15UTC declared, feature-gated; manual bypass exists | PAUSED per authoritative record; never manually dispatch for monitoring; no expected heartbeat |
| Discord summary publisher | hard OFF / not live | no expected heartbeat |

Do not invent periodic imports or conflate a ChatGPT review automation with a repository scheduler. GitHub Actions source alone cannot prove current repo-variable state; no variable-write/activation performed.

## Better Stack — prepared, access blocked
Target independent group AVENGERS / Mob Control; existing site monitor name AVENGERS - Stat Center. Existing 3-minute UP screenshot is historical; monitor ID/current interval/alert destinations NOT yet inspected.
Secure browser sign-in reached SSO provider selection but authentication declined. No objects/routing changed.
Next authenticated step: list existing monitors, move rather than duplicate, verify content/redirect and owner route. No paid AI SRE, phone/SMS or sensitive log capture enabled.

For release checks, use existing Pages post-deploy verify as success boundary. A generic interval heartbeat would falsely alert when there is no release. Use deployment-failure event and bounded in-progress deployment expectation instead. If adding a new recurring public read-only health workflow later, document cadence and enable monitor/secret together after tests.

## PostHog — inventory, not configured
Current connector exposes org Lock It In HQ, ID 01a147de-5097-0000-6c55-2240f21247ca, only empty Default project 669926 (onboarding false, ingested_event=false). Do not assign this default to AVENGERS or share with another product.
Proposed independent project AVENGERS - Stat Center. Name confirmation required by project-create tool; pending. Separate organization is optional owner/billing decision, not silently provisioned. No key, dashboard, exception capture or production telemetry exists from this setup.

Candidate allowlisted operational events: pages_release_verified / pages_release_failed / data_projection_validation_failed. Properties limited to fixed project, environment, release SHA, operation, sanitized code/count/duration bucket. No clan member identifiers, Discord content/IDs, raw screenshots, raw errors, private URLs/query strings, IPs or secrets. No replay, autocapture, automatic pageviews or person profiles. Use manual sanitized events only after schema tests and preview ingestion readback. Reference https://posthog.com/docs/privacy/data-collection.

## Safe diagnosis and routing
1. GET canonical Pages root and public release manifest/exports found in verified source; compare SHA to actual successful Pages run.
2. Inspect release job/log outcomes and deterministic validation results without importing new source events.
3. Report source versus projection versus deploy failure; no stats rewrite, payout inference, frozen Sparks recalculation or blind re-deploy.
4. No automatic Discord send/delete/retry. Uncertain outcome requires receipt reconciliation.
5. Staging-only missed-signal/recovery test must use separate object and no real Discord channel.
6. Monitoring rollback removes only newly scoped telemetry/hooks; leaves existing monitors and business hard-offs unchanged.

## Boundaries / acceptance
- Frozen Sparks Prior to Logging, roster identities and original approved event PNGs unchanged.
- UTC paused, automatic Discord send/delete/publication OFF.
- Existing Neon role limitation remains a separate #8 security task; no migration rerun or owner-credential exposure.
- Endpoint HTTP200: observed. Pages workflow success: read back. Better Stack grouping/routing: BLOCKED. Heartbeat/incident staging test: NOT implemented. Separate PostHog project: BLOCKED name confirmation. Instrumentation/deploy/ingest: NOT implemented.
- Final normal-chat handoff is NOT ready until infrastructure verification complete.

Next: resume authenticated Better Stack inventory if user elects, confirm project name, create independent PostHog project with privacy protections, then stage scoped Pages outcome reporting without altering public statistics or activating Discord. Record exact IDs, commit/tests and ingest evidence in #78/#13.
