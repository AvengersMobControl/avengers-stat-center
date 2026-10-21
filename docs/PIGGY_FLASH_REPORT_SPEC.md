## October 21, 2026 — Commissioner clarification and website data model (supersedes earlier rake backfill assumption)

- **Rake % is explicitly APPROVED as an estimate:** \`sum of recorded AVENGERS players' earned Stars / main game-lobby pot Stars × 100\`. The pot denominator is the Star pot shown in the header screenshots. Include outside-lobby AVENGERS rewards when summing numerator; commissioner accepts the small discrepancy. Clearly label the percentage *estimated rake*, not exact screenshot-share sum. Do **not** delay the new website tables waiting for exact individual share-% screenshot backfill. Pot value source and lobby scope remain explicit; do not cap >100% estimates or mistake displayed rounded pot values for exact values.
- For the **combined four-Flash PNG, exclude AV-2 entirely.** Leave existing AV-2 website history untouched; the new AVENGERS-only website tables are canonical sources for this PNG.
- Preserve **four substantial PF1–PF4 cards at the top** (Layout A), with each source header pot, estimated rake, pot rank *within that PF type* and *among all recorded PF pots*, plus relevant Flash metrics.
- **Career honors**, not redundant sweep counts: show the selected day's actual podium finishers (source game rank 1–3), each accompanied by their *tracked career wins/podiums through that event*, excluding future results.
- **Top Five Combined Day Contributors**: highlight #1 and show its all-time rank among *recorded per-player Flash Set totals*, dynamic \`rank/total\` (e.g., 7/870). **Top Ten Single-Race Lines of Day**: separate table, allow the same player up to four distinct race entries, highlight the first and display its \`rank/total\` among all recorded individual PF line scores (e.g. 6/1,357). Those are **two independently sortable/searchable historical website tables**, not a repeated clan win KPI.
- **Line PBs are three independent tracked metrics:** best lines in PF1/2/3/4 type, best lines in any individual PF, and best *complete* four-Flash day. A first tracked appearance is never automatically counted as a new PB. Four-Flash daily PBs / averages require a prior complete 4/4 observed player-day; partial screenshot coverage must not be compared to full 4/4 days. Above-prior-average single-Flash figures must use earlier-set baselines and disclose the eligible denominator.
- Prefer **Layout B's milestone presentation**, informed by actual summed player totals. Never print commissioner instructions on PNGs; include only natural metric explanations. No new PNG until the website additions are verified.
- **Backfill:** archive all recorded main-lobby pot headers; 58/60 source events already have header pot values, with 2026-08-19 PF1 and 2026-05-21 PF2 missing. The PF2 source script contains three additional earlier-history backfill arrays that must all be loaded and counted (PF2 has 31 recorded pot headers, not 8). Secondary lobby pots may be added with explicit source provenance later. Historical ranks change as backfill expands; label them "recorded" all-time ranks.

**Implementation in PR #130:** \`piggy-flash-history.js\` contains pure source-derived analyses and \`piggy-flash-history-view.js\` provides four cards, recognition and the three historical ranking tables in the existing Flash tab. This is a website change only (no PNG / Discord sending).

# Piggy Flash — combined four-Flash reporting requirements

**Leader-approved direction, 2026-10-20. Applies to AVENGERS Mob Control only; website/statistics implementation comes before any new PNG.**

## Canonical website source first

- Maintain **wins** and **podium finishes** independently for PF1, PF2, PF3 and PF4, plus **combined totals**. Count **first place** as one win and one podium; **first–third** each as a podium, from the original recorded game finishing place.
- Keep AVENGERS and AV-2 event-time clans distinct. Do not re-rank by player lines or infer finishing places when the original leaderboard has missing rank information. Keep explicit separate lobbies distinct and exclude conflicting/ambiguous ranks. A small clan lobby is allowed for Flash podiums when the actual rank was recorded; the Piggy Race 30/5-member **rank-PB** minimums must **not** be transferred to Flash honors.
- Respect website filters by PF, Flash Set day and clan. A four-Flash Set can cross midnight (e.g. PF4 on 2026-09-23 belongs to Flash Set day 2026-09-22).
- Expose an understandable **PF1 W/P | PF2 W/P | PF3 W/P | PF4 W/P | Total wins | Total podiums** table and per-flash count cards. A PNG may later reuse those numbers rather than inventing a separate tally.
- For the first real demonstration choose the **September 22, 2026 Flash Set** and source data already on the site. Distinguish partial screenshot coverage from an actually complete rank list; do not invent missing winners or records.

## Artwork and copy for a future combined single PNG

- ONE PNG covers all four Piggy Flashes, not four separate PNGs. **The cleaner, detailed second concept** was preferred over the first design; preserve the useful hierarchy and readable density.
- **Artwork can be exploratory while agreeing information and layout.** Recreating the *approved character designs* in alternate poses, configurations and actions is **encouraged**, as long as recognizability/identity is preserved. The prior restriction to Spider, Terrorist, Kaboom and Raccoon was misunderstood: those four are primarily for Space Race PNGs. Piggy Flash graphics should draw from the broader approved cast and can include many or all characters if visually balanced.
- **Information accuracy, required metrics and the leader's instructions have absolute priority;** art/creative freedom comes **second**, especially during template development. Do not generate another image until the website winnings/podium source is implemented and the user is ready for the next PNG iteration.
- User's instructions/rules are **NOT copy for the poster**. Put ONLY natural labels/explanations that help readers understand what metrics mean. No phrases like 'These flashes usually award sparks except post-Kraken' unless that fact is relevant to interpreting a displayed zero/missing Sparks metric, and even then explain as a user-facing metric annotation rather than reciting a commissioner directive.
- **Piggy Flashes normally award Sparks; only those immediately following Kraken do not.** The first post-Kraken set of each five-week clan league is special; other Flashes show actual source-backed Sparks. Never silently wipe Sparks from normal Flash results or claim all Flashes award none. Apply the exception when interpreting recorded data.
- Potential report sections under development: 4 flash-by-flash summaries; combined lines, Stars, Sparks, effort above average and contributors; each flash's winner; **4-flash wins and podium finishes plus totals**; source-backed PBs, first appearances and milestones. The content/layout should be agreed before decorative completion.
- Manual PNG preview review remains separate from Discord release/automation approval. No PNG or Discord post is authorized by this website-only requirement.

## Development checkpoint

Implementation proposal: `piggy-flash-podiums.js` source-derived honors and `piggy-flashes.js` website panel in PR #129; no image work in this PR. Verify CI and published site before marking as shipped.
