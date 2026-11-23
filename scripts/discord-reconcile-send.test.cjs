'use strict';
// Guards for the read-only ambiguous-send reconciler (api/discord/reconcile-send.js).
// This endpoint never sends/edits/deletes Discord messages; it only confirms a
// byte-for-byte match for a slot publish-event.js already flagged
// manual_reconciliation_required. These tests cover the one piece of logic that
// doesn't require live Discord/Neon access: the token gate.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { tokenOkay } = require('../api/discord/reconcile-send.js')._test;
const sha = s => crypto.createHash('sha256').update(s).digest('hex');

test('reconcile token must hash to the configured digest', () => {
  const t = 'd'.repeat(64);
  assert.equal(tokenOkay(t, { AVENGERS_RECONCILE_TOKEN_SHA256: sha(t) }), true);
  assert.equal(tokenOkay('e'.repeat(64), { AVENGERS_RECONCILE_TOKEN_SHA256: sha(t) }), false);
  assert.equal(tokenOkay(t, {}), false);
  assert.equal(tokenOkay('short', { AVENGERS_RECONCILE_TOKEN_SHA256: sha('short') }), false);
  assert.equal(tokenOkay(undefined, { AVENGERS_RECONCILE_TOKEN_SHA256: sha(t) }), false);
});
