# Private Discord member roster + canonical matching

**2026-11-12 — Leader enabled Server Members Intent for the AVENGERS application.**
Server Members Intent permits the full member-list REST endpoint when the installed bot is authorized; enabling does not by itself create an export or link identities.

## Endpoint
\`/api/discord/identity-review\` — protected on Vercel (never published by static GitHub Pages).
Access requires all of:
- Signed, unexpired, non-guest Discord OAuth cookie.
- Current membership in the configured AVENGERS guild, verified through the bot.
- Guild ownership, Discord Administrator/Manage Guild server permission, or explicit \`AVENGERS_DISCORD_REVIEWER_IDS\` allowlist.
- Configured production bot token and guild ID.
The response has private/no-store headers, denies cross-origin framing, and exports no data to logs.

The endpoint paginates \`GET /guilds/{guild_id}/members?limit=1000\` until complete, skipping bots. Both the private table and CSV include permanent Discord user IDs and display handles. Suggested canonical identities derive from the same Stat Center projection and established aliases as the live site. They are **suggestions only**, and matching is never automatically approved or written to the public repo.

\`/api/discord/identity-review?format=csv\` downloads a private review file with blank **Confirmed canonical (leader review)** column. Leader reviews and confirms identity before recording links to the eventual private identity registry; no Discord ID/name association is merged merely because a name resembles another member.

This requires a deployed production Vercel function and a successfully authenticated leader/admin browser session. Read-only: does not create Discord messages, update member roles, edit roster, change Kraken scores, or feed any master workbook.

The roster snapshot remains private and must never be checked into GitHub, static JSON exports, build assets, Discord messages, or public links.

## Educated guesses (2026-11-12 update)

The original exact-only matcher was too strict. The leader requested a more useful review list. The upgraded private review ranks up to three plausible canonical matches per Discord account, using the server nickname, Discord display name, username, safe nickname decoration removal, distinctive prefix/substring overlap, spelling similarity and already-public name aliases. Both active and historical player identities are considered. Published aliases come from the site's existing canonical `AVENGERS_DATA.aliasMap`, exported as an additional public alias-only release JSON artifact; **Discord IDs remain private**.

Each recommendation includes a heuristic matching-strength score, source/reason and a category (exact/suggested, likely, possible, ambiguous, or unmatched). This is NOT a calibrated probability. A matching nickname is not proof of identity. Distinct player accounts are never automatically collapsed, and two Discord members suggesting the same account are flagged as shared candidates. **All private identity links still require leader approval**, with the final confirmation column left blank on CSV export.


## Leader-confirmed private bindings (2026-11-12)

Seven additional leader-confirmed Discord members / eight game-account relations are seeded directly into the private AVENGERS Neon schema, **never committed to this public repository**. One Discord member can own multiple separate game accounts (Frenchie(-4) and Frenchie2). The original CSV had IDs displayed in rounded scientific notation, so no ID was inferred or stored from those cells.

On a verified guild-owner/admin visit, the private review endpoint loads the previously approved mappings from Neon. It independently retrieves the Discord member roster, verifies each account has one exact username match **and** the recorded original Discord-server join timestamp, and persists the precise Discord user ID only in the two writable verification columns. A mismatch leaves the mapping unverified. The Vercel runtime has SELECT and narrow UPDATE privileges, but cannot insert or delete leader approvals.

The private review page and CSV display `confirmed` and the canonical name(s) for successfully verified accounts, including multiple game names for the same Discord user. Other candidate matches remain suggestions pending their separate permanent-ID reconciliation. The Kraken master workbook is not updated by any of these operations.

