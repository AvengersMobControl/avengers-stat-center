'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {scanChannel,sourceMessage,verifyPending,errorCode}=require('../server/results-intake-core.cjs');
const CH='1425022130717855836';
const msg=(id,att=1,ts='2026-11-15T23:00:00.000Z')=>({
 id:String(id),timestamp:ts,content:'FINAL CLAIM',
 attachments:Array.from({length:att},(_,i)=>({
   id:String(BigInt(id)*100n+BigInt(i+1)),filename:'result'+i+'.png',
   content_type:'image/png',size:12
 }))
});
function fakeStore(state={}){
 const pages=[],checkpoints=[];
 return {
  pages,checkpoints,
  async getCheckpoint(){return state;},
  async savePage(_key,p){pages.push(p);},
  async putCheckpoint(_key,s){checkpoints.push(s);state=s;}
 };
}
test('full Discord REST post preserves every one of nine attachments (no 8-image slice)',()=>{
 const s=sourceMessage('piggy',msg('1571656925819707432',9));
 assert.equal(s.attachmentCountTotal,9);
 assert.equal(s.attachments.length,9);
 assert.equal(new Set(s.attachments.map(a=>a.attachmentId)).size,9);
 assert.equal(s.imageCount,9);
});
test('continuation stores page before advancing checkpoint and recovers older pages',async()=>{
 const a=msg('1571656925819707442',3),b=msg('1571656925819707441',9),
   c=msg('1571656925819707440',2),d=msg('1571656925819707439');
 const store=fakeStore(),calls=[];
 const discord={async listMessages(_channel,{before}){
   calls.push(before);
   return !before?[a,b]:(before===b.id?[c,d]:[]);
 }};
 const first=await scanChannel({channelKey:'piggy',channelId:CH,store,discord,
   nowMs:Date.parse('2026-11-16T00:00:00Z'),maxPages:1,pageSize:2});
 assert.equal(first.complete,false);
 assert.equal(first.attachments,12);
 assert.equal(store.checkpoints[0].resumeBeforeId,b.id);
 const second=await scanChannel({channelKey:'piggy',channelId:CH,store,discord,
   nowMs:Date.parse('2026-11-16T00:00:00Z'),maxPages:2,pageSize:2});
 assert.equal(second.complete,true);
 assert.equal(store.checkpoints[1].lastCompletedId,a.id);
 assert.equal(store.checkpoints[1].resumeBeforeId,null);
 assert.deepEqual(calls,[null,b.id,d.id]);
 assert.equal(store.pages.flat().reduce((n,m)=>n+m.attachments.length,0),15);
});
test('a failed page does not checkpoint beyond persisted source coverage',async()=>{
 const store=fakeStore(),discord={async listMessages(){return [msg('1571656925819707442')]}};
 store.savePage=async()=>{throw Error('db_down')};
 await assert.rejects(scanChannel({channelKey:'piggy',channelId:CH,store,discord,
   pageSize:100}),/db_down/);
 assert.equal(store.checkpoints.length,0);
});
test('a true old boundary completes instead of endlessly rescanning',async()=>{
 const store=fakeStore({lastCompletedId:'1571656925819707440'});
 const discord={async listMessages(){return [msg('1571656925819707442'),msg('1571656925819707440')]}};
 const r=await scanChannel({channelKey:'piggy',channelId:CH,store,discord,pageSize:100});
 assert.equal(r.complete,true);
 assert.equal(store.pages.flat().length,1);
});
test('original CDN response is hashed and bound to exact attachment IDs',async()=>{
 const id='1571656925819707442',a='157165692581970744201',body=Buffer.from([
   137,80,78,71,13,10,26,10,0,0,0,0]);
 let verified=null;
 const store={
  async listPending(){return [{channelKey:'piggy',channelId:CH,messageId:id,
    attachmentId:a,contentType:'image/png'}]},
  async markVerified(_row,p){verified=p},
  async markRetry(){throw Error('unexpected retry')}
 };
 const discord={async getMessage(){return {attachments:[{id:a,url:
   'https://cdn.discordapp.com/attachments/'+CH+'/'+a+'/test.png'}]}}};
 const result=await verifyPending({store,discord,limit:1,http:async()=>new Response(body,{
   status:200,headers:{'Content-Type':'image/png','Content-Length':String(body.length)}
 })});
 assert.deepEqual(result,{attempted:1,verified:1,failed:0});
 assert.match(verified.imageSha256,/^[a-f0-9]{64}$/);
 assert.equal(verified.verifiedFinal,false);
 assert.equal(verified.approved,false);
});
test('unavailable original is a queued proof exception, not a verified source',async()=>{
 let reason=null;
 const store={
  async listPending(){return [{channelKey:'piggy',channelId:CH,messageId:'1571656925819707442',
    attachmentId:'157165692581970744201',contentType:'image/png'}]},
  async markRetry(_row,x){reason=x},
  async markVerified(){throw Error('must not verify')}
 };
 const discord={async getMessage(){return {attachments:[]}}};
 const out=await verifyPending({store,discord,limit:1});
 assert.equal(out.failed,1);
 assert.equal(reason,'source_proof_failed');
 assert.equal(errorCode(new Error('discord_http_429')),'discord_rate_limited');
});
