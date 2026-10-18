'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {makeAuthenticatedReadback}=require('./private-discord-authenticated-readback.cjs');
const chan='111111111111111111',msg='222222222222222222',bot='333333333333333333';
const CDN='https://cdn.discordapp.com/attachments/'+chan+'/'+msg+'/approved.png?ex=signed';
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.from('mock PNG body')]);
const metadata=(patch={})=>({...{id:msg,channel_id:chan,author:{id:bot},
 attachments:[{filename:'approved.png',content_type:'image/png',size:png.length,url:CDN}]},...patch});
const json=x=>new Response(JSON.stringify(x),{status:200,headers:{'content-type':'application/json'}});
const picture=x=>new Response(x,{status:200,headers:{'content-type':'image/png'}});
const opts=(fetchImpl)=>({botToken:'private-token-not-output',expectedBotId:bot,
 allowedChannelIds:[chan],fetchImpl});
test('one real-original CDN GET follows authenticated Discord API metadata, never sends/deletes',async()=>{
 const calls=[];
 const fetchImpl=async (url,options)=>{
  calls.push({url,options});
  return calls.length===1?json(metadata()):picture(png);
 };
 const readback=makeAuthenticatedReadback(opts(fetchImpl));
 const proof=await readback({channelId:chan,messageId:msg});
 assert.equal(proof.channelId,chan);
 assert.equal(proof.messageId,msg);
 assert.equal(proof.contentType,'image/png');
 assert(proof.attachmentBytes.equals(png));
 assert.equal(calls.length,2);
 assert(calls[0].url.startsWith('https://discord.com/api/v10/channels/'));
 assert.equal(calls[0].options.headers.Authorization,'Bot private-token-not-output');
 assert.equal(calls[1].url,CDN);
 assert.equal(calls[1].options.headers.Authorization,undefined);
 assert(calls.every(x=>x.options.method==='GET'&&x.options.redirect==='error'));
});
test('unknown channels and malformed IDs blocked before any network operation',async()=>{
 let count=0;
 const readback=makeAuthenticatedReadback(opts(async()=>{count++;throw Error('network called')}));
 for(const data of [{channelId:'999999999999999999',messageId:msg},
 {channelId:chan,messageId:'bad'}, {channelId:chan,messageId:'222'}]){
  await assert.rejects(readback(data),/blocked/);
 }
 assert.equal(count,0);
});
test('wrong bot author, message ID or channel identity fails closed without CDN retrieval',async()=>{
 for(const patch of [{author:{id:'999999999999999999'}},{id:'555555555555555555'},
   {channel_id:'888888888888888888'}, {attachments:[]}]){
  let n=0;const readback=makeAuthenticatedReadback(opts(async()=>{n++;return json(metadata(patch));}));
  await assert.rejects(readback({channelId:chan,messageId:msg}),/blocked/);
  assert.equal(n,1);
 }
});
test('signed-URL SSRF, nonpng, over-limit attachment and duplicate PNG are rejected',async()=>{
 for(const changed of [
  {url:'https://cdn.discordapp.com.evil.invalid/attachments/'+chan+'/'+msg+'/wrong.png'},
  {url:'http://cdn.discordapp.com/attachments/'+chan+'/'+msg+'/wrong.png'},
  {url:'https://evil.invalid/attachments/'+chan+'/'+msg+'/wrong.png'},
  {url:'https://cdn.discordapp.com/@evil'},
  {content_type:'image/webp'}, {size:26*1024*1024}
 ]){
  let n=0;const readback=makeAuthenticatedReadback(opts(async()=>{
   n++;return json(metadata({attachments:[{...metadata().attachments[0],...changed}]}));
  }));
  await assert.rejects(readback({channelId:chan,messageId:msg}),/blocked/);
  assert.equal(n,1);
 }
 const readback=makeAuthenticatedReadback(opts(async()=>json(metadata({
  attachments:[metadata().attachments[0],metadata().attachments[0]]}))));
 await assert.rejects(readback({channelId:chan,messageId:msg}),/blocked/);
});
test('PNG content bytes, declared attachment size, response MIME and redirects must all match',async()=>{
 const badResponses=[
  picture(Buffer.concat([png,Buffer.from('extra')])),
  picture(Buffer.from('not a PNG but same bounds')),
  new Response(png,{status:200,headers:{'content-type':'image/webp'}}),
  new Response(null,{status:302,headers:{'location':'https://evil.invalid/'}})
 ];
 for(const response of badResponses){
  let n=0;const readback=makeAuthenticatedReadback(opts(async()=>{
   n++;return n===1?json(metadata()):response;
  }));
  await assert.rejects(readback({channelId:chan,messageId:msg}),/blocked/);
 }
});
test('unexpected JSON, oversized HTTP payloads, API errors and secret-bearing exceptions are redacted',async()=>{
 const variants=[
  async()=>new Response('nope',{status:500,headers:{'content-type':'application/json'}}),
  async()=>new Response('not JSON',{status:200,headers:{'content-type':'application/json'}}),
  async()=>new Response('x'.repeat(65540),{status:200,headers:{'content-type':'application/json'}}),
  async()=>{throw Error('private-token-not-output https://cdn.discordapp.com/private-link')}
 ];
 for(const remote of variants){
  const readback=makeAuthenticatedReadback(opts(remote));let error;
  try{await readback({channelId:chan,messageId:msg})}catch(e){error=e}
  assert(error);
  assert.match(error.message,/blocked/);
  assert(!error.message.includes('private-token-not-output'));
  assert(!error.message.includes('private-link'));
 }
});
test('requires explicit caller-supplied protected bot token, own ID and allowlisted channels',()=>{
 for(const changes of [{botToken:''},{botToken:'Bot already-prefixed'}, {expectedBotId:'invalid'},
   {allowedChannelIds:[]},{allowedChannelIds:['not snowflake']},{fetchImpl:null}]){
  assert.throws(()=>makeAuthenticatedReadback({...opts(async()=>{}),...changes}),/blocked/);
 }
 const s=fs.readFileSync(__dirname+'/private-discord-authenticated-readback.cjs','utf8');
 assert.doesNotMatch(s,/method:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/);
 assert.doesNotMatch(s,/process\.env|createServer|listen\(/);
});
