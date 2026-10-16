'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {parseUtc, countryOf, nameOf, clanOf, reconcile, knownRoster, encryptState, decryptState, publicProjection} = require('./sync-discord-utc.cjs');

test('handles signed, fractional and quarter-hour UTC offsets', () => {
  assert.equal(parseUtc('UTC -5'), -5);
  assert.equal(parseUtc('UTC+5:30'), 5.5);
  assert.equal(parseUtc('UTC+5.75'), 5.75);
  assert.equal(parseUtc('+2'), 2);
  assert.equal(parseUtc('UTC−4'), -4);
  assert.equal(parseUtc('UTC+15'), null);
  assert.equal(parseUtc('hello there'), null);
});
test('reads country only when supplied rather than guessing it from UTC', () => {
  assert.equal(countryOf('UTC+2'), '');
  assert.equal(countryOf('UTC+2, Germany'), 'Germany');
  assert.equal(countryOf('UTC+2 | Germany'), 'Germany');
  assert.equal(countryOf('UTC +5:30\nCountry: India'), 'India');
});
test('preserves known member clan and canonical name', () => {
  const known = knownRoster();
  assert.equal(known.get('av-zolika.x.kira')?.name, 'AV-Zolika.x.Kira');
  const state = {members: [],pending: []};
  reconcile(state, {id:'101',timestamp:'2026-10-15T12:00:00Z',
    content:'UTC+2, Netherlands',author:{id:'15',username:'x'},
    member:{nick:'AV-Zolika.x.Kira'}}, known, '');
  assert.equal(state.members[0].name, 'AV-Zolika.x.Kira');
  assert.equal(state.members[0].status, 'Active');
  assert.equal(state.members[0].country, 'Netherlands');
});
test('creates a new AV-2 player when default clan is configured', () => {
  const state = {members: [],pending: []};
  const message = {id:'100',content:'UTC+5:30, India',timestamp:'2026-10-15T12:00:00Z',
    member:{nick:'AV-NewPlayer'},author:{id:'12',username:'discord_user'}};
  reconcile(state,message,new Map(),'AV-2');
  assert.deepEqual([state.members[0].name,state.members[0].status,state.members[0].utc,
    state.members[0].country],['AV-NewPlayer','AV2',5.5,'India']);
  reconcile(state,{...message,id:'101',content:'UTC+5:45, Nepal'},new Map(),'AV-2');
  assert.equal(state.members.length,1);
  assert.equal(state.members[0].utc,5.75);
  assert.equal(state.members[0].country,'Nepal');
});
test('new player without a clan is pending and cannot join wrong roster', () => {
  const state = {members: [],pending: []};
  reconcile(state,{id:'2',content:'UTC-4',author:{id:'99',global_name:'PotentialPlayer'}},new Map(),'');
  assert.equal(state.members.length,0);
  assert.equal(state.pending[0].reason,'missing_clan');
});
test('two different Discord users never overwrite the same overlay member', () => {
  const state = {members: [],pending: []};
  const sample = id => ({id,content:'UTC-5, USA\nClan: AVENGERS',
    member:{nick:'AV-Same'},author:{id,username:'x'}});
  reconcile(state,sample('1'),new Map(),'');
  reconcile(state,sample('2'),new Map(),'');
  assert.equal(state.members.length,1);
  assert.equal(state.pending[0].reason,'name_already_linked_to_another_discord_account');
});

test('state encryption hides Discord identifiers and survives a round trip', () => {
  const secret = 'a-long-test-secret-that-is-not-for-production-1234567890';
  const state = {
    lastMessageId: '987654321098765432',
    members: [{discordUserId:'123456789012345678', name:'AV-NewPlayer',
      status:'AV2', utc:5.5, country:'India', messageId:'987654321098765431'}],
    pending: [{discordUserId:'555555555555555555',proposedName:'Unknown',utc:-5,
      country:'USA',reason:'missing_clan',messageId:'987654321098765430'}]
  };
  const encrypted = encryptState(state, secret);
  const raw = JSON.stringify(encrypted);
  assert.equal(raw.includes('123456789012345678'), false);
  assert.equal(raw.includes('987654321098765432'), false);
  assert.equal(raw.includes('AV-NewPlayer'), false);
  assert.deepEqual(decryptState(encrypted,secret), state);
  assert.throws(() => decryptState(encrypted, secret+'wrong'), /auth|authenticate/i);
  assert.throws(() => encryptState(state, 'short'), /at least 32 characters/);
});
test('browser projection includes approved public fields only', () => {
  const state = {lastMessageId:'987654321098765432',
    members:[{discordUserId:'123456789012345678',name:'AV-NewPlayer',status:'AV2',
      utc:5.5,country:'India',messageId:'987654321098765431'}],
    pending:[{discordUserId:'555555555555555555',reason:'missing_clan'}]};
  const projection=publicProjection(state);
  assert.deepEqual(projection, {members:[{name:'AV-NewPlayer',status:'AV2',
    utc:5.5,country:'India'}]});
  const published=JSON.stringify(projection);
  assert.equal(published.includes('discordUserId'),false);
  assert.equal(published.includes('messageId'),false);
  assert.equal(published.includes('pending'),false);
});

test('October 15 roster overrides stale October 1 clan statuses', () => {
  const known = knownRoster();
  assert.equal(known.get('av-eventhorizon')?.status, 'AV2');
  assert.equal(known.get('av-drdetroit')?.status, 'AV2');
  assert.equal(known.get('av-starred')?.status, 'AV2');
  assert.equal(known.get('av-bubba0816')?.status, 'Inactive');
  assert.equal(known.get('av-frenchie2')?.status, 'AV2');
  assert.equal(known.get('av-frenchie(-4)')?.status, 'AV2');
  assert.notEqual(known.get('av-frenchie2'), known.get('av-frenchie(-4)'));
  assert.equal(known.get('av-zolika.x.theboss')?.name, 'AV-Zolika.x.Kira');
  assert.equal(known.get('take.them.out')?.name, 'AV-ColdCreeps');
});
