# AVENGERS Piggy Race — PNG and Discord Report Operating Standard
**Updated 2026-10-19 (America/Chicago) • AVENGERS project only • manual review required**

## Current reference and composition
The leader likes the October 18 neon AVENGERS Piggy weekly summary with a subtle average-lines-per-player magenta trend line, four top statistics, line PBs, qualifying finishing-rank PBs, first AVENGERS Piggy appearances, Top 10 lines and benchmark accomplishments. This is a **style/content reference**, NOT a pixel-locked image; panels, dimensions and spacing must expand/shrink/rearrange to accommodate fluctuating PB and new-member counts. Keep the same dark navy/cyan/magenta aesthetic, readable fonts and high-resolution output. Use **ONLY the original 12 approved character PNGs** from the Library described in `docs/APPROVED_CHARACTER_ASSETS.md`; never invent, approximate or substitute an unapproved character. Character art must not overlap table contents.

## One authoritative structured event payload
Before generating image *or* prose, validate and freeze the same published event-data version/commit SHA for both. Include event date; event-time clan and lobby; unique participants; total lines; average; actual Star pot (distinguish exact sum from rounded game display); week-to-week total-lines percentage; and average-lines-per-participant historical trend. AV-2 results and AVENGERS must remain separate, including player transfers.

Required groups:
1. **Line PBs:** all verified improved returning-player line PBs, previous and new counts, % change, and M/D previous PB date. These dates are historical per-line PB dates, distinct from rank PB dates.
2. **Finishing-place PBs:** actual qualified best place (not lines-based ranking) before and after, previous rank PB's M/D date. Eligible event: at least 30 distinct observed AVENGERS in the **same** lobby. Exclude small/solo and AV-2 lobbies. Put first-time eligible participants in first-appearance section rather than rank PB improvements.
3. **First AVENGERS Piggy appearances:** name, lines and actual event rank; a player whose prior history is AV-2 still qualifies for first AVENGERS participation. Do not erase combined historical rewards or create duplicate accounts.
4. **Top 10 by lines:** actual scoreboard order, canonical AV- name, lines only; top three get *verified* career first/second/third/win/podium number snippets. Do not show redundant Star/Sparks/share/efficiency columns or a redundant Sparks headline. Canonical alias changes must be resolved from user-confirmed identity before posting.
5. **Milestones:** counts at **inclusive** 5K+, 10K+, 20K+, 30K+, 40K+, 50K+, 60K+, 70K+, and higher if achieved. Gold only when the event *equals* a verified tracked clan maximum (new or tied), drawing from `piggy-benchmarks.js` / approved event history. **Every benchmark box MUST include this legend exactly: `GOLD = CLAN RECORD OR TIED RECORD`.** Suppress unachieved upper thresholds if they don't add information on a crowded PNG.
6. **Comparison note:** meaningful source-confirmed event context, records, proximity to Star-pot PB, etc. No invented superlatives. Averages/percentage under only the relevant boxes, not redundant on all.

## Data-to-image policy
Calculate all numbers and rows in deterministic code; create a frozen intermediate JSON model; render text and tables as actual text/vector/raster compositing **not image-model-generated facts**. Image generation can be used for non-data texture only where appropriate; never make it improvise existing character images. Validate final PNG visually **and programmatically** against the frozen model, including line PB dates, rank PB dates, exact names and thresholds. The artist has freedom to scale/reflow panels but no freedom to alter event facts.

## Accompanying Discord message
Draft an `@everyone` update and Stat Center link, in the friendly/competitive/occasionally vulgar AVENGERS leader voice. Highlight the *most interesting true* event-wide accomplishments (total lines/pot/growth/record), actual top podium, best line/rank PBs, first appearances, a handful of supported fun facts, and sincere thanks to contributors. May use approved Discord custom emojis. Write naturally and vary jokes and emphasis week to week; examples from previous Piggies/Space are stylistic inspiration only, never sources for facts. Use verified player-to-Discord-ID mapping; if unresolved, use player's name and flag unverified handles for review instead of inventing IDs. The message and PNG must reference the SAME immutable event payload/commit.

## October 23, 2026 Friday Piggy — supervised release
- Leader says **race ends Friday 2026-10-23 at 02:00 America/Chicago**.
- Reuse existing scheduled screenshot-check mechanism; don't duplicate a schedule or assume screenshot ingestion works unless live access is actually verified.
- Once complete scoreboard/screenshots are available, verify and publish accepted AVENGERS event results via sitewide projection, generate manual PNG + Discord message preview promptly, and **SHOW BOTH TO THE LEADER BEFORE ANY DISCORD POST**.
- The Discord destination channel has **NOT yet been identified or bot-permission-verified**. Never infer one from unrelated previous messages; obtain leader's intended channel and verify access by a non-sending read-only check where supported.
- **No automatic Discord posting to ANY channel/event/clan. All existing kill switches remain OFF.** Creating/verifying a PNG or message does not constitute posting approval. Even after previews are accepted, require an additional explicit authorization to actually send.
- On a failing or missing verification (source incomplete; bot channel permissions; unknown player ID; data mismatch), hold the send, describe exact blocker, and never fabricate facts or claim posting.
- After full launch approval in a future exchange, use verified publish receipts and deduplication; preserve the no-send hold until the separately authorized activation.

## Development order and governance
Finish (1) Piggy wins/2nd/3rd/podium source and UI, (2) Piggy+Flash per-event original finishing ranks and remove Sparks/Lines efficiency display, (3) round Space Sparks/Effort and add sourced clan standings/rank PB, (4) roster layout/column resizability, (5) AV-Zolika.x.TheBoss canonical rename preserving complete history; then implement the structured screenshot→site→PNG/message **review-only** pipeline. Small test-backed PRs; inspect current `docs/PROJECT_CONTINUITY.md`, `docs/DECISION_LOG.md`, `ROADMAP.md`, and issues #8/#13 before work. Do not touch SAC/Lock It In.
