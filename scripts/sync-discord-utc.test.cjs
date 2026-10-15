'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {parseUtc, countryOf, nameOf, clanOf, reconcile, knownRoster} = require('./sync-discord-utc.cjs');

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
  assert.equal(known.get('av-zolika.x.kira')?.name, 'AV-ZolikaLoveKira');
  const state = {members: [],pending: []};
  reconcile(state, {id:'101',timestamp:'2026-10-15T12:00:00Z',
    content:'UTC+2, Netherlands',author:{id:'15',username:'x'},
    member:{nick:'AV-Zolika.x.Kira'}}, known, '');
  assert.equal(state.members[0].name, 'AV-ZolikaLoveKira');
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
