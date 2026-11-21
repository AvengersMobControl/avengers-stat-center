'use strict';
// Guards against an approved Flash PF landing in data/approved-event-updates.json
// without the metadata.setId tag that api/discord/publish-event.js's
// matchApprovedUpdates()/sourceDigest() need to find a Flash Set for the standing
// Discord auto-post (see api/discord/publish-event.js:80-109).
//
// A missing setId has zero effect on the public site -- it's an internal field
// used only by this one safety check -- so nothing else in the pipeline catches
// it, and the website shows the correct results either way. The Nov 17-18 PF1-4
// approvals landed (via #248/#250) without it and silently blocked that week's
// Flash Set post until caught and backfilled by hand (#252, docs/DECISION_LOG.md
// 2026-11-21). This test makes that specific gap fail CI on the PR that creates
// it, instead of surfacing only when someone tries to send.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const updates = require('../data/approved-event-updates.json').updates;

test('every approved, numbered AVENGERS Flash PF has a well-formed metadata.setId', () => {
  // Excludes the AV-2 weekly pool shape (metadata.pool === 'av2-week'), which is a single
  // unnumbered event per week and is never grouped into a Flash Set -- see AGENTS.md's
  // 2026-11-18 "AV-2 Piggy Flash is ONE unnumbered weekly pool" entry.
  const flashUpdates = updates.filter(u => u.approved === true && u.event && u.event.kind === 'flash'
    && u.event.metadata && typeof u.event.metadata.flash === 'number');
  assert.ok(flashUpdates.length > 0, 'sanity: there are approved, numbered Flash PF entries to check');
  for (const u of flashUpdates) {
    const setId = u.event.metadata && u.event.metadata.setId;
    assert.match(String(setId), /^\d{4}-\d{2}-\d{2}-[A-Za-z]$/,
      `${u.event.id} (revision ${u.expectedRevision}) is missing a valid metadata.setId -- ` +
      'api/discord/publish-event.js cannot group it into a Flash Set for the Discord auto-post');
  }
});
