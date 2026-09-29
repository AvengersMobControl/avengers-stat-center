# AVENGERS Discord Results MCP Connector

This overlay adds a **read-only, manually invoked** MCP connector to the AVENGERS Stat Center.

## What it does

The connector exposes one tool:

`pull_discord_results`

It can read screenshot attachments from these configured Discord channels already present in `discord-ingest-config.json`:

- `space`
- `piggy`
- `kraken`
- `av2`
- `piggyFlash1`
- `piggyFlash2`
- `piggyFlash3`
- `piggyFlash4`

It **does not write to the Stat Center**. It only retrieves screenshots for review.

The MCP server instructions explicitly require the model to:

- run only after the user asks or approves a pull;
- visually reject screenshots marked preliminary, ongoing, in progress, current standings, not final, or similar;
- keep only AVENGERS / AV-2 competitor rows;
- never import or commit results until the user explicitly approves the parsed results.

## Security

The connector uses OAuth 2.1 + PKCE.

ChatGPT first authenticates the person through Discord. The OAuth callback checks that the connected Discord account belongs to the configured AVENGERS guild before it issues an MCP access token.

Existing Vercel variables are reused:

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_GUILD_ID`
- `DISCORD_BOT_TOKEN`
- `AUTH_SECRET`

No new secret is required.

## Install in the existing GitHub repo

Copy these files into the root of `AvengersMobControl/avengers-stat-center`:

- `api/mcp.js`
- `vercel.json`
- replace the existing `middleware.js` with the included `middleware.js`

The existing `discord-ingest-config.json` remains the source of the eight channel IDs.

Commit and push to `main`. Vercel should deploy automatically.

## Add the second Discord OAuth redirect

In Discord Developer Portal:

AVENGERS Stat Center → OAuth2 → Redirects → Add Redirect

Add exactly:

`https://avengers-stat-center.vercel.app/oauth/discord/callback`

Keep the existing Stat Center login callback as well:

`https://avengers-stat-center.vercel.app/api/auth/discord/callback`

Save.

## Test the deployment

Open:

`https://avengers-stat-center.vercel.app/mcp`

A successful deployment returns JSON identifying the AVENGERS Discord Results MCP server.

These should also return JSON:

- `https://avengers-stat-center.vercel.app/.well-known/oauth-protected-resource`
- `https://avengers-stat-center.vercel.app/.well-known/oauth-authorization-server`

## Connect it to ChatGPT

Current OpenAI setup uses a remote Streamable HTTP MCP endpoint. In ChatGPT, enable Developer mode if your account/workspace exposes it, then add a custom plugin/app connection using:

`https://avengers-stat-center.vercel.app/mcp`

Suggested name:

**AVENGERS Discord Results**

Suggested description:

**Read-only manual retrieval of AVENGERS / AV-2 event screenshots from approved Discord result channels. Never imports automatically.**

On first tool use, ChatGPT should open the Discord OAuth flow. Sign in with a Discord account that belongs to the AVENGERS server.

## First test

Ask:

> Pull the latest Space Race screenshots for review only. Do not import anything.

Expected behavior:

1. `pull_discord_results` is called with `channel_key = space`.
2. Recent image posts are returned.
3. The model visually rejects preliminary/progress screenshots.
4. Only AVENGERS / AV-2 competitors are transcribed.
5. Nothing is written until explicit approval.

## Notes

- The connector is intentionally read-only.
- It returns a limited number of screenshots per call to stay within serverless response-size limits.
- Use `before_message_id` to page backward and `after_message_id` to pull only newer posts.
- If a screenshot is too large to embed, the tool returns its Discord attachment URL as a fallback.
