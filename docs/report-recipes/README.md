## Required individual spotlight section — October 22, 2026

Each of the four report recipes includes a prominent individual recognition module, separate from Top 10 and PB tables. Compile event leaders, personal above-earlier-average performers (same event kind AND same event-time clan, with eligible denominator), valid PB/records, and tracked five-week-clan-league Sparks highlights. The website's known last completed Kraken endpoint is October 11, 2026; subsequent 35-day windows are cadence-derived and must be qualified. Transfers never cause one clan's prior results to be relabeled as another clan's personal history. Missing rows or reward amounts remain unknown, and no claim of complete league-wide ranks is allowed without full source coverage. See the Space/Piggy vertical layout contract and each event-specific recipe.

# Source-locked automatic PNG and Discord message recipes

Established 2026-10-22 for AVENGERS Mob Control. These four recipes are the input contracts for Piggy Race, the combined PF1–PF4 Piggy Flash Set, Space Race and Kraken. They are instructions, not evidence that an unattended renderer or sender is running. Issue #8 owns implementation and acceptance.

## Non-negotiable architecture

1. The approved Discord screenshot collector and reviewer identifies actual FINAL screenshots, correct event/date/lobby/at-time clan/player, original ranks, precise scores/rewards, aliases and duplicates. It ignores one-line Piggy/Flash placeholders. Missing source evidence is null, never zero. All new result intake is handled by the existing standing-authorized WEBSITE task. A result may enter the site independently of PNG publication.
2. Wait for a validated, complete, immutable website release. Read the canonical public GitHub Pages release-manifest.json, then the versioned dist/exports/projection, ledger and eventSummaries files whose projectionVersion/sourceCommit match that manifest and rendered site's data-release-version. An accepted, verified release is the sole factual source for an event report. Do not scrape a screenshot of the web page or re-OCR the original Discord images to generate graphic facts.
3. Select one exact event-time clan and source event identity. A Flash Set is one explicit setId containing PF1–PF4, not four independent Discord posts. The selected source revision, projection version and event coverage must be frozen before any text or image generation. A correction creates a NEW edition subject to manual reconciliation; never silently overwrite an earlier post.
4. Execute the selected event recipe to build a typed FACT PACK from the website's data and existing historical analyzers. Calculate totals, ranks, averages, prior bests, award coverage and eligibility in deterministic code. Keep each fact's exact origin path or source row ID in a PRIVATE proof table. Preserve actual name spelling, integer precision, dates, units, nulls and coverage caveats. No image model calculates statistics, invents players or completes missing fields.
5. Compile two outputs from that SAME immutable fact pack: (a) a DETAILED VISUAL BRIEF containing the graphic hierarchy, character assets, exact labels and layout constraints, and (b) a Discord message with factual highlights and permitted tone. The visual brief contains a locked list of exact strings for compositor placement; optional poetic copy may be regenerated, but must not assert unverified records.
6. Optional image-generation step: feed the detailed visual brief and the ORIGINAL approved character PNG references to a raster art/layout generator for texture, poses and composition. For now, art generation may only fill backgrounds or non-factual decorative areas. Characters must retain their approved identity; where exact original character art is required, composite its SHA-verified original file rather than a generated likeness. Critically, render all scoreboards, names, numbers, rankings, captions and labels using a deterministic text/compositing step from the locked strings. Never trust image-model lettering as final event data. This is how we can use image generation without publishing inaccurate text.
7. Render a high-resolution PNG with dynamic panel reflow, not a fixed number of PB slots. Confirm every required fact appears or is represented by an explicit +N more and a website link. Include event type, event date/Flash Set, clan, source coverage, units and legend where defined. Compute its SHA-256 and create a matching sidecar with sourceCommit, projectionVersion, eventId/setId, eventTimeClan, templateVersion, imageSHA256, all displayed strings, unknown counts, data coverage and linked message SHA.
8. QA must compare EVERY rendered exact string to the frozen pack (text extraction/OCR is supplemental, not sole proof), validate math independently, visually inspect openable PNG at native size for clipping/collisions, confirm approved asset hashes and text/image agreement, and check report completeness. Fail closed on any unexpected number, player, rank, falsely claimed PB, source date or design overflow. An incompletely covered event may publish to the WEBSITE, but it must not be described as complete or auto-posted to Discord.
9. Prepare one atomic Discord publication plan for exactly one image AND its accompanying text in #Performance Statistics, channel 1470175579058999386, guild 1403361698177618081. Use the private server-side token/Neon restricted durable slot keyed by kind + eventId/setId + event-time clan. Stage intent before sending. After one POST, authenticate-readback the exact message and attachment SHA and save receipt. A missing/uncertain receipt blocks retries until reconciliation; a correction is not automatically deleted/reposted. Unattended sends/deletes remain OFF until separately activated for that specific recipe.

## Fact-pack schema (common required keys)

- scope: kind, eventId or setId, date/date range, eventTimeClan, exact lobby identities, sourceCommit, projectionVersion, accepted source revision, templateVersion.
- source: finalStatus, coverageComplete, sourceReferences, originalByteProofVerified, screenshotWindowComplete, ambiguities, heldRows, unknownScore/Star/Spark counts.
- metricCards: ordered {label, value, unit, qualifier, exactDisplayText, sourcePath} fields.
- leaderboards: each item has canonical player, event-time clan, actual source lobby/rank (if relevant), score, exact unit, verified historical highlights, presentation rank and origin.
- recognition: PBs with previous/current/date/percent and denominator; firstTracked; podium or placement awards; milestones/records with their independent historical proof; comparable prior-event sample.
- art: explicit allowed character filenames, SHA-256 and layout regions; approved template ID; prohibited overlays.
- render: exact ordered text labels; dynamic panel constraints; all coverage footnotes; planned image dimensions.
- message: complete intended Discord text, exact immutable fact-pack checksum and title.
- publication: holdReason or previewReady. No readyToSend=true until source, art, visual, QA, permission, idempotence and explicit event-kind activation checks all pass.

## Release and correction rules

Public site home: https://avengersmobcontrol.github.io/avengers-stat-center/. Authoritative source/dependency description: docs/EVENT_TO_SITE_DEPENDENCIES.md. Pinned art: docs/APPROVED_CHARACTER_ASSETS.md. Older generated previews, Discord posts and chat conversations are NOT data sources. For website chronology and approved revisions consult docs/PROJECT_CONTINUITY.md, docs/DECISION_LOG.md and issue #4.

User-facing Discord copy may be fun, competitive and a little vulgar, but never announce imaginary facts or unverified mentions. Only tag @everyone where the event's separately approved communication policy calls for it. The PNG/message must identify known recorded results accurately, not imply a complete clan leaderboard when only a sample exists. Keep SAC, paused UTC sync, private Kraken strategy, and unrelated AV-2 events outside this system.

## Current release position

The Big Piggy publisher in PR #138 implements part of the downstream path but has not enabled unattended sends. Existing one-shot Discord transport/readback and exact October 20–21 Flash publication are proven. The four recipes below now govern future report design and data fetch contracts; each still requires a renderer adapter, accepted art, verified canary and explicit activation before autonomous dispatch.

- PIGGY_RACE.md
- PIGGY_FLASH_SET.md
- SPACE_RACE.md
- KRAKEN.md
