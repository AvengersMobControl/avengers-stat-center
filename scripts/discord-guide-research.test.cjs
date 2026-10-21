'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const test=require('node:test');
const {
  signedMember,bearerAuthorized,normalizeMessage,researchHandler
}=require('../server/discord-guide-research.cjs');

const GUILD='1403361698177618081';
const CHANNEL='1425022685636722809';
const USER='1403361698177618082';
const OTHER='1403361698177618083';
const ROLE='1403361698177618084';
const SECRET='unit-test-secret-at-least-sixteen';
const TOKEN='do-not-log-this-discord-bot-token';
const env={
  AUTH_SECRET:SECRET,DISCORD_GUILD_ID:GUILD,DISCORD_BOT_TOKEN:TOKEN,
  AVENGERS_GUIDE_COUNCIL_ROLE_IDS:ROLE,
  AVENGERS_GUIDE_RESEARCH_SECRET:'some-long-private-service-token-that-is-only-in-env'
};
function session(extra={}) {
  const payload={sub:USER,exp:Math.floor(Date.now()/1000)+120,...extra};
  const body=Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig=crypto.createHmac('sha256',SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}
function req(body={},options={}) {
  return {method:'POST',body,headers:{host:'avengers-stat-center.vercel.app',
    cookie:`avengers_session=${session(options.session||{})}`,...options.headers}};
}
function res() {
  return {statusCode:0,headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v;return this;},
    status(code){this.statusCode=code;return this;},send(value){this.body=JSON.parse(value);return this;}};
}
function ok(value) {return {ok:true,status:200,json:async()=>value};}
function route(url) {
  if(url.endsWith(`/members/${USER}`))return ok({roles:[ROLE]});
  if(url.endsWith(`/members/${OTHER}`))return ok({roles:[]});
  if(url.endsWith(`/channels/${CHANNEL}`))return ok({id:CHANNEL,guild_id:GUILD,type:0});
  if(url.includes(`/channels/${CHANNEL}/messages?`))return ok([{
    id:'1555555555555555555',timestamp:'2026-10-20T12:34:56.000Z',content:'My recommended setup for return attacks',
    author:{id:USER,username:'Example'},attachments:[],message_reference:{message_id:'1555555555555555554'}
  }]);
  if(url.endsWith(`/guilds/${GUILD}/channels`))return ok([
    {id:CHANNEL,name:'discussion',type:0,parent_id:null},
    {id:OTHER,name:'voice',type:2}
  ]);
  if(url.endsWith(`/guilds/${GUILD}/threads/active`))return ok({threads:[
    {id:OTHER,name:'Attack suggestions',parent_id:CHANNEL,guild_id:GUILD},
    {id:'1555555555555555556',name:'Wrong guild',parent_id:CHANNEL,guild_id:'1555555555555555557'}
  ]});
  throw new Error('Unexpected test URL: '+url);
}
async function call(request,fetchImpl=route,configuredEnv=env) {
  const response=res();
  await researchHandler(request,response,configuredEnv,fetchImpl);
  return response;
}

test('signed session rejects fake, expired, temporary and permanent guests',()=>{
  assert.equal(signedMember(req({}, {headers:{cookie:''}}),SECRET),null);
  assert.equal(signedMember(req({}, {session:{exp:1}}),SECRET),null);
  assert.equal(signedMember(req({}, {session:{guest:true}}),SECRET),null);
  assert.equal(signedMember(req({}, {session:{guest:true,permanentGuest:true,exp:null}}),SECRET),null);
  assert.equal(signedMember(req({}, {session:{permanentGuest:true}}),SECRET),null);
  assert.equal(signedMember(req({}, {headers:{cookie:`avengers_session=${session()}x`}}),SECRET),null);
  assert.equal(signedMember(req(),SECRET).sub,USER);
});

test('bearer client needs configured long secret and exact constant-time match',()=>{
  assert.equal(bearerAuthorized(req({}, {headers:{authorization:`Bearer ${env.AVENGERS_GUIDE_RESEARCH_SECRET}`}}),env.AVENGERS_GUIDE_RESEARCH_SECRET),true);
  assert.equal(bearerAuthorized(req({}, {headers:{authorization:'Bearer wrong'}}),env.AVENGERS_GUIDE_RESEARCH_SECRET),false);
  assert.equal(bearerAuthorized(req({}, {headers:{authorization:'Bearer ab'}}),'ab'),false);
});

test('anonymous and guest requests return no channels or source text',async()=>{
  for(const options of [{headers:{cookie:''}},{session:{guest:true}},{session:{guest:true,permanentGuest:true}}]) {
    const response=await call(req({action:'channels'},options),()=>{throw Error('must not call Discord');});
    assert.equal(response.statusCode,401);
    assert.ok(!JSON.stringify(response.body).includes('discussion'));
    assert.equal(response.headers['cache-control'],'private, no-store, max-age=0');
  }
});

test('cross-origin request denied before Discord is called',async()=>{
  const response=await call(req({action:'channels'},{headers:{origin:'https://attacker.example'}}),()=>{throw Error('must not call Discord');});
  assert.equal(response.statusCode,403);
});

test('authenticated non-reviewer is denied',async()=>{
  const response=await call(req({action:'channels'}),url=>{
    if(url.includes('/members/')) return ok({roles:[]});
    throw Error('must not list guild channels');
  });
  assert.equal(response.statusCode,403);
});

test('current membership is required even for an otherwise signed reviewer',async()=>{
  const response=await call(req({action:'channels'}),async()=>({ok:false,status:404}));
  assert.equal(response.statusCode,403);
});

test('lists only relevant text/announcement/forum channels, with no message content',async()=>{
  const response=await call(req({action:'channels'}));
  assert.equal(response.statusCode,200);
  assert.equal(response.body.channels.length,1);
  assert.equal(response.body.channels[0].name,'discussion');
  assert.equal(response.body.hasMessageContents,false);
});

test('active thread discovery is confined to configured guild',async()=>{
  const response=await call(req({action:'activeThreads'}));
  assert.equal(response.statusCode,200);
  assert.equal(response.body.threads.length,1);
  assert.equal(response.body.threads[0].name,'Attack suggestions');
});

test('message history preserves source provenance, reply and tentative tags',async()=>{
  const response=await call(req({action:'history',channelId:CHANNEL}));
  assert.equal(response.statusCode,200);
  assert.equal(response.body.messages.length,1);
  assert.equal(response.body.messages[0].replyToId,'1555555555555555554');
  assert.deepEqual(response.body.messages[0].tags,['loadouts','returnAttacks','technique']);
  assert.equal(response.body.messages[0].url,`https://discord.com/channels/${GUILD}/${CHANNEL}/1555555555555555555`);
  assert.equal(response.body.messages[0].relevant,true);
  assert.equal(response.body.hasMore,false);
  assert.ok(!JSON.stringify(response.body).includes(TOKEN));
});

test('rejects other-guild channel, invalid cursor and unrecognized action',async()=>{
  const external=async url=>url.includes('/members/')?ok({roles:[ROLE]}):ok({guild_id:OTHER,type:0});
  assert.equal((await call(req({action:'history',channelId:CHANNEL}),external)).statusCode,403);
  assert.equal((await call(req({action:'history',channelId:CHANNEL,beforeMessageId:'bogus'}))).statusCode,400);
  assert.equal((await call(req({action:'wipeDatabase'}))).statusCode,400);
});

test('Discord rate limit becomes bounded retry hint and does not re-fetch',async()=>{
  let calls=0;
  const response=await call(req({action:'channels'}),async url=>{
    calls++;
    if(url.includes('/members/'))return ok({roles:[ROLE]});
    return {status:429,headers:{get:()=>null},json:async()=>({retry_after:2.5})};
  });
  assert.equal(response.statusCode,429);
  assert.equal(response.body.retryAfterMs,2500);
  assert.equal(calls,2);
});

test('normalizer does not manufacture a verified recommendation',()=>{
  const m=normalizeMessage({id:'1555555555555555555',content:'Kraken',author:{id:USER}},GUILD,CHANNEL);
  assert.equal(m.relevant,false);
  assert.deepEqual(m.tags,['events']);
});
