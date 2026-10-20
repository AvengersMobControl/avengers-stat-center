'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { CHANNEL_ENV_KEY, ALLOWED_CLANS, ALLOWED_KINDS, resolveSummaryDestination } =
  require('../server/discord-summary-destination.cjs');

const id = '1470175579058999386';
const env = Object.freeze({ [CHANNEL_ENV_KEY]: id });

test('all five report kinds for both clans use the same trusted channel', () => {
  for (const clan of ALLOWED_CLANS) {
    for (const kind of ALLOWED_KINDS) {
      const route = resolveSummaryDestination({ kind, clan }, env);
      assert.equal(route.channelId, id);
      assert.equal(route.kind, kind);
      assert.equal(route.clan, clan);
      assert.equal(Object.isFrozen(route), true);
    }
  }
});

test('fails closed with missing or malformed channel config', () => {
  for (const badEnv of [{}, { [CHANNEL_ENV_KEY]: '' },
    { [CHANNEL_ENV_KEY]: '123' }, { [CHANNEL_ENV_KEY]: 'x'.repeat(18) },
    { [CHANNEL_ENV_KEY]: 1470175579058999386 }]) {
    assert.throws(() => resolveSummaryDestination({ kind: 'piggy', clan: 'AV-2' }, badEnv),
      /authorized destination is not configured/);
  }
});

test('caller cannot override the configured destination', () => {
  for (const key of ['channelId', 'destinationChannelId', 'discordChannelId']) {
    assert.throws(() => resolveSummaryDestination({ kind: 'space', clan: 'AVENGERS', [key]: id }, env),
      /caller-supplied destination forbidden/);
  }
});

test('invalid clan/kind and incomplete routes are rejected', () => {
  for (const request of [null, [], {}, { kind:'flash', clan:'SAC' },
    { kind:'anything', clan:'AV-2' }, { kind:'weekly', clan:'BOTH' }]) {
    assert.throws(() => resolveSummaryDestination(request, env));
  }
});
