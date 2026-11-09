# AVENGERS weekly six-event review-only PNG and companion draft

**Status:** NEW unapproved weekly visual; immutable approved-data model; NO sending.

**Superseded 2026-11-09:** this script and the visual it produces are a prototype that was never
approved as the leader's actual weekly recap. The approved artifact — background template,
renderer, and now automatic Discord posting — is `scripts/render-weekly-recap-poster.py` +
`scripts/build-weekly-recap-facts.py` + `assets/weekly/AVENGERS_WEEKLY_RECAP_MASTER_BACKGROUND_TEMPLATE_1440w.png`,
documented in `docs/AUTOMATIC_DISCORD_POSTING.md`'s "Weekly recap" section and
`docs/DECISION_LOG.md`'s 2026-11-09 entry. Do not use this file's script as the weekly recap;
it is kept only as a record of the earlier (incorrect) attempt.

Exactly Space, Piggy Flash 1 through 4, Piggy for a given Monday–Sunday week. The first iteration is Monday Oct 12 – Sunday Oct 18, 2026.

## Recreate from actual accepted source

```bash
node scripts/export-weekly-review.cjs weekly-AVENGERS-2026-10-12.json 2026-10-12 AVENGERS
python3 -m pip install Pillow==11.3.0
python3 scripts/render-weekly-event-review.py reports/weekly-AVENGERS-2026-10-12.json \
  reports/weekly-AVENGERS-2026-10-12-PREVIEW.png \
  --approved-library-art-dir assets/characters
```

Both PNG and sidecars are placed under gitignored `reports/`. The JSON and companion .txt come from one approved projection version and digest, not a text/image language model making up facts. Every output embeds `readyToPost:false`, `discordPostingEnabled:false`. The `@everyone` text is **only written to a .txt review file**: never sent or posted.

The art renderer will *hard fail* unless it can read the four exact approved character PNG bytes and verify their hashes: Spider, Terrorist, Kaboom/Pirate, Raccoon. **Updated 2026-11-09:** per the leader's 2026-10-25 decision (`docs/APPROVED_CHARACTER_ASSETS.md`), this repo's `assets/characters/` copies are now the approved, working source for all renderers, including this one — the hard-coded hash table was pointed at the older, 2026-10-19 Library-only filenames/bytes even after that approval, so this renderer kept rejecting the now-approved GitHub copies. The hash table has been corrected to match `assets/characters/AV_ExplodonSpider.png`, `AV_ExplodonTerrorist.png`, `AV_KaboomStar.png` and `AV_RaccoonRocket.png` as committed. If the four files are missing or modified from those checked-in copies, only the numerical JSON / Discord draft can be reviewed.

Source rules: event-time clan only; per-kind historic averages compare only prior results before current event within the same clan and, for Flashes, PF number; no baseline is explicitly excluded. Missing/partial event coverage is shown. Known total Sparks excludes post-Kraken PF1–PF4 as zero, with a prominent unresolved warning because some legacy source records currently show nonzero amounts. These conflicting ledger values MUST be reviewed and separately corrected in the site projection before any eventual posting. No change to frozen historical pre-logging Sparks. Achievement count is strictly new source-derived Piggy/Space performance threshold crossings from the website badge definitions (not falsely claiming all Spark/Streak badges).

**Review gate:** PNG appearance and verified week-specific content reviewed by leader; separate authorization for sending **after** Discord target verified. Automatic PNG dispatch OFF across both clans and all events. Never modify pinned temporary Piggy/Flash/Kraken templates in place. Weekly design is a distinct candidate, not an approved replacement.

**CI:** `scripts/export-weekly-review.test.cjs`, `scripts/test_render_weekly_event_review.py` and the existing staged full-event projection/smoke tests. The CI artifact contains JSON and text only, not a counterfeit/original-art-substituted PNG.
