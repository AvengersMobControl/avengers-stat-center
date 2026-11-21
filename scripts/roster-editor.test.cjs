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
test('the roster editor accepts both configured owners and rejects guests other members and invalid worker credentials',async()=>{
  const {owner}=require('../api/roster-editor.js');
  const first='123456789012345678',second='234567890123456789',other='345678901234567890';
  const env={AUTH_SECRET:'test-only',AVENGERS_ROSTER_OWNER_IDS:first+', '+second,AVENGERS_KRAKEN_REVIEWER_IDS:first};
  function request(payload){
    const body=Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+100,...payload})).toString('base64url');
    const sig=createHmac('sha256',env.AUTH_SECRET).update(body).digest('base64url');
    return {headers:{cookie:'avengers_session='+body+'.'+sig}};
  }
  const signed=request({sub:first});
  assert(sessionFromRequest(signed,env));
  assert.equal(owner(signed,env).id,first);
  assert.equal(owner(request({sub:second}),env).id,second);
  assert.equal(owner(request({sub:other,username:'Owner'}),env),null);
  assert.equal(owner(request({sub:first,guest:true}),env),null);
  assert.equal(owner(signed,{...env,AVENGERS_ROSTER_OWNER_IDS:first+',invalid'}),null);
  assert.equal(owner(signed,{...env,AVENGERS_ROSTER_OWNER_IDS:undefined}),null);
  assert.equal(await authorizedWorker({headers:{authorization:'Bearer not.a.jwt'}}),false);
});

test('the public Rosters page leads to Discord sign-in and only authorized sessions get the editor link',async()=>{
  const {readFileSync}=require('node:fs');
  const {runInNewContext}=require('node:vm');
  const source=readFileSync(require.resolve('../roster-editor-link.js'),'utf8');
  async function loadRosters(origin,allowed){
    const links=[];
    const fetchPaths=[];
    let openedRosters=false;
    await runInNewContext(source,{
      location:{origin,search:'?page=rosters'},
      URLSearchParams,
      document:{
        getElementById:()=>({prepend:toolbar=>links.push(toolbar.link)}),
        querySelector:()=>({click:()=>{openedRosters=true;}}),
        createElement:()=>({append(link){this.link=link;}})
      },
      fetch:async path=>{
        fetchPaths.push(path);
        return {ok:true,json:async()=>({allowed})};
      }
    });
    return {links,fetchPaths,openedRosters};
  }

  const publicView=await loadRosters('https://avengersmobcontrol.github.io',false);
  assert.equal(publicView.links[0].textContent,'Sign in with Discord');
  assert.equal(publicView.links[0].href,'https://avengers-stat-center.vercel.app/?page=rosters');
  assert.deepEqual(publicView.fetchPaths,[]);
  const ownerView=await loadRosters('https://avengers-stat-center.vercel.app',true);
  assert.equal(ownerView.openedRosters,true);
  assert.deepEqual(ownerView.fetchPaths,['/api/roster-editor?view=capability']);
  assert.equal(ownerView.links[0].textContent,'Manage rosters');
  assert.equal(ownerView.links[0].href,'/api/roster-editor');
  const otherView=await loadRosters('https://avengers-stat-center.vercel.app',false);
  assert.equal(otherView.openedRosters,true);
  assert.deepEqual(otherView.links,[]);
});
