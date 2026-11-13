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
