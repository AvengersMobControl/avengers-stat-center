'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {scanChannel}=require('../server/result-source-intake.cjs');
const {authorized,inIntakeWindow,sweepAll}=require('../api/discord/result-intake.js');
const NOW=Date.parse('2026-11-16T04:30:00Z');
const channel='1425022130717855836',msg='1571646884089438258';
const validTime=new Date(NOW-3600000).toISOString();
function fixture(n,sourceTime=validTime){
 return [{id:msg,timestamp:sourceTime,content:'Final CLAIM',
   attachments:Array.from({length:n},(_,i)=>({
     id:String(1571646880905957510n+BigInt(i)),filename:'original'+i+'.jpg',
     content_type:'image/jpeg',url:'https://cdn.discordapp.com/attachments/'+channel+'/'+String(1571646880905957510n+BigInt(i))+'/original'+i+'.jpg'
   }))}];
}
function store(){
 const state={next_before:null,receipts:new Map(),failures:[],completed:[],released:[]};
 return {state,
   async claim(key,nonce){state.nonce=nonce;return {next_before:state.next_before,resume_upper_id:state.upper||null};},
   async recordMessage(){},
   async find(k,m,a){return state.receipts.get(a)||null;},
   async receipt(r){state.receipts.set(r.attachmentId,{original_sha256:r.originalSha256,byte_length:r.byteLength});},
   async failure(r){state.failures.push(r);},
   async complete(k,n,r){state.next_before=r.nextBefore;state.upper=r.cycleComplete?null:r.upperId;state.completed.push(r);},
   async release(k,n,code){state.released.push(code);}
 };
}
function transport(messages){
 return async(url)=>({ok:true,status:200,json:async()=>messages});
}
const original=async()=>({provenance:'authorized-original-discord-cdn-response',
 imageSha256:'a'.repeat(64),byteLength:123,contentType:'image/jpeg'});
test('entire ten-image final post is accounted; no eight-image cap',async()=>{
 const s=store();
 const r=await scanChannel({channelKey:'piggy',store:s,token:'test',nowMs:NOW,
   fetchImpl:transport(fixture(10)),downloadOriginal:original});
 assert.equal(r.attachmentsAccounted,10);assert.equal(r.newOriginalProofs,10);
 assert.equal(s.state.receipts.size,10);assert.equal(r.publication,'not-attempted');
 assert.equal(r.cycleComplete,true);
});
test('source-only proof never advances cursor after one original download fails',async()=>{
 const s=store();let count=0;
 await assert.rejects(scanChannel({channelKey:'piggy',store:s,token:'test',nowMs:NOW,
   fetchImpl:transport(fixture(9)),downloadOriginal:async()=>{
     count++;if(count===9)throw Error('HTTP 403 expired original');
     return original();
   }}),/Original-byte proof failed/);
 assert.equal(s.state.completed.length,0);
 assert.equal(s.state.receipts.size,8);
 assert.equal(s.state.failures.length,1);
 assert.equal(s.state.released.length,1);
 count=0;
 const r=await scanChannel({channelKey:'piggy',store:s,token:'test',nowMs:NOW,
   fetchImpl:transport(fixture(9)),downloadOriginal:async()=>{count++;return original();}});
 assert.equal(count,1);assert.equal(r.existingOriginalProofs,8);
 assert.equal(r.newOriginalProofs,1);assert.equal(s.state.receipts.size,9);
});
test('incremental private cursor resumes without re-fetching previous page',async()=>{
 const s=store();
 const pages=[Array.from({length:5},(_,i)=>({id:String(1571646884089438258n-BigInt(i)),timestamp:validTime,attachments:[]})),
   [{id:'1571646884089438250',timestamp:new Date(NOW-10*86400000).toISOString(),attachments:[]}]];
 let step=0,seen=[];
 const fetchImpl=async(url)=>{seen.push(url);return transport(pages[step++])(url);};
 const opts={channelKey:'piggy',store:s,token:'test',nowMs:NOW,fetchImpl,downloadOriginal:original,maxMessages:5};
 const a=await scanChannel(opts);
 assert.equal(a.nextPagePending,true);assert.equal(s.state.next_before,'1571646884089438254');
 const b=await scanChannel(opts);
 assert.equal(b.cycleComplete,true);assert.equal(s.state.next_before,null);
 assert.match(seen[1],/before=1571646884089438254/);
});
test('private endpoint rejects invalid or unconfigured authorization',()=>{
 assert.equal(authorized('Bearer valid','valid'),true);
 assert.equal(authorized('Bearer invalid','valid'),false);
 assert.equal(authorized('Bearer valid',null),false);
});

test('Neon JSONB summary parameters carry explicit SQL types',()=>{
  const src=require('node:fs').readFileSync(require('node:path').join(__dirname,'../server/result-source-store.cjs'),'utf8');
  for(const cast of ['$2::text','$3::text','$4::boolean','$5::integer','$6::integer'])assert(src.includes(cast),'missing JSONB parameter cast '+cast);
  assert(!src.includes("\\'channel\\',$2)"),'variadic JSONB call cannot infer an untyped channel parameter');
});

test('scheduled intake only runs Sunday 6 PM and Friday 7 AM Chicago, across DST',()=>{
  assert.equal(inIntakeWindow(Date.parse('2026-11-23T00:00:00Z')),true);  // Sun 6:00 PM CST
  assert.equal(inIntakeWindow(Date.parse('2026-11-22T23:40:00Z')),false); // Sun 5:40 PM CST
  assert.equal(inIntakeWindow(Date.parse('2026-11-20T13:20:00Z')),true);  // Fri 7:20 AM CST
  assert.equal(inIntakeWindow(Date.parse('2026-11-20T12:20:00Z')),false); // Fri 6:20 AM CST
  assert.equal(inIntakeWindow(Date.parse('2027-06-06T23:00:00Z')),true);  // Sun 6:00 PM CDT
  assert.equal(inIntakeWindow(Date.parse('2027-06-04T12:40:00Z')),true);  // Fri 7:40 AM CDT
  assert.equal(inIntakeWindow(Date.parse('2027-06-07T00:00:00Z')),false); // Sun 7:00 PM CDT
  assert.equal(inIntakeWindow(Date.parse('2026-11-18T13:00:00Z')),false); // Wednesday
});
test('sweep reads every channel to the end of its window, page after page',async()=>{
  const calls={};
  const scan=async({channelKey})=>{calls[channelKey]=(calls[channelKey]||0)+1;
    return {status:'source-captured',cycleComplete:calls[channelKey]>=3,newOriginalProofs:1,attachmentsAccounted:1};};
  const r=await sweepAll({keys:['a','b'],scan,deadline:Date.now()+60000});
  assert.deepEqual(calls,{a:3,b:3});assert.equal(r.complete,true);assert.equal(r.newOriginalProofs,6);
});
test('sweep stops at the deadline and reports what is left',async()=>{
  const r=await sweepAll({keys:['a','b'],scan:async()=>({status:'source-captured',cycleComplete:false}),deadline:Date.now()-1});
  assert.equal(r.complete,false);assert.deepEqual(r.unfinished,['a','b']);
});
