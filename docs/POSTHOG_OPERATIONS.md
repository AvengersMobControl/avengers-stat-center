# AVENGERS operational PostHog transport
Project 670043 ONLY. Server/CI-only, one bounded POST per run, no retry, no browser SDK, chat/member identities, URLs, raw errors, person profiles or session replay. Public code stores only SHA256 fingerprint of its own write-only intake token; a wrong-project token fails closed.

Tests: node --test scripts/posthog-operations.test.cjs
Enable only after merge and independent intake verification: repository variable AVENGERS_POSTHOG_ENABLED=true and repository Actions secret AVENGERS_POSTHOG_PROJECT_TOKEN. Project ID fixed in workflow. No personal/admin API token accepted. Do not put intake tokens into source or any other repository.
Rollback: set variable false; missing secret also disables delivery via scope_mismatch. Telemetry failure never changes business result, sends a bot message or retries business work. Disabled/missing-secret status is NOT proof ingestion worked. Verify exact event project/outcome/release in PostHog.
Pages success means the existing exact-SHA/export/browser verification succeeded. Skipped/failed verification reports failure, never successful deployment; no recurring cadence is invented.

All14 organization-wide PostHog product caps were owner-approved and visibly set to $0. Logs custom retention/add-ons remain unused; that cap exclusion means no universal promise about future product purchases. Shared billing/admin org is not a shared telemetry project.
