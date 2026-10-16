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
});
const ROLE = '120000000000000001';
const rolePolicy = {trustedRoleIds:[ROLE],verifiedLinks:{}};
const msg = (id,content,name,role=ROLE) => ({
  id:String(1000+Number(id)),timestamp:'2026-10-15T12:00:00Z',
  content,author:{id:String(id),username:'discord_' + id},
  member:{nick:name,roles:role?[role]:[]}
});

test('verified Discord account updates known player without changing clan or game name', () => {
  const known=knownRoster();
  assert.equal(known.get('av-zolika.x.kira')?.name,'AV-Zolika.x.Kira');
  const state={members:[],pending:[]};
  const policy={trustedRoleIds:[ROLE],verifiedLinks:{'15':'AV-Zolika.x.Kira'}};
  reconcile(state,msg(15,'UTC+2, Netherlands','AV-Zolika.x.Kira'),known,'',policy);
  assert.equal(state.members.length,1);
  assert.equal(state.members[0].name,'AV-Zolika.x.Kira');
  assert.equal(state.members[0].status,'Active');
  assert.equal(state.members[0].country,'Netherlands');
  // Subsequent nickname change does not rebind the verified account.
  reconcile(state,msg(15,'UTC+3, Netherlands','NotTheSameNickname'),known,'',policy);
  assert.equal(state.members[0].name,'AV-Zolika.x.Kira');
  assert.equal(state.members[0].utc,3);
});

test('new member with authorized Discord role and explicit name joins the correct clan', () => {
  const state={members:[],pending:[]};
  reconcile(state,msg(12,'Name: AV-NewPlayer\nUTC+5:30, India','AV-NewPlayer'),new Map(),'AV-2',rolePolicy);
  assert.deepEqual([state.members[0].name,state.members[0].status,state.members[0].utc,state.members[0].country],
    ['AV-NewPlayer','AV2',5.5,'India']);
  reconcile(state,msg(12,'UTC+5:45, Nepal','AV-NewPlayer'),new Map(),'AV-2',rolePolicy);
  assert.equal(state.members.length,1);
  assert.equal(state.members[0].utc,5.75);
  assert.equal(state.members[0].country,'Nepal');
});

test('new player without clan cannot be silently assigned', () => {
  const state={members:[],pending:[]};
  reconcile(state,msg(99,'Name: PotentialPlayer\nUTC-4','PotentialPlayer'),new Map(),'',rolePolicy);
  assert.equal(state.members.length,0);
  assert.equal(state.pending[0].reason,'missing_clan');
});

test('one role-approved game name cannot be bound to two separate Discord users', () => {
  const state={members:[],pending:[]};
  for (const id of [1,2]) reconcile(state,msg(id,'Name: AV-Same\nUTC-5, USA\nClan: AVENGERS','AV-Same'),new Map(),'',rolePolicy);
  assert.equal(state.members.length,1);
  assert.equal(state.pending[0].reason,'name_already_linked_to_another_discord_account');
});

test('a claimed existing game nickname requires an admin-verified identity link', () => {
  const known=knownRoster(),state={members:[],pending:[]};
  reconcile(state,msg(345,'Name: AV-HarryBallsagna\nUTC-5, USA','AV-HarryBallsagna'),known,'',rolePolicy);
  assert.equal(state.members.length,0);
  assert.equal(state.pending[0].reason,'existing_identity_requires_verification');
  assert.equal(known.get('av-harryballsagna')?.status,'Active');
});

test('a Discord member lacking the trusted role cannot alter the roster', () => {
  const state={members:[],pending:[]};
  reconcile(state,msg(99,'Name: AV-NewPlayer\nUTC+2, Germany\nClan: AV-2','AV-NewPlayer',null),new Map(),'',rolePolicy);
  assert.equal(state.members.length,0);
  assert.equal(state.pending[0].reason,'untrusted_role');
});

test('a fresh user must explicitly provide game name before automatic admission', () => {
  const state={members:[],pending:[]};
  reconcile(state,msg(99,'UTC+2, Germany\nClan: AV-2','UnverifiedNickname'),new Map(),'',rolePolicy);
  assert.equal(state.members.length,0);
  assert.equal(state.pending[0].reason,'explicit_game_name_required');
});

test('invalid verified mapping remains pending rather than silently creating an account', () => {
  const state={members:[],pending:[]};
  reconcile(state,msg(12,'UTC+2, Germany','RandomNickname'),knownRoster(),'',
    {trustedRoleIds:[ROLE],verifiedLinks:{'12':'AV-DOES-NOT-EXIST'}});
  assert.equal(state.members.length,0);
  assert.equal(state.pending[0].reason,'verified_link_not_in_roster');
});

test('missing onboarding security configuration fails closed', () => {
  const prevRole=process.env.DISCORD_UTC_TRUSTED_ROLE_IDS;
  const prevLinks=process.env.DISCORD_UTC_VERIFIED_LINKS;
  try {
    delete process.env.DISCORD_UTC_TRUSTED_ROLE_IDS;
    assert.throws(()=>onboardingPolicy(),/TRUSTED_ROLE_IDS/);
    process.env.DISCORD_UTC_TRUSTED_ROLE_IDS=ROLE;
    process.env.DISCORD_UTC_VERIFIED_LINKS='{"15":"AV-Zolika.x.Kira"}';
    const policy=onboardingPolicy();
    assert.deepEqual(policy.trustedRoleIds,[ROLE]);
    assert.equal(policy.verifiedLinks['15'],'AV-Zolika.x.Kira');
  } finally {
    if(prevRole===undefined)delete process.env.DISCORD_UTC_TRUSTED_ROLE_IDS;
    else process.env.DISCORD_UTC_TRUSTED_ROLE_IDS=prevRole;
    if(prevLinks===undefined)delete process.env.DISCORD_UTC_VERIFIED_LINKS;
    else process.env.DISCORD_UTC_VERIFIED_LINKS=prevLinks;
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
