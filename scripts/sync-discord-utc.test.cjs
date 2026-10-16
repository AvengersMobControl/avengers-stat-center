'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {parseUtc, countryOf, nameOf, clanOf, reconcile, knownRoster, encryptState, decryptState, publicProjection, fetchMessages, onboardingPolicy, initializeCheckpoint} = require('./sync-discord-utc.cjs');

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
  assert.equal(countryOf('UTC-6\nLocation: USA'), 'USA');
});
const COUNCIL_ROLE='1427090799052587038';
const noRoles={councilRoleIds:[],verifiedLinks:{}};
const council={councilRoleIds:[COUNCIL_ROLE],verifiedLinks:{}};
const msg=(id, content, name, opts={})=>({
  id: String(1000+Number(id)),
  timestamp:'2026-10-15T12:00:00Z',
  content,author:{id:String(id),username:'discord_'+id},
  member:{nick:name,roles:opts.roles||[]},
  mentions:opts.mentions||[]
});
const tagged=(id,name)=>({id:String(id),member:{nick:name},
  username:'discord_'+id,bot:false});

test('any member first UTC and country post updates existing known roster identity without role',()=>{
  const state={members:[],pending:[]},known=knownRoster();
  reconcile(state,msg(15,'UTC+2, Netherlands','AV-Zolika.x.Kira'),known,'',noRoles);
  assert.equal(state.members.length,1);
  assert.equal(state.members[0].name,'AV-Zolika.x.Kira');
  assert.equal(state.members[0].status,'Active');
  assert.equal(state.members[0].utc,2);
  assert.equal(state.members[0].country,'Netherlands');
  assert.equal(state.members[0].source,'self');
  reconcile(state,msg(15,'UTC+6, India','AV-Zolika.x.Kira'),known,'',noRoles);
  assert.equal(state.members.length,1);
  assert.equal(state.members[0].utc,2,'later member messages must not overwrite first post');
});

test('any new member can self-report with explicit game name and clan',()=>{
  const state={members:[],pending:[]};
  reconcile(state,msg(16,'Name: AV-Newbie\nClan: AV-2\nUTC+5:30, India','AV-Newbie'),
    new Map(),'',noRoles);
  assert.deepEqual([state.members[0].name,state.members[0].status,
    state.members[0].utc,state.members[0].country],['AV-Newbie','AV2',5.5,'India']);
});
test('new member nickname can self-submit without Name field when clan is explicit',()=>{
  const state={members:[],pending:[]};
  reconcile(state,msg(19,'Clan: AV-2\nUTC+2, Germany','AV-NewMember'),new Map(),'',noRoles);
  assert.equal(state.members[0].name,'AV-NewMember');
  assert.equal(state.members[0].country,'Germany');
});
test('new member with no known clan waits for identity or clan verification',()=>{
  const state={members:[],pending:[]};
  reconcile(state,msg(19,'UTC+2, Germany','SomeDiscordUser'),new Map(),'',noRoles);
  assert.equal(state.members.length,0);
  assert.equal(state.pending[0].reason,'missing_or_inactive_clan');
  reconcile(state,msg(19,'Name: AV-Newbie\nUTC+2, Germany','AV-Newbie'),new Map(),'',noRoles);
  assert.equal(state.pending[0].reason,'missing_or_inactive_clan');
});
test('absent server nickname and absent explicit name cannot add a new member',()=>{
  const state={members:[],pending:[]};
  reconcile(state,msg(19,'Clan: AVENGERS\nUTC+2, Germany',null),new Map(),'',noRoles);
  assert.equal(state.members.length,0);
  assert.equal(state.pending[0].reason,'explicit_game_name_required');
});
test('direct self report requires country when it was not previously logged',()=>{
  const state={members:[],pending:[]};
  reconcile(state,msg(19,'Name: AV-Newbie\nClan: AV-2\nUTC+2','AV-Newbie'),
    new Map(),'',noRoles);
  assert.equal(state.members.length,0);
  assert.equal(state.pending[0].reason,'country_missing');
});
test('new Discord author cannot impersonate another known player using only Name field',()=>{
  const state={members:[],pending:[]};
  reconcile(state,msg(19,'Name: AV-HarryBallsagna\nUTC-5, USA','FakeName'),
    knownRoster(),'',noRoles);
  assert.equal(state.members.length,0);
  assert.equal(state.pending[0].reason,'existing_identity_requires_nickname_match');
});

test('nickname versus explicit name conflict is held for review',()=>{
  const state={members:[],pending:[]};
  reconcile(state,msg(19,'Name: AV-HarryBallsagna\nUTC-5, USA','AV-INTEN'),
    knownRoster(),'',noRoles);
  assert.equal(state.members.length,0);
  assert.equal(state.pending[0].reason,'nickname_identity_conflict');
});
test('first self post from verified existing member works when nickname has changed',()=>{
  const state={members:[],pending:[]};
  reconcile(state,msg(19,'UTC-5, USA','RenamedNickname'),knownRoster(),'',
    {councilRoleIds:[],verifiedLinks:{'19':'AV-HarryBallsagna'}});
  assert.equal(state.members[0].name,'AV-HarryBallsagna');
  assert.equal(state.members[0].utc,-5);
});

test('Council tag fills only previously missing UTC and location',()=>{
  const state={members:[],pending:[]};
  const target=tagged(33,'AV-DrDetroit');
  const post=msg(4,'<@33> UTC-6, USA','CouncilMember',
    {roles:[COUNCIL_ROLE],mentions:[target]});
  const known=new Map([['av-drdetroit',
    {name:'AV-DrDetroit',status:'AV2',utc:null,country:''}]]);
  reconcile(state,post,known,'',council);
  assert.equal(state.members.length,1);
  assert.equal(state.members[0].discordUserId,'33');
  assert.equal(state.members[0].name,'AV-DrDetroit');
  assert.equal(state.members[0].status,'AV2');
  assert.equal(state.members[0].country,'USA');
  assert.equal(state.members[0].source,'council');
  assert.equal(state.members[0].utc,-6);
  // Second Council message cannot overwrite the filled fields.
  reconcile(state,msg(4,'<@33> UTC+4, UAE','CouncilMember',
    {roles:[COUNCIL_ROLE],mentions:[target]}),known,'',council);
  assert.equal(state.members[0].utc,-6);
  assert.equal(state.members[0].country,'USA');
});

test('Council may fill missing country but never overwrite already logged UTC',()=>{
  const known=new Map([['av-test',{name:'AV-Test',status:'Active',utc:-4,country:''}]]);
  const state={members:[],pending:[]};
  reconcile(state,msg(4,'<@44> UTC+7, Canada','CouncilMember',{
    roles:[COUNCIL_ROLE],mentions:[tagged(44,'AV-Test')]
  }),known,'',council);
  assert.equal(state.members[0].utc,-4);
  assert.equal(state.members[0].country,'Canada');
});

test('Council cannot overwrite any fully logged location',()=>{
  const known=new Map([['av-test',{name:'AV-Test',status:'Active',utc:-4,country:'USA'}]]);
  const state={members:[],pending:[]};
  reconcile(state,msg(4,'<@44> UTC+7, Thailand','CouncilMember',{
    roles:[COUNCIL_ROLE],mentions:[tagged(44,'AV-Test')]
  }),known,'',council);
  assert.equal(state.members.length,0);
});

test('Council may log country only for a member whose UTC remains unknown',()=>{
  const known=new Map([['av-test',{name:'AV-Test',status:'Active',utc:null,country:''}]]);
  const state={members:[],pending:[]};
  reconcile(state,msg(4,'<@44> Location: Germany','CouncilMember',{
    roles:[COUNCIL_ROLE],mentions:[tagged(44,'AV-Test')]
  }),known,'',council);
  assert.equal(state.members.length,1);
  assert.equal(state.members[0].utc,null);
  assert.equal(state.members[0].country,'Germany');
  reconcile(state,msg(4,'<@44> Country: France','CouncilMember',{
    roles:[COUNCIL_ROLE],mentions:[tagged(44,'AV-Test')]
  }),known,'',council);
  assert.equal(state.members[0].country,'Germany','Council must not overwrite supplied country');
});
test('browser overlay preserves UTC when only country was supplied',()=>{
  const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
  const code=fs.readFileSync(path.resolve(__dirname,'../member-timezones-source.js'),'utf8');
  const make=members=>{
    const sandbox={window:{AVENGERS_DISCORD_UTC_ROSTER:{members}}};
    vm.runInNewContext(code,sandbox,{timeout:20000});
    return sandbox.window.AVENGERS_MEMBER_TIMEZONES;
  };
  const original=make([]);
  const before=original.byName['AV-DrDetroit'];
  const projected=make([{name:'AV-DrDetroit',status:'AV2',utc:null,country:'Germany'}]);
  const updated=projected.byName['AV-DrDetroit'];
  assert.equal(updated.utc,before?.utc??null,'missing UTC must not turn into zero');
  assert.equal(updated.location,'Germany');
  const blank=make([{name:'AV-PendingCountry',status:'AV2',utc:null,country:'Kenya'}]);
  assert.equal(blank.byName['AV-PendingCountry'].utc,null);
  assert.equal(blank.byName['AV-PendingCountry'].location,'Kenya');
});

test('Council tag needs actual configured Council role and exactly one target',()=>{
  const known=knownRoster();
  for(const [policy,options,reason] of [
    [council,{mentions:[tagged(33,'AV-DrDetroit')]},'council_role_required'],
    [noRoles,{mentions:[tagged(33,'AV-DrDetroit')],roles:[COUNCIL_ROLE]},'council_role_not_configured'],
    [council,{mentions:[tagged(33,'AV-DrDetroit'),tagged(34,'AV-Starred')],
      roles:[COUNCIL_ROLE]},'requires_exactly_one_tagged_member']
  ]){
    const state={members:[],pending:[]};
    reconcile(state,msg(4,'UTC-6, USA','CouncilMember',options),known,'',policy);
    assert.equal(state.members.length,0);
    assert.equal(state.pending[0].reason,reason);
  }
});
test('Council tag cannot create arbitrary person or update inactive player',()=>{
  const state={members:[],pending:[]},known=knownRoster();
  reconcile(state,msg(4,'UTC+2, France','CouncilMember',
    {roles:[COUNCIL_ROLE],mentions:[tagged(33,'Nonmember')]}),known,'',council);
  assert.equal(state.members.length,0);
  assert.equal(state.pending[0].reason,'tagged_member_not_in_active_roster');
  reconcile(state,msg(4,'UTC+2, France','CouncilMember',
    {roles:[COUNCIL_ROLE],mentions:[tagged(35,'AV-Bubba0816')]}),known,'',council);
  assert.equal(state.members.length,0);
});
test('Council tag ownership conflict never redirects an existing Discord account',()=>{
  const state={members:[{discordUserId:'33',name:'AV-Starred',status:'AV2',utc:2,country:'France'}],pending:[]};
  reconcile(state,msg(4,'UTC-6, USA','CouncilMember',{
    roles:[COUNCIL_ROLE],mentions:[tagged(33,'AV-DrDetroit')]
  }),knownRoster(),'',council);
  assert.equal(state.members[0].name,'AV-Starred');
  assert.equal(state.pending[0].reason,'tagged_identity_conflict');
});

test('member can supply own first report after Council proxy record',()=>{
  const state={members:[{discordUserId:'33',name:'AV-DrDetroit',status:'AV2',
    utc:-6,country:'USA',source:'council'}],pending:[]};
  reconcile(state,msg(33,'UTC-5, USA','AV-DrDetroit'),knownRoster(),'',noRoles);
  assert.equal(state.members.length,1);
  assert.equal(state.members[0].source,'self');
  assert.equal(state.members[0].utc,-5);
});
test('onboarding policy accepts direct self reports with no Council role configured',()=>{
  const oldRole=process.env.DISCORD_UTC_COUNCIL_ROLE_IDS,oldLinks=process.env.DISCORD_UTC_VERIFIED_LINKS;
  try{
    delete process.env.DISCORD_UTC_COUNCIL_ROLE_IDS;
    delete process.env.DISCORD_UTC_VERIFIED_LINKS;
    assert.deepEqual(onboardingPolicy(),noRoles);
    process.env.DISCORD_UTC_COUNCIL_ROLE_IDS=COUNCIL_ROLE;
    process.env.DISCORD_UTC_VERIFIED_LINKS='{"19":"AV-INTEN"}';
    const policy=onboardingPolicy();
    assert.deepEqual(policy.councilRoleIds,[COUNCIL_ROLE]);
    assert.equal(policy.verifiedLinks['19'],'AV-INTEN');
  }finally{
    if(oldRole==null)delete process.env.DISCORD_UTC_COUNCIL_ROLE_IDS;
    else process.env.DISCORD_UTC_COUNCIL_ROLE_IDS=oldRole;
    if(oldLinks==null)delete process.env.DISCORD_UTC_VERIFIED_LINKS;
    else process.env.DISCORD_UTC_VERIFIED_LINKS=oldLinks;
  }
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
  assert.equal(known.get('av-chuck')?.status, 'AV2');
  assert.equal(known.get('av-chuck')?.name, 'AV-CHUCK');
  assert.equal(known.get('av-jeffkintz05')?.status, 'AV2');
  assert.equal(known.get('av-jeffkintz05')?.name, 'AV-JefhKintz05');
  assert.equal(known.get('av-brisket')?.name, 'AV2-Brisket');
  assert.equal(known.get('av-frenchieusa')?.name, 'AV-Frenchie(-4)');
  assert.equal(known.get('av-frenchie2')?.status, 'AV2');
  assert.equal(known.get('av-frenchie(-4)')?.status, 'AV2');
  assert.notEqual(known.get('av-frenchie2'), known.get('av-frenchie(-4)'));
  assert.equal(known.get('av-zolika.x.theboss')?.name, 'AV-Zolika.x.Kira');
  assert.equal(known.get('take.them.out')?.name, 'AV-ColdCreeps');
});

test('Discord polling collects more than 100 newer messages without losing older results', async () => {
  const base = 1100000000000000000n;
  const messages = Array.from({length: 230}, (_, i) => ({
    id:String(base+BigInt(i+1)),content:'UTC+2, Germany',author:{id:String(i+1)}
  }));
  const checkpoint=messages[19].id;
  const oldFetch=global.fetch;
  let pageCount=0;
  try {
    global.fetch=async url => {
      pageCount++;
      const u=new URL(url);
      const before=u.searchParams.get('before');
      const next=messages.filter(m => !before || BigInt(m.id)<BigInt(before))
        .sort((a,b) => BigInt(a.id)>BigInt(b.id)?-1:1).slice(0,100);
      return {ok:true,json:async()=>next};
    };
    const result=await fetchMessages('token','100000000000000000',checkpoint);
    assert.equal(pageCount,3);
    assert.equal(result.length,210);
    assert.equal(result[0].id,messages[20].id);
    assert.equal(result.at(-1).id,messages.at(-1).id);
  } finally {global.fetch=oldFetch;}
});

test('empty UTC channel checkpoint processes its first later submission', () => {
  const empty = {lastMessageId:null,members:[],pending:[]};
  assert.equal(initializeCheckpoint(empty, [], 'false'), true);
  assert.equal(empty.lastMessageId, '0');
  assert.equal(initializeCheckpoint(empty, [], 'false'), false);
  const historical={lastMessageId:null};
  assert.equal(initializeCheckpoint(historical,[{id:'101'},{id:'102'}],'false'),true);
  assert.equal(historical.lastMessageId,'102');
  const backfill={lastMessageId:null};
  assert.equal(initializeCheckpoint(backfill,[{id:'101'}],'true'),false);
  assert.equal(backfill.lastMessageId,null);
});

test('the Council role configured in GitHub Actions matches the leader-confirmed role',()=>{
  const fs=require('node:fs'),path=require('node:path');
  const workflow=fs.readFileSync(path.resolve(__dirname,'../.github/workflows/discord-utc-roster.yml'),'utf8');
  assert.match(workflow,/DISCORD_UTC_CHANNEL_ID:\s*'1422151197317529600'/);
  assert.match(workflow,/DISCORD_UTC_COUNCIL_ROLE_IDS:\s*'1427090799052587038'/);
  assert.equal(COUNCIL_ROLE,'1427090799052587038');
});

test('scheduled Discord polling is disabled until explicit rollout variable is enabled',()=>{
  const fs=require('node:fs'),path=require('node:path');
  const workflow=fs.readFileSync(path.resolve(__dirname,'../.github/workflows/discord-utc-roster.yml'),'utf8');
  assert.match(workflow,/if:\\s*\\$\\{\\{\\s*github\\.event_name == 'workflow_dispatch' \\|\\| vars\\.DISCORD_UTC_SYNC_ENABLED == 'true'\\s*\\}\\}/);
});
