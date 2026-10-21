'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const {backfillPage}=require('../server/discord-guide-backfill.cjs');
const guild='1403361698177618081', channel='1403363097111953428';
const other='1425047062319468655';
const env={DISCORD_GUILD_ID:guild,DISCORD_BOT_TOKEN:'fake-test-only-token',
  AVENGERS_GUIDE_CHANNELS_JSON:JSON.stringify({[channel]:{since:null,priority:'primary'}})};
const message=(id,content='Good tip')=>({
  id:String(id),timestamp:'2026-10-20T15:00:00.000Z',
  content,author:{id:'1555555555555555555',username:'TestPlayer'},attachments:[]
});
const response=v=>({status:200,ok:true,json:async()=>v,headers:{get:()=>null}});
function fakeFetch(messages,channelData={id:channel,guild_id:guild,type:0},status=null){
  const called=[];
  const fn=async (url)=>{
    called.push(url);
    if(status===429)return {status:429,ok:false,json:async()=>({retry_after:2}),headers:{get:()=>null}};
    if(url.endsWith('/channels/'+channel))return response(channelData);
    if(url.includes('/messages?'))return response(messages);
    throw Error('Unexpected request '+url);
  };
  fn.called=called;
  return fn;
}
function store(cursor=null,finished=false){
  const got={saved:null};
  got.state=async()=>({next_before_message_id:cursor,finished});
  got.save=async payload=>{got.saved=payload;return {saved:payload.rows.length};};
  return got;
}

test('full history page collects text and source metadata without publishing it in response',async()=>{
  const messages=[message('1555555555555555559','Recommended champion loadout combo for return attacks'),
    message('1555555555555555558','Not a tactic')];
  const privateStore=store();
  const r=await backfillPage(channel,env,privateStore,fakeFetch(messages));
  assert.equal(r.status,200);
  assert.equal(r.saved,2);
  assert.equal(r.finished,true);
  assert.equal(privateStore.saved.rows[0].author.name,'TestPlayer');
  assert.equal(privateStore.saved.rows[0].url,
    'https://discord.com/channels/'+guild+'/'+channel+'/1555555555555555559');
  assert.deepEqual(privateStore.saved.rows[0].tags,['loadouts','returnAttacks','technique']);
  assert.equal(JSON.stringify(r).includes('Recommended'),false);
});

test('100-message page retains oldest cursor and can be resumed',async()=>{
  const arr=Array.from({length:100},(_,i)=>message(String(BigInt('1555555555555555999')-BigInt(i))));
  const privateStore=store();
  const r=await backfillPage(channel,env,privateStore,fakeFetch(arr));
  assert.equal(r.status,200);
  assert.equal(r.scanned,100);
  assert.equal(r.finished,false);
  assert.equal(privateStore.saved.nextCursor,arr.at(-1).id);
});

test('cutoff drops earlier rows and finalizes page without phantom zero scores',async()=>{
  const scoped={...env,AVENGERS_GUIDE_CHANNELS_JSON:JSON.stringify({
    [channel]:{since:'2026-07-21T05:00:00Z',priority:'primary'}})};
  const a=message('1555555555555555559');
  const b={...message('1555555555555555558'),timestamp:'2026-07-20T12:00:00Z'};
  const privateStore=store();
  const r=await backfillPage(channel,scoped,privateStore,fakeFetch([a,b]));
  assert.equal(r.saved,1);
  assert.equal(r.cutoffReached,true);
  assert.equal(privateStore.saved.finished,true);
  assert.equal(privateStore.saved.rows[0].id,a.id);
});

test('wrong guild or unapproved channel never reads messages or saves',async()=>{
  const outside=fakeFetch([],{id:channel,guild_id:other,type:0});
  const r=await backfillPage(channel,env,store(),outside);
  assert.equal(r.status,403);
  assert.equal(outside.called.length,1);
  const no=await backfillPage(other,env,store(),fakeFetch([]));
  assert.equal(no.status,403);
});

test('Discord 429 returns retry instead of saving false completion',async()=>{
  const fake=fakeFetch([],undefined,429);
  const s=store();
  const r=await backfillPage(channel,env,s,fake);
  assert.equal(r.status,429);
  assert.equal(r.retryAfterMs,2000);
  assert.equal(s.saved,null);
});

test('completed private cursor does not re-read or modify Discord history',async()=>{
  const fake=fakeFetch([]);
  const s=store(null,true);
  const r=await backfillPage(channel,env,s,fake);
  assert.equal(r.finished,true);
  assert.equal(r.saved,0);
  assert.equal(fake.called.length,1);
});

test('invalid Discord timestamps cannot advance private cursor',async()=>{
  const s=store();
  const bad={...message('1555555555555555559'),timestamp:'bad'};
  const r=await backfillPage(channel,env,s,fakeFetch([bad]));
  assert.equal(r.status,502);
  assert.equal(s.saved,null);
});
