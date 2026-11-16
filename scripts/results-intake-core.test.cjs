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
 const first=await scanChannel({¶»§q«^