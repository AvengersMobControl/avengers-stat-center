# Final-result screenshot review: unapproved event candidates

This is a **read-only intake adapter for already visually reviewed image data**, not a Discord downloader, image interpreter, OCR service, automated approval service, or posting bot. Scope: AVENGERS/AV-2, issue #4. Paused UTC/country synchronization #3 remains off.

## Workflow

1. Retrieve only authorized Results-channel screenshots using the existing approved read-only review workflow. Classify each image as **final-claim**, **preliminary** or **progress** by visual inspection. A digest or reward amount is not proof an image is final.
2. Supply a JSON review containing the event identity/kind/date/score unit and multiple screenshot entries. Every verified final image requires its **actual image SHA-256**, verifiedFinal=true, matching event identity and parsed player rows. Each player needs the original **event-time clan**, exact score, and Sparks/Stars numbers or explicit null for unknown. Do not derive zero or current-clan identity from absent data.
3. Run: node scripts/assemble-result-review.cjs review.json --out safe-candidate.json
4. The candidate is written only under gitignored reports/. Without --out, the unapproved candidate is printed. Full projected-site dry-run and changed-member checks occur without touching the approved source.
5. Reconcile the preview with final screenshots and present it for explicit leader approval. The generated update always has approved=false. Conflicting rows, missing clan, wrong unit and wrong event identifiers fail without a candidate.
6. Only after separately documented leader approval, set approved=true in the reviewed candidate, then run node scripts/stage-event-update.cjs reports/safe-candidate.json --apply in a development checkout, run the full projection/browser gate, review the data diff and publish the coherent site using normal PR/Pages deployment. No automatic Git commits, live imports or Discord messages.

## Example parsed input (SYNTHETIC ONLY; not an actual race or valid real screenshot)

    {
      "schemaVersion": 1,
      "event": {
        "id": "space|2026-10-17",
        "kind": "space",
        "date": "2026-10-17",
        "unit": "billion-lightyears"
      },
      "coverageComplete": false,
      "screens": [
        {"classification": "progress", "eventId": "space|2026-10-17"},
        {
          "classification": "final-claim",
          "verifiedFinal": true,
          "eventId": "space|2026-10-17",
          "eventDate": "2026-10-17",
          "eventKind": "space",
          "imageSha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "rows": [
            {
              "player": "AV-Example",
              "clan": "AVENGERS",
              "score": 52.4,
              "sparks": null,
              "stars": null,
              "metadata": {"rank": 1, "group": 1, "share": 0.25}
            }
          ]
        }
      ]
    }

The sample name, date and hash are fixtures. Real candidates MUST compute SHA-256 from the actual original image bytes. Never substitute Discord IDs, user IDs, URLs, fabricated hashes or message identifiers. The output copies only image hashes and allowlisted gameplay metadata, not raw chat content, URLs or hidden screenshot context.

## Safety, identity and coverage

- Multi-image aggregation: verified final captures combine into one event. Exact image reposts are deduped by SHA-256; duplicate player rows in different images are accepted only if clan, score and rewards agree.
- Conflicting screenshot rows and attempts to silently change an already published player result stop the candidate; correction/revocation goes through a separate explicitly approved revision.
- Final screenshots do not imply complete coverage. Unless coverageComplete is explicitly true and verified, the event remains partial and absent/unreadable rewards remain null. A completeness assertion does not waive leader approval.
- Reposts that add no player result leave the prior published event and its source list unchanged; a final published event cannot be extended silently.
- Public aliases follow the reviewed canonical identity map; unknown identities or event-time clan remain review blockers. AV-Frenchie2 and AV-Frenchie(-4) stay distinct.
- Event keys: Piggy/Space use kind|YYYY-MM-DD, Flash uses flash|YYYY-MM-DD|number, Kraken uses kraken|monthKey. Stable identity is independent of Discord message IDs.
- Accepted changes still require sitewide cross-view rebuild/tests, immutable review history and confirmation of the production Pages commit. An already-open browser tab may need a reload.

## Still outstanding for issue #4

A real end-to-end authorized retrieval, human final-vs-progress verification, source-image hashing, secure multi-image extraction, approval, and deployment has NOT been demonstrated by this work. Automated ingestion remains OFF. This module must not be described as image recognition or production-ready unattended import.


## Capped Discord result-channel pagination (October 16 verified)

**Only authorized manual read-only pulls:** the connected results viewer accepts `max_messages` up to 100 but returns at most **eight images** per call. Passing `max_messages=100` alone is not evidence that all screenshots were retrieved. The cutoff can fall **inside a Discord message** with multiple attachments.

Use `scripts/audit-result-pagination.cjs` with a local, private JSON manifest of *metadata* for the sequence of authorized connector pulls. The manifest has `schemaVersion:1`, `channelKey`, `windowStart`, `windowEnd`, `pages`. Each page includes its exact `request: {maxImages, maxMessages, beforeMessageId?}`, `scannedMessages`, `imagePostsReturned`, `imageAttachmentsReturned` and `candidates: [{messageId,timestamp,attachments:[{id}]}]`. Take all counts and IDs directly from the connector; **never make them up**. Keep real Discord IDs and any attachment URLs in local/private review data, **never** in GitHub or deployed site bundles. Do not include raw message text, usernames, signed image URLs or file bytes in the audit manifest.

To page backward safely:
1. Begin with the newest page (no `beforeMessageId`) and at most eight images.
2. If a page fills the eight-image cap, set `beforeMessageId` on the next pull to the **second-oldest returned message**, so the oldest returned message is fetched again. That protects against a final message being truncated at the cap. If the page contains only **one** message at the cap, **stop**: the connector cannot prove all attachments in that message were supplied. Do not invent a cursor.
3. If the page is below cap and still within the target date, request older results with `beforeMessageId` set to its **oldest returned message**. If no messages appear, coverage is **blocked**, not proven.
4. Stop as `window-covered` only after an uninterrupted, validated sequence includes an image from a date **strictly before** the earliest event date. The auditor checks cursor continuity, chronological order, overlap, duplicate attachment IDs and consistency. If it returns `needs-more-pages`, continue from its private `nextBeforeMessageId`; if `blocked`, resolve the missing evidence rather than publishing.
5. Coverage of the post window is **not** final-image classification, actual-byte integrity verification, group/lobby completeness or leader approval. `reviewAllowed` means only that the enumerated image dates are ready for visual classification.

**Read-only live observation, Oct 16 Space channel:** Three paginated calls with the overlap rule returned 8, 8 and 8 images respectively; repeated boundary images were deduplicated. The third page reached October 15 and October 9 captures, proving the October 16 date boundary was passed. The first page alone (eight images) was not sufficient. The provenance of **original source JPEG bytes remains unverified** from this viewing connector.

### Original attachment SHA-256

When a separately authorized workflow actually retrieves the **original image bytes** (not a transcoded ChatGPT/connector WebP preview), run:

    node scripts/hash-original-image.cjs source-image.jpg --content-type=image/jpeg --attest-original

The command requires an operator's **explicit original-byte attestation**, compares image signature against the claimed content type, and outputs SHA-256 of the exact file contents, byte length and content type. It does not download a URL, authenticate Discord provenance or prove the attestation independently. Verify the source against the authorized attachment ID before using the digest in a candidate; do **not** replace the digest with SHA-256 of a message ID, signed URL, WebP preview or imagined JPEG. Source files and signed URLs stay outside the repository. The existing `assemble-result-review.cjs` still requires a proper image-byte digest and `approved:false` on all staged candidates.

**Release boundary unchanged:** no unattended fetch, score import, Discord posting or approval; current already-approved scores remain authoritative. The first genuinely *new* parsed event must be explicitly reviewed and authorized, then rebuilt and verified everywhere on the public site before task #4 can be closed.

## Reviewer-only original Discord CDN download (next #4 source-evidence step)

The current viewing connector returns signed attachment URLs and screenshots converted for display; its WebP previews must **not** be hashed as if they were original JPEGs. A new opt-in **one-attachment-at-a-time**, reviewer-operated CLI can instead request the original bytes using the signed **HTTPS cdn.discordapp.com/attachments/** URL from the authorized Results connector metadata:

1. Retrieve the signed URL, channel ID, attachment ID and image content type from the approved **read-only** Discord Results connector. Keep the signed URL in a private environment or protected input file. Do **not** paste it into GitHub, docs, CI logs, screenshots, shell history or the public web site.
2. From a workstation/runtime with direct network access to Discord CDN, supply the URL on stdin, and pass the exact IDs/type as CLI options:

       node scripts/fetch-original-discord-image.cjs --channel-id=CHANNEL_ID --attachment-id=ATTACHMENT_ID --content-type=image/jpeg < PRIVATE_URL_FILE

3. The client permits only direct HTTPS `cdn.discordapp.com` with matching attachment path/IDs and no transformations, refuses automatic redirects, checks HTTP status, content-type, encoding, content-length and original image-file signature, and reads a maximum of 25 MiB. It prints the **SHA-256 of the fetched raw source bytes** plus size/type and `approved:false`/`verifiedFinal:false`. It does not write images, persist signed URLs, commit results, or turn on automation. A successful fetch proves the obtained bytes match that authorized CDN response; it does **not** determine whether the screenshot shows final results or whether parsed rows are correct.
4. Only use that actual-source `imageSha256` in the **manually verified** image entry for `scripts/assemble-result-review.cjs`. The prior visually reviewed result rows, event-time clan, identity, source date and explicit result approval remain required; all updates remain `approved:false` until separately approved by the clan leader.

If the execution environment cannot access the signed CDN URL or the signature has expired, this step **fails closed**. Do not substitute a screenshot preview/Discord ID hash or bypass approval. The current ChatGPT tool environment cannot independently demonstrate that direct CDN download; tests use synthetic byte streams, **not retrieved Discord originals**.

## Public GitHub Pages release evidence

The staged site now includes the exact source Git commit in `release-manifest.json.sourceCommit` and the page's `data-release-commit` attribute. The Pages workflow **after publication** re-requests the real public manifest, both versioned projection/ledger exports and runs Chromium against the public page. It requires the **exact deployed SHA**, the same projection/export versions and immutable asset paths, a clean browser and both Oct 16 clan rows (44 AVENGERS, 22 AV-2). It retries for eventual Pages propagation, then **fails the workflow** rather than claiming that a pre-publish browser test proves live production. See `scripts/verify-live-pages.cjs`; a passing main Pages workflow is the required public Pages evidence, separate from Vercel READY status.
