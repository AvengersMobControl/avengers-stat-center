# Weekly Big Pig — reusable two-stage report-generation instruction

**Status:** design/review prompt; Discord unattended publishing remains disabled. This is the canonical weekly invocation contract pending future approved changes. Big Pig runs once per week; DO NOT produce a weekday-only classification or rank.

## Stage 1 — build the source-locked report package (do NOT generate the PNG yet)

For **each clan independently**, AVENGERS and AV-2, select the most recent completed and verified weekly Big Pig event from the Stat Center's canonical website projection and approved event-summary exports. Do not make up source values. If an event is final but incomplete, source identity conflicts, or any required proof is unavailable, prepare a review packet and HOLD publication. Never substitute current roster for event-time clan membership, invent zero rewards for unknown payouts, or count one-line screenshot placeholders as participants. Use only comparable, previously accepted same-clan Piggy records for historical comparisons.

Produce an immutable **fact manifest**, a very detailed **stage-2 PNG composition prompt** derived ONLY from that manifest, a **Discord message draft**, and **review flags**. Attach the exact website event ID, data revision, historical evidence/references and known coverage. Validate arithmetic before building the prompt.

### Required fact manifest

1. Identity: clan, weekly Big Pig event date and ID, release revision, source-coverage state, comparable previous accepted Big Pig date, current five-week league boundary.
2. Clan results: unique actual participants, total lines, average lines per participant, percentage change in **total lines only** against comparable prior weekly event, full-lobby POT STARS (displayed or exact with precision tag), distinct **clan-earned** Stars, known Sparks, and reward-data completeness. AV-2 only: total screenshot-displayed share (rake) across all relevant verified AV-2 members of the *same lobby*, without substituting earned/pot division.
3. Pot history: all-time **whole-lobby Big Pig pot** ranking among comparable tracked weekly Big Pig events for this same clan, formatted #rank / #events with source provenance and tie handling; **largest single individual verified pot** of this event, exact member and amount, with confirmed record status if provable. Do not create a general individual-pot-earner leaderboard.
4. **Top Line Contributor:** member with the highest verified lines *this event*, exact lines, include all ties. This replaces the undefined phrase 'event standout'. Include the Top 10 by verified lines (actual screenshot finish ranks are a different concept).
5. Performance and league recognition: highest evidenced improvement versus the member's *own prior same-clan weekly Piggy average*; count/denominator of eligible returning members over prior average; five-week league-to-date tracked cumulative Piggy lines leader and known Sparks leader, clearly labeled tracked. Never conflate above-average results and personal bests.
6. ALL returning-player line PBs with previous PB, previous date, current score and increase; separately ALL verified qualifying original screenshot finishing-place PBs and dates (AVENGERS requires at least 30 same-lobby AVENGERS members; AV-2 at least five same-lobby AV-2 members).
7. **First-time tracked Piggy performances** (name, lines, source rank) as one distinct category; **notable new-member performances** as a SECOND distinct category with a separately verified roster join or membership source and the exact accomplishment. A newcomer can have tracked historical results; first tracked does not prove a recent join. Include both categories when supported. Do not turn a first-tracked appearance into a PB.
8. Dynamic benchmark recognition: permitted tiers **5K+, 10K+, 20K+, 30K+, 40K+, 50K+, 60K+, 70K+, 80K+, 90K+, 100K+**. At each threshold count unique verified active participants with **lines >= that threshold**. Render **only thresholds with at least one qualifier in THIS event**. Do not render zero-count or future placeholders. Players crossing a higher threshold also qualify for lower thresholds. The record-gold label is reserved for verified new/tied clan records and must read: **GOLD = CLAN RECORD OR TIED RECORD**. Do not infer gold from a normal threshold hit.
9. Explicit uncertainty: absent evidence, missing reward values, coverage, incomparable historical denominators or missing artwork must be REVIEW FLAGS, never invented results.

### Stage 2 — construct the exact PNG-generation prompt

From the frozen fact manifest, compile a **1440px-wide dynamically tall portrait** PNG brief in the approved neon navy/cyan/magenta/purple/green visual family, consistent with the tall Piggy Flash layout. Explain the exact section order and allocate vertical height for every validated name/record, never truncate. Use the **original SHA-verified approved character artwork only** and position characters outside tables and text. If the approved characters are unavailable, HOLD; do not invent copies.

Required sections, in order:
- Title, clan, Big Pig event date, source state.
- 2x2 compact headline cards: total lines, average lines/participant, clan-earned Stars plus separate lobby pot reference, participant count and known Sparks.
- Pot performance: whole-lobby pot, same-clan all-time pot rank with denominator, verified largest individual pot and member; AV-2 only prominent source-share rake.
- Total lines comparison with prior comparable Big Pig.
- Individual performance spotlights: **Top Line Contributor**, proven strongest above-own-average gain, tracked league-to-date Piggy lines and known Sparks leaders, count/eligible denominator above own past average.
- Top 10 by lines (not screenshot finishing ranks).
- Full line PB transitions and separately qualifying finishing-place PBs, all dated.
- First-time tracked performances and notable new-member performances in **distinct** panels.
- Nonempty benchmark tiers only, through 100K maximum, gold only for verified clan record/tie.
- Source/coverage footnotes and precise fact-manifest revision.

The image model may generate **decorative framing only**. A deterministic compositor must place all actual names, numbers, dates, ranks, footnotes, and milestone labels directly from the frozen manifest. Compare rendered output to the manifest in QA; reject omissions, hallucinated decorations that imply fake records, overlaps and clipped entries.

### Discord message

Using the SAME manifest, draft a concise, energetic, respectful clan message with total lines, pot performance/rank, verified largest pot, Top Line Contributor, significant PBs, achievements, first-time-tracked AND notable new-member highlights when available. Do not invent historic comparisons, awards, or member mentions. Link to the Stat Center and keep AVENGERS/AV-2 messages separate.

### Gate and output

Return exactly:
1. **STRUCTURED VERIFIED EVENT DATA** (with source provenance)
2. **DETAILED STAGE-2 PNG GENERATION PROMPT**
3. **ACCOMPANYING DISCORD MESSAGE**
4. **REVIEW FLAGS / HOLD OR READY FOR HUMAN REVIEW**

Generate the PNG and verify it only after Stage 1 has passed data validation. Do **not** send a Discord message or enable unattended sending without separately approved image/template and dispatch activation. Do not republish a previously dispatched event.
