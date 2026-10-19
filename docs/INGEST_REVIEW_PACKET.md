# Unapproved result candidate — exact impact review packet (issue #4)

**Status:** manual, read-only data simulation; NO Discord writes, NO import approval.

This is a proposed-result review tool that follows the existing **private original Discord attachment proof** + independent verified FINAL screenshot parsing. It is **not an OCR algorithm, image parser, unattended scraper, approval token or Discord publisher**. It makes the affected data and all historical league totals inspectable *before* the leader decides whether the individual capture is correct.

## Review-only procedure

1. Retrieve authorized original Discord CDN bytes privately with `scripts/fetch-original-discord-image.cjs`. Validate attachment channel/type, get original SHA-256 and keep private Discord URLs/account IDs **out of public repository and reports**. A resized image preview is not original-byte proof.
2. Independently visually classify each screenshot: final-result claim verified; exclude preliminary/progress and off-topic assets (e.g., Sacred Tier clan rankings, illustrations). Transcribe **only AVENGERS or AV-2** competitors with verified `score`, Sparks and Stars (use `null` when actually unknown), verified *event-time* clan and source lobby/rank, never inference from current roster. Screens that are cropped/partial do **not** justify full-event coverage. If a source is on an explicit event hold, keep it held.
3. Bind original image receipts to reviewer screen keys with `scripts/verify-result-image-proofs.cjs`; call `scripts/assemble-result-review.cjs` to deduplicate and produce a **candidate** with `approved:false` and expected event revision. No push, no import, and no acceptance without explicit leader authorization of this specific member/event result.
4. For an assembled candidate stored privately as `reports/event-candidate.json`, run:

```bash
node scripts/report-ingest-candidate.cjs reports/event-candidate.json approved-review-preview
```

5. Review `reports/approved-review-preview.json` + `reports/approved-review-preview.csv`. The packet includes the source event ID/date/revision, changed and unchanged row counts, member/clan score/reward/rank changes, distinct **unknown payout counts**, exact changed member lifetime Sparks/Stars/frozen prior-logging values, six-league period deltas, and old/proposed immutable website projection fingerprints. Partial coverage is explicitly identified, and `reviewDigest` locks the exact candidate report contents.
6. Withhold approval for any error, missing event-time clan, impossible preliminary reward, unverified original-byte receipt, ambiguous identity, missing screenshots, or held event. Only after the leader explicitly approves the verified rows should `scripts/stage-event-update.cjs` be used with the approved source update locally; then require tests, PR review, one coherent staged site release, and exact published Pages SHA+browser/exports verification.

**Hard invariants:** the script does not write source ledgers, change original rewards, send Discord, set `approved:true`, change any fixed Unlogged Sparks or enroll a user into unattended polling. `readyToImport:false` in every report. It does not resolve missing final screenshots and does not infer unavailable Spark/Star rewards.

**Examples excluded from approved ingestion on Oct 19:** off-topic Piggy illustration; Sacred Tier clan leaderboard (not an individual event); October 18 AV-2 Piggy partial results (explicit leader hold). A visually matched October 16 Space result (AV-KNAVEN, 40.7B, 77,269 Stars, 7,774 Sparks, source lobby D rank 1) already exists in the approved ledger, therefore its replay should be unchanged and never double-counted. These sources are **not** new approved result imports.

## Scope

- Source projection and all-page propagation: completed and production-gated by [PR #105](https://github.com/AvengersMobControl/avengers-stat-center/pull/105); dependency inventory `docs/EVENT_TO_SITE_DEPENDENCIES.md`.
- Leader item-by-item approval for genuinely new screenshot results: **outstanding issue #4**. No silent entry.
- Six-league totals audited but not independently certified complete clan pots; see issue #6 and PR #106.
- The weekly graphic design is still deferred for user review; PNG auto-publishing disabled both clans/all event types. Paused UTC #3, Council #7 excluded, Oct18 AV-2 Piggy held, SAC kept separate.
