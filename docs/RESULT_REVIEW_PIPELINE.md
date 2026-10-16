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
