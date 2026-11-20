'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createHmac}=require('node:crypto');
const {applyChanges}=require('../server/roster-changes.cjs');
const {sessionFromRequest}=require('../server/kraken-entry-auth.cjs');
const {authorizedWorker}=require('../server/roster-editor-ci.cjs');
const {create}=require('./create-site-release.cjs');

test('owner changes update current clan, add a player and consolidate incoming aliases',()=>{
  const changes=[
    {kind:'status',name:'AV-no',status:'Active'},
    {kind:'add',name:'AV-RosterEditorFixture',status:'AV2'},
    {kind:'link',name:'AV-RosterEditorSpelling',target:'AV-RosterEditorFixture'}
  ];
  const a=create({rosterChanges:{revision:0,changes:[]}});
  const b=create({rosterChanges:{revision:changes.length,changes}});
  const person=(release,name)=>release.projection.people.find(row=>row.name===name);
  assert.equal(person(b,'AV-no').status,'Active');
  assert.deepEqual(person(a,'AV-no').history,person(b,'AV-no').history);
  assert.equal(person(b,'AV-RosterEditorFixture').status,'AV2');
  assert.equal(person(b,'AV-RosterEditorFixture').earned.events,0);
  assert.equal(b.globals.AVENGERS_DATA.aliasMap['AV-RosterEditorSpelling'],'AV-RosterEditorFixture');
  assert.equal(b.globals.AVENGERS_MEMBER_TIMEZONES.byName['AV-RosterEditorFixture'].status,'AV2');
  assert.notEqual(a.projection.version,b.projection.version);
});
test('link retires an existing profile and event-time data stays with its results',()=>{
  const changes=[{kind:'add',name:'AV-RosterEditorFixture',status:'AV2'},
    {kind:'link',name:'AV-no',target:'AV-RosterEditorFixture'}];
  const a=create({rosterChanges:{revision:0,changes:[]}});
  const b=create({rosterChanges:{revision:changes.length,changes}});
  assert.equal(b.projection.people.find(row=>row.name==='AV-no'),undefined);
  const old=a.projection.people.find(row=>row.name==='AV-no');
  const merged=b.projection.people.find(row=>row.name==='AV-RosterEditorFixture');
  assert.equal(merged.status,'AV2');
  assert.deepEqual(merged.history.map(({date,clan,score,sparks})=>({date,clan,score,sparks})),
    old.history.map(({date,clan,score,sparks})=>({date,clan,score,sparks})));
});
test('duplicate adds, existing alias reassignment, invalid names and circular links are rejected',()=>{
  const people=[{name:'AV-One',status:'Active'},{name:'AV-Two',status:'AV2'}];
  assert.throws(()=>applyChanges(people,{},[{kind:'add',name:'av-one',status:'Active'}],{validateNew:true}),/already recorded/);
  assert.throws(()=>applyChanges(people,{'Existing alias':'AV-One'},[{kind:'link',name:'Existing alias',target:'AV-Two'}]),/different member/);
  assert.throws(()=>applyChanges(people,{},[{kind:'link',name:'__proto__',target:'AV-One'}]),/valid in-game/);
  assert.throws(()=>applyChanges(people,{},[{kind:'link',name:'AV-One',target:'AV-Two'},
    {kind:'link',name:'AV-Two',target:'AV-One'}]),/already points/);
});
test('the same signed-in owner gate rejects guests, a second member and invalid worker credentials',async()=>{
  const {owner}=require('../api/roster-editor.js');
  const env={AUTH_SECRET:'test-only',AVENGERS_KRAKEN_REVIEWER_IDS:'123456789012345678'};
  function request(payload){
    const body=Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+100,...payload})).toString('base64url');
    const sig=createHmac('sha256',env.AUTH_SECRET).update(body).digest('base64url');
    return {headers:{cookie:'avengers_session='+body+'.'+sig}};
  }
  const signed=request({sub:env.AVENGERS_KRAKEN_REVIEWER_IDS});
  assert(sessionFromRequest(signed,env));
  assert(owner(signed,env));
  assert.equal(owner(request({sub:'234567890123456789'}),env),null);
  assert.equal(owner(request({sub:env.AVENGERS_KRAKEN_REVIEWER_IDS,guest:true}),env),null);
  assert.equal(owner(signed,{...env,AVENGERS_KRAKEN_REVIEWER_IDS:env.AVENGERS_KRAKEN_REVIEWER_IDS+',234567890123456789'}),null);
  assert.equal(await authorizedWorker({headers:{authorization:'Bearer not.a.jwt'}}),false);
});
