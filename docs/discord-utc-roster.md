# Discord UTC → AVENGERS roster

This is a separate, opt-in workflow. **Event-result screenshot channels remain read-only and unchanged.** Once configured, a GitHub Action checks one authorized Discord text channel approximately every 10 minutes and publishes UTC updates for the Stat Center roster.

## Before enabling

1. In the AVENGERS Discord server, copy the desired text channel's numeric ID (Discord Developer Mode → right-click channel → Copy Channel ID).
2. Ensure the existing AVENGERS bot can **View Channel** and **Read Message History** in that channel. Enable **Message Content Intent** for the bot application if required, so it can actually read UTC text.
3. GitHub repository **Settings → Secrets and variables → Actions**:
   - Set **secret** `DISCORD_BOT_TOKEN` to the existing bot token (never commit or share the token in chat).
   - Set **variable** `DISCORD_UTC_CHANNEL_ID` to the channel's numeric ID.
   - Optionally set **variable** `DISCORD_UTC_DEFAULT_CLAN` to `AVENGERS` or `AV-2` **only if** the channel is dedicated to that clan. For a mixed-clan channel, leave this blank and have new members state their clan.
4. After merging this feature, GitHub Actions → **Sync Discord UTC roster** → Run workflow. The **first** run normally creates a checkpoint, not an import of old posts. To scan recent history instead, select **backfill** when running manually.

## Member posts

Recommended new-member example:

```
Name: AV-NewRecruit
Clan: AV-2
UTC+5:30
Country: India
```

If a single clan is configured as the default, a short `UTC+2, Germany` post is also accepted, using the Discord server nickname as the in-game name. The bot accepts `UTC-5`, `UTC+5.5`, `UTC+5:30`, `UTC+5.75`, or a signed number like `+2` at the start of a message.

**A UTC offset does not determine country.** When country is not provided, a new member's Country field stays blank and can be filled by a later post. Existing country information is retained. Time Zone Group (TZG) is **not** inferred from UTC because the clan has its own TZG grouping.

## Safeguards

- The existing roster stays authoritative for membership status and historical stats.
- Updates are keyed by stable Discord user ID after the first link, not only by nickname.
- Explicitly known player aliases resolve to canonical names; e.g. `AV-Zolika.x.Kira` uses the existing roster record.
- A name collision across two Discord accounts is queued in `discord-utc-roster.json` under `pending`, not silently merged.
- An unknown new member without a clear clan goes into `pending` rather than being added to the wrong clan.
- The GitHub Action updates only `discord-utc-roster.json` and `discord-utc-roster.js`. The website merges that overlay at load time; sparks, stars, ratings, events, and existing TZG/state are not overwritten.
- GitHub Actions scheduling can be delayed. This is periodic polling, not instantaneous Discord Gateway event handling.

## Maintainer notes

Code: `scripts/sync-discord-utc.cjs`. Tests: `node --test scripts/sync-discord-utc.test.cjs`. The Action workflow is `.github/workflows/discord-utc-roster.yml`. No credentials are stored in repository files. A subsequent change can expose pending entries to admins for review in the website.
