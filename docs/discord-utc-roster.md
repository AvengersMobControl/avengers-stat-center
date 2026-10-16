# Discord UTC → AVENGERS roster

This is a separate, opt-in workflow. **Event-result screenshot channels remain read-only and unchanged.** Once configured, a GitHub Action checks one authorized Discord text channel approximately every 10 minutes and publishes UTC updates for the Stat Center roster.

## Before enabling

1. In the AVENGERS Discord server, copy the desired text channel's numeric ID (Discord Developer Mode → right-click channel → Copy Channel ID).
2. Ensure the existing AVENGERS bot can **View Channel** and **Read Message History** in that channel. Enable **Message Content Intent** for the bot application if required, so it can actually read UTC text.
3. GitHub repository **Settings → Secrets and variables → Actions**:
   - Set **secret** `DISCORD_BOT_TOKEN` to the existing bot token (never commit or share the token in chat).
   - Set **secret** `DISCORD_UTC_STATE_KEY` to an independently generated random string of at least 32 characters. It encrypts private sync state before committing to the public repository. Preserve this key securely: losing it prevents decrypting the existing checkpoint/identity links.
   - Set **variable** `DISCORD_UTC_CHANNEL_ID` to the channel's numeric ID.
   - Set **variable** `DISCORD_UTC_TRUSTED_ROLE_IDS` to the comma-separated numeric IDs of roles authorized to onboard new clan members through this channel. Posts by members lacking those roles enter private review and cannot update the public roster.
   - Optional **secret** `DISCORD_UTC_VERIFIED_LINKS` is a JSON object mapping **verified** Discord user IDs to existing in-game names (for example, `{"123456789012345678":"AV-INTEN"}`). This must be maintained by a council member after confirming the identity; never publish actual IDs in a repository file.
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

For **new players**, the first message must explicitly identify the game name (such as `Name: AV-NewRecruit`) and include a clan, or use a channel with a verified single-clan default. The Discord nickname alone is not enough to create a roster record. After linking, later posts such as `UTC+2, Germany` update the same account without changing its game name. The bot accepts `UTC-5`, `UTC+5.5`, `UTC+5:30`, `UTC+5.75`, or a signed number like `+2` at the start of a message.

**A UTC offset does not determine country.** When country is not provided, a new member's Country field stays blank and can be filled by a later post. Existing country information is retained. Time Zone Group (TZG) is **not** inferred from UTC because the clan has its own TZG grouping.

## Safeguards

- The existing roster stays authoritative for membership status and historical stats.
- Only trusted-role Discord members can submit an update. A new in-game name can be added automatically when an explicit name and clan are provided and no existing identity matches.
- **Existing** in-game identities are not assigned by nickname or posted name alone. Link their Discord accounts via the private verified-links secret after identity review; until then, posts remain in encrypted pending state.
- Updates are internally keyed by stable Discord user ID after the first approved link, not only by nickname. The public repository stores that state **encrypted**, not plaintext.
- Explicitly known player aliases resolve to canonical names; e.g. `AV-Zolika.x.Kira` uses the existing roster record.
- A name collision, unauthorized role, unknown clan, or attempt to claim an existing in-game account goes into encrypted pending-review state, not silently merged.
- An unknown new member without a clear clan goes into encrypted pending-review state rather than being added to the wrong clan.
- The GitHub Action updates only `discord-utc-roster.json` and `discord-utc-roster.js`. The website merges that overlay at load time; sparks, stars, ratings, events, and existing TZG/state are not overwritten.
- GitHub Actions scheduling can be delayed. This is periodic polling, not instantaneous Discord Gateway event handling.

## Maintainer notes

Code: `scripts/sync-discord-utc.cjs`. Tests: `node --test scripts/sync-discord-utc.test.cjs`. The Action workflow is `.github/workflows/discord-utc-roster.yml`. No credentials are stored in repository files. A subsequent change can expose pending entries to admins for review in the website.

## Privacy and release gate

`discord-utc-roster.json` contains AES-256-GCM-encrypted checkpoint, Discord identity links, and pending-review messages. Only the allowlisted `name`, `status`, `utc`, and `country` fields appear in public `discord-utc-roster.js`. The existing blank bootstrap JSON is accepted, but any nonempty plaintext state fails closed and requires a reviewed migration. Secrets must never be stored in the repository.

**Current status:** October 15 roster lookup, dynamic roster preservation, privacy encryption, and backlog paging have automated tests. Production release still requires configuring the trusted-role IDs, bot token, channel ID and encryption key, verifying any existing player links, and confirming a real end-to-end post appears on the site. Unknown/conflicting identity claims remain pending until council review. See GitHub issue #3.
