# Kraken Discord posting — leader-directed one-time sends (added 2026-11-17)

Kraken is explicitly **not** part of the 2026-10-26 standing automatic-posting activation (`AGENTS.md`). There is no schedule and no default trigger: every Kraken month, for every clan, needs its own fresh, explicit leader instruction ("send it" / "post it" / "push it", naming that month and that clan) before anything goes to Discord. This doc exists so that instruction doesn't have to rediscover the pipeline — or re-fix the two guards below — from scratch each time.

First used for `kraken|nov` AVENGERS, sent 2026-11-17 (Discord message `1572367081213665455`, channel `1470175579058999386`).

## Poster format (locked 2026-11-17)

Renderer: `scripts/render-kraken-poster.py` — same visual system as `render-bigpig-poster.py` / `render-space-poster.py`.

```
python3 scripts/render-kraken-poster.py reports/approved-summary-release.json out.png --clan AVENGERS \
    [--event-id 'kraken|nov'] [--exclude 'AV-Name' ...]
```

- `--exclude` drops named players from **one render only** (e.g. a player removed from the roster between the Kraken and the render) — it mutates the in-memory rows, never a data file.
- Top KPI row: 5 **unequal-width** tiles (content-weighted) — PLAYERS, TOTAL DAMAGE, AVG DAMAGE, EARNED SPARKS, ABOVE OWN AVG. No separate Sparks-rate tile.
- Left column: Personal Bests (damage) alone, stretched to match the right column's height.
- Right column, stacked top → bottom: Placement PBs, Damage Milestones, New Faces.
- **Placement PBs** compare each player's current rank against their best-ever rank across **all logged Kraken months**, derived straight from each month's score data (`clan_ranks()`), not from `metadata.rank` — which is null for every month before October, even though the scores (and therefore the real placements) are fully on file.
- Personal Bests (damage) table: whole-number damage, no decimal, no "M" per row — the unit lives in the column headers (`PREVIOUS (M)` / `NEW PB (M)`) instead.
- Whichever column is shorter stretches to match the taller one (poster-wide convention).

## Write-up conventions

Same shape as every other event write-up (see the private write-up-notes doc for pronouns and the shared style rules): starts with `@everyone`, title bookended with 🦑, then `📊 Headline`, `🏆 Podium` (medal emoji), `🌟 Standout Stories`, `💥 Personal Bests`, `🚩 Milestones`, ends with the site link. Every number must trace back to `build_model()`'s output — verify with a standalone script before drafting (same discipline as any other event), not by eyeballing the poster.

## Pipeline (one-time, repeat per month, per clan)

1. **Confirm the specific authorization.** Kraken has no standing authorization, so a general "set it up" for other events does not cover it. A clan's "send it" does not cover a different clan or a different month — see "Still true every month" below.
2. Render, verify every figure against `build_model()`'s output, draft the write-up.
3. Stage:
   ```
   python3 scripts/stage-discord-post.py --kind kraken --event-id 'kraken|<month>' --clan <AVENGERS|AV-2> \
       --png <path> --body-file <path> --template <templateVersion>
   ```
   This stamps the manifest entry with `AUTH_KRAKEN_ONETIME`.
4. `git add -f assets/reports/<file>` (the bare `reports/` line in `.gitignore` also matches `assets/reports/`), commit together with `data/discord-posts.json`, open a PR, wait for CI.
5. **New month only** — bump `AUTH_KRAKEN_ONETIME` in **both** `api/discord/publish-event.js` and `scripts/stage-discord-post.py` (must match exactly) to a new `leader-directed-onetime-kraken-<date>` value, so a stale token can never silently cover a month the leader hasn't actually authorized. Skip this when staging a second clan for the *same already-authorized* month/send — they share one tag.
6. Merge, then **explicitly trigger a new production deployment of the merged commit** (`mcp__Vercel__create_deployment` with that `deploymentId`). Don't rely on the automatic GitHub-push deployment alone if you're about to arm the token in the same breath — see the gotcha below.
7. **Arm the token**: generate 32 random bytes, set on Vercel production —
   - `AVENGERS_AUTO_PUBLISH_ONCE_SHA256` = sha256(raw token)
   - `AVENGERS_AUTO_PUBLISH_POST` = `kraken|kraken|<month>|<CLAN>`
   - `AVENGERS_AUTO_PUBLISH_EXPIRES_UTC` = now + ~20 min
   Then **redeploy again** — env var edits alone do not reach an already-running deployment (see gotcha below).
8. From a network-locked Vercel sandbox (`avengers-stat-center.vercel.app` only): `action=preflight`, confirm `ok:true`, `duplicateReserved:false`, and that `imageSha256`/`imageBytes` match the staged manifest exactly. Only then `action=send`, once.
9. Confirm the Neon receipt (`avengers_dispatch_private.publication_slots` joined to `message_receipts`). Burn the token (`ONCE_SHA256` → a non-hex placeholder, `POST` → empty, `EXPIRES_UTC` → a past date), **redeploy once more** to actually invalidate the live Lambda, then stop the sandbox.
10. Report the outcome immediately — message ID, channel, verification — success or exact failure, per the standing Discord authorization policy in `AGENTS.md`.

## Gotchas hit doing this the first time (don't rediscover them)

- **Vercel bakes env vars into a deployment at build time.** `edit_project_env` alone does not change what an already-running production Lambda sees. Every time the armed-token values change, redeploy before calling `preflight`; every time they're burned, redeploy again before trusting the burn.
- **The Vercel MCP sandbox used for preflight/send has roughly a 5-minute default timeout.** If it's been sitting between steps, create a fresh one rather than reusing a stopped session.
- `.gitignore`'s bare `reports/` line also matches `assets/reports/` — use `git add -f`.

## Fixes already made (do not need repeating)

- `api/discord/publish-event.js`'s `KINDS` set and `authFor()` already support `kraken` (PR #225, 2026-11-17) — it no longer throws "Unsupported kind", and `authFor('kraken')` never returns the standing single-event or weekly tags.
- `middleware.js`'s static-asset allowlist already matches Kraken report filenames for **both** clans — `/^\/assets\/reports\/(AVENGERS|AV2)_(Space_Race|Big_Pig|Piggy_Flashes|Kraken)_[A-Z][a-z]+_\d{1,2}_\d{4}\.png$/` (PR #227, 2026-11-17). Before this, the publisher's own self-fetch of the approved PNG got redirected to the Discord login page and failed the SHA check as `"Approved PNG mismatch"`.
- Both fixes are scoped to the exact report-poster filename shape; Kraken strategy content (routes/maps/tickets/presets, `docs/security/kraken-strategy-access.md`) stays behind auth, untouched by either.

## Still true every month

- Kraken is **not** on the standing automatic-posting schedule (`docs/AUTOMATIC_DISCORD_POSTING.md`). No month's send is implied by a previous month's, and this doc existing doesn't change that — it only means the plumbing no longer needs to be rebuilt.
- **AV-2 posting is a separate standing hold** (`AGENTS.md`). An AVENGERS Kraken "send it" does not itself authorize AV-2 — it needs its own explicit leader instruction naming AV-2, for that specific month.
- Never skip the figure-verification step just because the renderer and pipeline are now known-good — the leader is approving *this month's numbers*, not the code.
