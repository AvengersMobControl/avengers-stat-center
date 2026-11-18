# AVENGERS website-results collection — bounded Friday/Sunday windows

Effective November 18, 2026. Leader-approved website-only pipeline; Claude
alone produces and sends Discord summary PNGs/messages AFTER website publication.
This collector never sends Discord messages, generates posters or updates the
public event ledger. It only captures original screenshots, proves their bytes,
and checks whether a guarded publication run reached the live website.

## Collection windows (America/Chicago; DST-aware)

| Window | Priority, lookbacks and fallback |
| --- | --- |
| Friday **02:00–07:30** | **First all four Piggy Flash channels**: every posted screenshot since prior Monday 06:00. **Then Space Race**: every posted screenshot since prior Wednesday 06:00, including all lobbies (6 typical, 7+ possible). Space usually ends Friday 02:00 but can end earlier. If no final Space result, use Friday Piggy (same Wednesday lookback) instead. **Always check delayed AV-2** (plus relevant Kraken-channel sources). |
| Sunday **16:00–18:30** | **Big Piggy first**, usually ending at 16:00, with posted screenshots since prior Friday 02:00. If no final Piggy, check Sunday Space (since prior Wednesday 06:00). **Always check AV-2** and relevant Kraken-channel sources, even when AV-2 is late/incomplete. |

The first AV-2 source window uses a conservatively extended 21-day lookback,
then the last successfully published and fully accounted AV-2 checkpoint
(where available). A partial AV-2 cycle does NOT advance that cutoff; its
unresolved sources remain eligible for a later collection window.

Vercel's legacy crons are UTC-only. The three narrowly bounded production
cron paths cover the required Central-time hours in both CST and CDT. A hard
America/Chicago time gate in the API executes before any Discord, Neon, or
website calls: out-of-window UTC ticks perform NO source collection. The
underlying Vercel cron receives a few extra UTC invocations around DST edges;
the server returns immediately, without background polling.

The job processes two bounded channel pages per five-minute tick. Each page
contains up to five Discord messages, ALL original image attachments (no
eight-image client cap), with SHA-256 computed over actual Discord original
bytes. Source-only progress is durable in the existing private Neon tables:
channel_checkpoints (scoped by window), source_messages, source_attachments,
collector_lease, and ingest_runs. Pages never advance past a failed original
proof. Other channels continue after one source failure. A failed or partial
AV-2 scan does not block import of verified main-clan rows.

## Stop condition: real website publication, not screenshot download

Every collection tick independently requests the public GitHub Pages release
manifest and immutable versioned event ledger. It may record private
website-published state and stop future Discord requests only when:
1. Required channel source windows have been fully scanned and original images
   verified (AV-2/Kraken need at least one scan attempt; known uploaded images must be published or explicitly held before collection stops).
2. All four Friday Flash result sources appear in the appropriate four live
   Flash events after the Monday cutoff.
3. Every already-retrieved AV-2/Kraken original source is accounted for in the public ledger (any unresolved source remains pending; unposted late AV-2 lobbies cannot be invented). The actual primary Space/Piggy event (or verified fallback) appears in the
   public ledger with every required verified final source hash.
4. The manifest's exact Git commit, export version, and returned ledger version
   agree. A Vercel READY deployment, successful scan, GitHub PR or job-complete
   flag does NOT satisfy this condition.

This is intentionally conservative: an unrelated or progress image may require
manual classification before the stop condition can pass. A verified screenshot
hash by itself NEVER proves that all player rows were imported. Final CLAIM
review, canonical historical identity matching, per-lobby/rank row-completeness
proof, guarded digest staging/apply, CI/Pages/browser checks remain the
separate ChatGPT Friday/Sunday website-publication tasks.

## Failure alert to the leader

The TWO existing ChatGPT automations were rescheduled, not duplicated:
Friday 02:00 and 07:30 Central; Sunday 16:00 and 18:30 Central. The early run
is responsible for final screenshots and website publication. The window-end
run checks the live Pages manifest, event ledger/projection, Flash channel
coverage and AV-2 source holds. If any required result did not reach the site,
it must report FAILED PUBLICATION to the leader, naming the blocker, source
coverage and live SHA. It must not report success just because cron or PR
succeeded. Claude sees results only after they reach the website.

Manual authenticated POST /api/discord/result-intake retains existing operator
access for explicitly directed recovery, including action=status. The cron
never uses manual POST. Private tokens, Discord source URLs, message IDs and
raw images must never enter public checkpoints, release manifests, PR
summaries, or user-facing failure alerts.
