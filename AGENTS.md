## 2026-10-22 — Automatic WEBSITE result publication authorized; PNG/messages decoupled

Leader explicitly instructed: "Automatically post them to the website. We will have the pngs/messages be a decoupled automation." This grants standing authorization for verified new final AVENGERS and AV-2 results to enter the canonical website ledger and complete the shared site release without another per-result commissioner approval. It supersedes earlier review-only/manual-parsed-approval wording **for this website workflow**. It does not authorize guessed results, changes to frozen Unlogged Sparks, paused UTC work or SAC changes.

The existing daily ChatGPT results task is the runner being upgraded; no duplicate task or native GitHub/Vercel screenshot collector is claimed. Read-only Discord retrieval remains read-only; the scheduled agent separately performs source review, original-byte proof, exact event/identity resolution, deduplication, guarded canonical staging, CI/browser checks, merge and complete versioned publication. Ambiguous event dates/PF numbers/identities, conflicting accepted rows, unavailable proof and remaining explicit holds stay pending. Partial final coverage may publish known rows, never invented zeroes. Exactly-one-line Piggy/Flash rows are nonparticipants. PNG generation, messages and Discord dispatch are explicitly decoupled and are not triggered by website import.

Operating instructions: [docs/AUTOMATIC_WEBSITE_RESULTS.md](docs/AUTOMATIC_WEBSITE_RESULTS.md). Configuration: `discord-ingest-config.json.websitePublication`; scheduled parsed-result approval is no longer required. Top-level manual_pull/autoImport=false/reviewRequired=true describes the READ-ONLY connector and existing manual review UI, not a veto of the standing-authorized scheduled website publisher. The import command's approved flag records this standing authorization only on an actual verified write, never on a dry-run; do not falsely label automated review as a new human approval.

# AVENGERS Mob Control — Agent Operating Instructions

These instructions apply to all work in `AvengersMobControl/avengers-stat-center`. Keep SAC / Lock It In (`sac-club`) separate.

## Current Discord authorization policy — 2026-10-22 (supersedes conflicting older manual-send wording)

**Leader-directed one-time publication:** If the leader explicitly says **"send," "post," or "push"** a specified item/report to Discord (including a clear follow-up such as "send it" or "go"), that instruction **IS the publication authorization** for that one-time item. **Act immediately through the connected AVENGERS GitHub/Vercel/Neon/server-side Discord tools, without requesting a second approval, asking for a repeated "approved," moving to another mode, or interpreting an old "do not send" instruction as a blanket prohibition.** A prior approved final image/content remains approved when the leader subsequently orders it sent.

**Separate controls, not conflicting bans:**
- **Unsolicited posts and unattended/automatic event-summary dispatch stay disabled** until specifically activated. An explicitly ordered manual/one-shot publication is neither unsolicited nor unattended; the disabled automatic switches **do not prohibit** the authorized one-time send.
- **Read-only screenshot review, analysis, preview generation, and website-only releases never send Discord posts on their own.** Historical notes such as "never post from this task," "no Discord sends," "requires separate posting approval," or "posting OFF" are **scoped to those tasks/at that time** and do **not** override a later explicit leader instruction to publish a specific report.
- Keep event-specific **data integrity, valid final artwork/source, destination allowlist, pending/uncertain-send reconciliation, and at-most-once duplicate protection**. These are genuine verification requirements, not excuses to demand repeated user permission. Never enable global automatic dispatch, post to another channel, delete an old message, or cross AVENGERS/AV-2/SAC boundaries solely because one report was ordered sent.
- **After every send attempt, tell the leader the outcome immediately.** On success, provide the live Discord link, message ID, channel, and attachment verification. On failure, explain the **exact observed technical blocker** and whether a send might have happened; never invent success or blindly retry an ambiguous send. Do not burn repeated hosting/CI usage on speculative paths.

**Default event-summary destination:** Discord #Performance Statistics, channel `1470175579058999386`, for both AVENGERS and AV-2. This is the current operating policy and takes precedence over older *manual-post authorization* wording, while historical entries remain factual records of their original checkpoints.

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
