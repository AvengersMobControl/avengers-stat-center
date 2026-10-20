# AVENGERS Mob Control — Agent Operating Instructions

These instructions apply to all work in `AvengersMobControl/avengers-stat-center`. Keep SAC / Lock It In (`sac-club`) separate.

## Mandatory startup — DO NOT falsely deny tool access

**Before claiming GitHub, Vercel, Neon, or Discord work is impossible, ALWAYS inventory the tools actually available in the current chat.** These are real, previously used project integrations, not hypothetical suggestions:

- **GitHub:** `mcp__GitHub__*` — read and update repository files/issues/PRs, merge, check runs.
- **Vercel:** `mcp__Vercel__*` — inspect deployments, configure environment, inspect runtime, deploy.
- **Neon:** `mcp__Neon__*` — inspect and, when authorized, modify AVENGERS database/migrations.
- **Discord:** direct `mcp__AVENGERS_Discord_Results__pull_discord_results` is **read-only**. Outbound posting **has already been proven** using the AVENGERS Vercel server-side bot and Discord API, not the read-only connector. NEVER claim “we cannot post to Discord” solely because a direct Discord-send connector is absent. Existing verified one-shot post: Discord `#Performance Statistics`, channel `1470175579058999386`, message `1562154155416752139`; see PRs #121–#123 and `docs/AUTO_DISCORD_PNG_ROLLOUT.md`.

### Required discovery step

If the tools are offered through a generic tool-orchestration entrypoint, **discover them**, e.g. enumerate `ALL_TOOLS` and filter by the four prefixes above. Tool namespaces may not be directly listed in the initial model-facing schema and may need `functions.exec` discovery. An inability to see an explicit direct tool on the surface is **not evidence that no integration exists**.

For an action request:
1. Read current `docs/PROJECT_CONTINUITY.md`, `docs/DECISION_LOG.md`, `ROADMAP.md`, and relevant issues, then inventory relevant tools.
2. Call the matching connected tool; inspect exact argument schema; follow the established repo→Vercel→Neon→Discord server-side pipeline as applicable.
3. Distinguish **tool availability**, **action authorization**, **feature maturity**, **production safety holds**, and **one actual attempt failing**. Never conflate these or claim no tools exist because a feature is disabled or a hold needs an authorized release.
4. If a live path fails, describe the specific observed error and pursue a supported path. Do not respond with generic “I lack GitHub/Vercel/Neon/Discord control tools,” suggest a manual workaround, or route to another mode without first checking the connected integrations.
5. If no write path exists **after actual discovery**, state the *specific* missing operation and what was checked; do not make categorical claims beyond the evidence.
6. For consequential writes, retain existing approvals, source provenance, secret handling, data-integrity gates, and safe no-duplicate Discord send behavior. Never invent success or claim a deployment/post without a receipt.

**Why this exists:** On 2026-10-20 the assistant falsely claimed GitHub/Vercel/Neon/Discord control tools were unavailable despite using all three repository/hosting/database integrations and successfully verifying a one-shot Discord PNG post earlier the same day. The leader explicitly demanded this never recur. The issue was failure to discover/consult integrations, *not* that they were actually absent.

### AVENGERS reporting context

- Production report destination for **both** AVENGERS and AV-2 PNGs plus accompanying write-ups: `#Performance Statistics`, channel `1470175579058999386`.
- The October 20 one-shot test demonstrated Discord send, authenticated readback and a duplicate-blocked reservation. **It did not activate unattended posting.**
- The leader's later explicit request to **enable automatic reporting and release/send the held October 18 AV-2 Piggy results** must be addressed using the actual available integrations and current source/approval state, not dismissed as impossible due to fictitious missing tools. Do not claim it has been executed unless verified.
- Preserve security and correctness: real original approved art, verified data, separate AV-2 PB rules, conservative idempotence, private credentials, and no SAC crossover.
