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
