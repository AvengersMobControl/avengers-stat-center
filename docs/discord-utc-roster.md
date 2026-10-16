# Discord UTC → AVENGERS / AV-2 roster

**Selected channel:** `1422151197317529600`; **Council role:** `1427090799052587038` (both clan-leader supplied). The ID is pinned in the [scheduled workflow](../.github/workflows/discord-utc-roster.yml). This feature is **not live on the public Stat Center** until production prerequisites below are verified.

## Submission rules

There are two ways to log a member's UTC and country:

1. **The member posts for themselves:** Anyone in the channel, without a special Discord role, can submit their **first qualifying** post containing a valid UTC offset and country. The first valid entry is linked to that Discord author's stable ID. Later self-posts do **not** automatically rewrite it; corrections should be reviewed. An existing current-roster member is matched through their Discord server nickname against a recognized game name (or via a privately verified ID→player link); contradictory identity claims go to private review. For a new member, the Discord server nickname can serve as their game name; `Name:` is optional. A new member still needs `Clan: AVENGERS` or `Clan: AV-2`, unless the channel has a leader-approved single-clan default. A valid country is required when no country is already logged.
2. **A Council member posts for someone tagged:** A Discord user possessing a **configured Council role ID** can write a UTC/location message that tags **exactly one member**. The bot uses the **mentioned account's** Discord user ID and server nickname, not the councillor's ID/name or a posted `Name:` override. It only applies to a known **active** AVENGERS / AV-2 member and **only fills fields that are missing** from the stored roster/earlier Discord updates. A complete UTC + country record is untouched. Unknown/ambiguous/inactive targets and posts lacking the configured Council role enter private review. Council messages cannot create arbitrary new members or change a member's established clan.

Examples:

```text
UTC-5, USA
```

```text
Name: AV-NewRecruit
Clan: AV-2
UTC+5:30
Country: India
```

```text
@AV-DrDetroit UTC-6, USA
```

The last example is accepted **only if posted by a Council-role member** and the tagged account's roster entry still lacks the corresponding data. Council can also send `@Player Location: Germany` without a UTC; this fills only the missing country/location and leaves any unknown UTC **blank**, never zero. A member's own first qualifying submission takes precedence over a prior Council proxy entry, but repeat self-posts do not silently rewrite a completed self report.

UTC is not sufficient evidence to infer country; `UTC+2, Germany`, `Country: Germany` and `Location: Germany` are accepted. TZG (the clan's time-zone group) is **never calculated from UTC**. Existing State, TZG, clan membership, and historical rewards remain unchanged.

## Setup before activating

1. Verify the AVENGERS bot has **View Channel**, **Read Message History**, and required message-content access to channel `1422151197317529600`.
2. In GitHub repository **Settings → Secrets and variables → Actions**, configure:
   - **Secret** `DISCORD_BOT_TOKEN`: the existing AVENGERS bot token. Never publish it.
   - **Secret** `DISCORD_UTC_STATE_KEY`: an independently generated string ≥32 characters. Losing or rotating it without migrating state prevents decryption.
   - **Council role ID** `1427090799052587038` was provided by the clan leader and is pinned in the workflow as `DISCORD_UTC_COUNCIL_ROLE_IDS` (no GitHub variable is needed). The bot checks that the poster actually holds this role on every Council-tagged post; ordinary first self-reports require no role.
   - Optional **secret** `DISCORD_UTC_VERIFIED_LINKS`: council-verified JSON object mapping Discord IDs to existing canonical game names. Never publish real IDs in source control.
   - Optional **variable** `DISCORD_UTC_DEFAULT_CLAN`: `AVENGERS` or `AV-2` only if this is an exclusively single-clan channel. For the mixed-clan channel, leave blank and require a new recruit to specify their clan.
3. Scheduled polling is **off by default**. The workflow runs on a schedule **only** when the GitHub Actions variable `DISCORD_UTC_SYNC_ENABLED` is set to `true`. This prevents a new deployment from polling Discord before credentials and live tests are ready. An authorized maintainer can use **Actions → Sync Discord UTC roster → Run workflow** for a manual smoke test while scheduled polling is disabled. Run a manual test only after both required secrets are configured. Once end-to-end member and Council tests succeed on the canonical site, set `DISCORD_UTC_SYNC_ENABLED=true` to enable approximately 10-minute polling.
4. The first configured poll checkpoints old channel messages without importing them. It will process **future** posts. To intentionally ingest historical posts, a maintainer must opt into `backfill` via manual workflow dispatch.

The GitHub Actions schedule polls roughly every 10 minutes (GitHub scheduling can delay). This is **not** a Discord real-time event listener.

## Safety and source handling

- The October 15 screenshot + leader-corrected member roster governs status. No unverified posts may change AVENGERS/AV-2 membership of a known account.
- A missing country remains unknown, not inferred from UTC or filled with a guessed country.
- An encrypted private-state file holds Discord IDs, message checkpoints, Council-submitted identity links, and pending reviews. Only name, status, UTC, and disclosed country are published in `discord-utc-roster.js`.
- Pending conflicts never rewrite public roster data. A Council role is required for proxy submissions even if a Discord user types another player's name.
- A Council proxy only fills **empty** fields, never overwrites a previously logged location or UTC.
- The event screenshot channels and historical statistics remain untouched. Do not commit raw Discord IDs, bot tokens or secrets into the public repository.
- Incomplete October 13 PF1 event leaderboards stay incomplete; obtaining them is not part of this feature.

Code: [`scripts/sync-discord-utc.cjs`](../scripts/sync-discord-utc.cjs). Tests: `node --test scripts/sync-discord-utc.test.cjs`. Work tracker: [issue #3](https://github.com/AvengersMobControl/avengers-stat-center/issues/3).
