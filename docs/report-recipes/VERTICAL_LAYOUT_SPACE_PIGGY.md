# Tall Space and Big Piggy PNG layouts — review revision, October 22, 2026

The leader prefers the vertically expanding four-Flash design: a readable poster that grows with the number of records instead of squeezing lists into fixed-size cards. This dated revision updates the visual layout of the Space Race and Piggy Race recipes. All existing statistical/source eligibility rules remain in force.

## Shared design

- 1440-pixel-wide portrait review render, dynamically tall, with high-contrast navy, cyan, magenta, purple, green and record-gold accents.
- Header shows actual event date, event-time clan, correct event ID and verified/unverified coverage. Four 2×2 headline KPI cards lead the design.
- Full source-backed recognition lists reflow vertically; **no fixed four-person PB limit** or silent list truncation. An unfit name/number causes a validation error.
- Separate historical comparison and previous-event baselines; do not assert percentage improvement from uncomparable coverage.
- **Dedicated individual performance spotlights in EVERY report** immediately after the previous-event comparison: (a) actual current-event score leader (**Top Line Contributor**, objectively most verified lines, for Piggy; highest distance for Space), (b) strongest source-backed improvement over the player's earlier *same-clan/same-kind* personal average if one exists, (c) recorded five-week clan-league-to-date **same-event-type cumulative performance leader** (total Space distance or Piggy lines), plus tracked league Sparks contributor, with explicit known/missing reward qualifiers. Show the count of returning players who beat their own earlier same-clan event average and the eligible denominator. Do not confuse personal-average improvement with PB improvements.
- Determine the five-week league window from the accepted site's 35-day Kraken-anchored cadence (latest certified completed league ended October 11, 2026). A future endpoint is cadence-derived and should be labeled as such. Attribution is by **event-time clan**; a member's prior AV-2 data does not silently become AVENGERS history. Incomplete projections yield **tracked** league contributions, never a claim of total actual rewards or complete ranks.
- No generated player names, numerals, medal claims or dates. The website's frozen event export provides exact text/data and a separate compositor draws it.
- The available CI preview has **no character originals**. A final template must integrate exact SHA-verified originals from the approved character Library; never introduce AI lookalikes. Until artwork is present and reviewed, preview-only and automatic Discord sending OFF.

## Space Race — vertical content order

1. Total distance in billions, average distance per participant, known clan Stars, known Sparks; record participant and unknown reward counts.
2. Prior accepted same-clan Space comparison: total and average changes, with prior date and coverage caution.
3. Individual performance spotlight band for the given five-week clan league: current-event distance leader, strongest improvement over own prior average, tracked cumulative Space-distance leader in the clan league, tracked all-event clan-league Sparks leader, above-prior-average count.
4. Top 10 by distance: exact distance, Stars, Sparks, screenshot share; source lobby rank may appear only when independently observed, never infer an actual game medal from score order.
5. **All** returning-player distance PB transitions, including previous PB/date, new total and percentage increase.
6. **All** first-tracked Space members, with actual distances.
7. Meaningful Space-only Sparks-per-billion effort shoutouts, limited to racers with at least 100B recorded and both required quantities known. This recognition metric must stay out of the roster and Space Overall tables.
8. Source version, partial/final coverage notes, and a distinction between screenshot-observed vs derived rewards when available.

## Big Piggy — vertical content order

1. Total lines, average per participating player (one-line placeholders excluded), clan-earned Stars distinct from whole-lobby pot, known Sparks and participant count. Add the **same-clan all-time whole-lobby Big Pig pot rank** with denominator from comparable weekly Big Pig pots, and the **largest verified single individual pot** with recipient. No 'top individual pot earners' leaderboard. No weekday-only rank; Big Pig is weekly.
2. **AV-2-only prominent rake card:** sum of screenshot-displayed shares for all AV-2 members in the same lobby; never substitute a calculated Stars/pot fraction.
3. Change in **total lines** versus previous comparable Piggy, plus last five same-clan average trends.
4. Individual performance spotlight band for that five-week clan league: **Top Line Contributor** (most verified lines; name and exact total; ties disclosed), strongest improvement over own prior average, tracked cumulative Piggy-lines leader in the clan league, tracked all-event league Sparks leader, above-prior-average count.
5. Top 10 by lines only; do not call score order original game finish order.
6. **All** returning-player line PBs: previous amount/date, new amount, percentage improvement.
7. **All** qualifying actual finishing-rank PBs, separate from line PBs: original source ranks and prior dates, with independent 30+ AVENGERS / 5+ AV-2 single-lobby thresholds.
8. **All** first-tracked Piggy appearances and their lines, separately identified from new PBs.
9. **Notable new-member performances** as their own independently evidenced category, even if a member has prior tracked results; first tracked and new member are not synonymous.
10. Dynamic qualifying benchmark ladder: 5K+, 10K+, 20K+, 30K+, 40K+, 50K+, 60K+, 70K+, 80K+, 90K+, 100K+. Each tier counts unique participants meeting or exceeding the threshold. Display only tiers with a nonzero count; omit all unreached levels. GOLD means clan record or tied record only.
11. Source ledger version, coverage state, rank caveats and mandatory original-approved-character check.

## Implementation and review gate

The experimental renderer is scripts/render-vertical-space-piggy.py with regression tests in scripts/test_render_vertical_space_piggy.py. The accompanying GitHub Actions preview job builds four source-backed historical review images from the accepted event-summary export. All images and sidecars are explicitly preview-only: no site data mutation, no Discord message, no dispatch switch change and no production template replacement.

Review and acceptance are tracked in issue #8. Do not promote this vertical design until factual QA, approved original art and user visual approval are complete.
