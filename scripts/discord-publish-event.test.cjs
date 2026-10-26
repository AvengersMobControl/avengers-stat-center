'use strict';
// Guards for the standing event publisher (api/discord/publish-event.js).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { tokenOkay, validPost, mentions, allowedClans, postKeys } = require('../api/discord/publish-event.js')._test;
const sha = s => crypto.createHash('sha256').update(s).digest('hex');

const good = { kind: 'piggy', eventId: 'piggy|2026-10-23', clan: 'AVENGERS', file: 'AVENGERS_Big_Pig_October_23_2026.png',
  sha256: 'a'.repeat(64), size: 10, body: '@everyone hi', approved: true, template: 't' };

test('token must hash to the configured digest', () => {
  const t = 'b'.repeat(64);
  assert.equal(tokenOkay(t, { AVENGERS_AUTO_PUBLISH_ONCE_SHA256: sha(t) }), true);
  assert.equal(tokenOkay('c'.repeat(64), { AVENGERS_AUTO_PUBLISH_ONCE_SHA256: sha(t) }), false);
  assert.equal(tokenOkay(t, {}), false);
  assert.equal(tokenOkay('short', { AVENGERS_AUTO_PUBLISH_ONCE_SHA256: sha('short') }), false);
});

test('post key, kind, file, pin, body and approval are validated', () => {
  assert.equal(validPost('piggy|piggy|2026-10-23|AVENGERS', good), good);
  assert.throws(() => validPost('piggy|piggy|2026-10-23|AV-2', good));
  assert.throws(() => validPost('kraken|x|AVENGERS', { ...good, kind: 'kraken', eventId: 'x' }));
  assert.throws(() => validPost('piggy|piggy|2026-10-23|AVENGERS', { ...good, file: '../x.png' }));
  assert.throws(() => validPost('piggy|piggy|2026-10-23|AVENGERS', { ...good, body: 'x'.repeat(2001) }));
  assert.throws(() => validPost('piggy|piggy|2026-10-23|AVENGERS', { ...good, approved: false }));
  assert.throws(() => validPost('piggy|piggy|2026-10-23|AVENGERS', undefined));
});

test('only @everyone may ping, and only when the write-up starts with it', () => {
  assert.deepEqual(mentions('@everyone go'), { parse: ['everyone'] });
  assert.deepEqual(mentions('go @everyone'), { parse: [] });
});

test('AV-2 stays off unless explicitly enabled', () => {
  assert.deepEqual([...allowedClans({})], ['AVENGERS']);
  assert.ok(allowedClans({ AVENGERS_AUTO_PUBLISH_CLANS: 'AVENGERS,AV-2' }).has('AV-2'));
});

test('token is bound to the listed post keys only', () => {
  assert.deepEqual(postKeys({ AVENGERS_AUTO_PUBLISH_POST: 'space|space|2026-11-01|AVENGERS, piggy|piggy|2026-11-01|AVENGERS' }),
    ['space|space|2026-11-01|AVENGERS', 'piggy|piggy|2026-11-01|AVENGERS']);
  assert.deepEqual(postKeys({}), []);
});
