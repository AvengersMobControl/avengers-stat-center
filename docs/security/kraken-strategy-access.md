# Kraken strategy access policy (leader-approved 2026-10-20)

## Classification

**Kraken strategy is MEMBER-ONLY and NEVER available through a guest pass.** This includes permanent and time-limited passes. It covers champion/map/ticket optimization, route planning, ticket allocation, recommended paths, estimated damage coefficients, presets, strategy-specific analytics and their exports. Existing published Kraken **event results, scores, placement/PBs, and historical statistics** are not reclassified by this instruction.

## Hosting facts and mandatory boundary

- The `AvengersMobControl/avengers-stat-center` repository is **public**, and GitHub Pages serves publicly accessible HTML, JavaScript, images and downloadable exports. **Do not put proprietary strategy or enough material to reconstruct it in this repository or any publicly hosted artifact**, even behind a hidden nav button.
- A hidden client-side tab, JavaScript `isGuest` branch, secret URL, or UI-only Discord login check is **not authorization**. Strategy retrieval/calculation must use **private server-side implementation and data storage**, outside the public repo/build.
- A Vercel/API route may be used only after independently verifying a signed, unexpired, server-issued Discord OAuth member session. Explicitly reject `guest===true` and `permanentGuest===true`, anonymous or invalid sessions. Validate membership entitlement rather than trusting arbitrary request flags or client-provided Discord IDs. Deny by default if identity cannot be confirmed.
- Protected responses and errors: use `Cache-Control: private, no-store` and no shared/public cache; do not embed strategy in HTML bootstrap, page source, JSON exports, browser asset bundles, source maps, static files, guest-visible PNGs, or client logs. Deep links and direct API queries must enforce the **same server-side** permission check.
- Do not store future sensitive strategies in the existing public repo, even in `api/**` source: public repository users can read server-code implementations. Use a private deployment/service or private data/model store with an appropriately confidential backend design. The existing AVENGERS-only Neon project could be evaluated for confidential *data*, but private computation/source separation remains required. Keep SAC services, credentials, and records separate.

## Release-blocking tests

Before any strategy functionality is exposed, test server/API responses and browser network traffic for anonymous access, temporary guest, permanent guest, expired token, malformed/forged token, known non-member, stale permissions, and direct URL/API access: no strategy payload or indirect leakage. Separately verify an authorized **non-guest** Discord OAuth server member can access the intended functionality. Inspect public GitHub Pages contents, release exports, built assets and repository changes for accidental strategy exposure. Tests must run against the deployed authorization boundary, not only a mocked front-end gate.

**No Kraken strategy feature may go live until this policy and negative-access tests pass.** Current publication/ingestion holds are unchanged: automatic Discord event-summary PNG dispatch OFF for both clans; #6 deferred; #7 excluded; UTC #3 paused; held Oct 18 AV-2 ingestion; SAC project entirely separate.
