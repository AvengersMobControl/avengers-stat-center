'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {verifyDiscordUrl,retrieveOriginal}=require('./fetch-original-discord-image.cjs');
const channelId='1548892164355006524',attachmentId='1560564518948446318';
const base='https://cdn.discordapp.com/attachments/'+channelId+'/'+attachmentId+'/Screenshot_result.jpg';
const query='?ex=6ad3d537&is=6ad283b7&hm='+('a'.repeat(64));
const url=base+query;
const jpeg=Buffer.from([0xff,0xd8,0xff,0xe0,0x00,0x10,0x4a,0x46,0x49,0x46,0,0]);
const opts={channelId,attachmentId,expectedContentType:'image/jpeg'};
function okResponse(bytes=jpeg,headers={}){
 return new Response(bytes,{status:200,headers:{'content-type':'image/jpeg',
   'content-length':String(bytes.length),...headers}});
}
test('retrieves exact authorized CDN bytes without exposing channel, signed URL, or message IDs',async()=>{
 let count=0;
 const r=await retrieveOriginal({...opts,url,fetchImpl:async(input,init)=>{
   count++;assert.equal(input,url);
   assert.equal(init.redirect,'manual');
   assert.equal(init.method,'GET');
   assert.equal(init.headers['Accept-Encoding'],'identity');
   return okResponse();
 }});
 assert.equal(count,1);
 assert.equal(r.imageSha256,crypto.createHash('sha256').update(jpeg).digest('hex'));
 assert.equal(r.byteLength,jpeg.length);
 assert.equal(r.contentType,'image/jpeg');
 assert.equal(r.provenance,'authorized-original-discord-cdn-response');
 assert.equal(r.approved,false);
 assert.equal(r.verifiedFinal,false);
 const out=JSON.stringify(r);
 assert(!out.includes('discord')||out.includes('authorized-original-discord-cdn-response'));
 assert(!out.includes(attachmentId)&&!out.includes(channelId)&&!out.includes('hm='));
});
test('rejects redirected, modified, mismatched, credentialed or unsafe URLs before fetch',async()=>{
 let called=0;
 const fetchImpl=async()=>{called++;return okResponse();};
 const bad=[
 url.replace('cdn.discordapp.com','cdn.discordapp.com.evil.example'),
 url.replace('https://','http://'),
 url.replace(attachmentId,'1234567890000000000'),
 url.replace(channelId,'1234567890000000000'),
 url+'&width=640',
 url+'&format=webp',
 url.replace('https://','https://example@'),
 url.replace('/attachments/','/ephemeral-attachments/'),
 url.replace('Screenshot_result.jpg','../../private.jpg'),
 url.replace('Screenshot_result.jpg','Screenshot_result.webp'),
 base+'?ex=6ad3d537',
 base+'?ex=6ad3d537&is=6ad283b7&hm=nope',
 url+'&hm='+('a'.repeat(64)),
 ];
 for(const value of bad)await assert.rejects(
   retrieveOriginal({...opts,url:value,fetchImpl}),/attachment|Discord|Only|query|image type|extension|signature|filename/i,value);
 assert.equal(called,0,'invalid signed URLs cannot trigger outbound network requests');
});
test('validates HTTP 200 and explicitly declines redirects and unauthorized results',async()=>{
 for(const status of [302,403,404,429,500]){
   await assert.rejects(retrieveOriginal({...opts,url,fetchImpl:async()=>new Response(null,{status,headers:{location:'https://evil.example/'}})}),
     /unavailable|redirected|not 200/);
 }
});
test('rejects MIME transformation and gzip encoding even if attachment path is JPEG',async()=>{
 await assert.rejects(retrieveOriginal({...opts,url,fetchImpl:async()=>okResponse(jpeg,{'content-type':'image/webp'})}),
   /different image content type/);
 await assert.rejects(retrieveOriginal({...opts,url,fetchImpl:async()=>okResponse(jpeg,{'content-encoding':'gzip'})}),
   /Compressed\/transformed/);
 await assert.rejects(retrieveOriginal({...opts,url,fetchImpl:async()=>okResponse(Buffer.from('not-a-jpeg'))}),
   /Invalid image file signature/);
});
test('detects truncated response and oversize header before accepting checksum',async()=>{
 await assert.rejects(retrieveOriginal({...opts,url,fetchImpl:async()=>okResponse(jpeg,{'content-length':'9999'})}),
   /Incomplete original attachment/);
 await assert.rejects(retrieveOriginal({...opts,url,fetchImpl:async()=>okResponse(jpeg,{'content-length':String(25*1024*1024+1)})}),
   /size limit/);
});
test('fetch network failures conceal signed URL and do not approve any update',async()=>{
 const hidden='token-in-private-CDN-signed-URL';
 await assert.rejects(retrieveOriginal({...opts,url,fetchImpl:async()=>{throw Error(hidden)}}),e=>{
   assert(!String(e).includes(hidden));
   assert(!String(e).includes(url));
   return /could not be retrieved/.test(String(e));
 });
});
test('rejects invalid content type and malformed source IDs',()=>{
 for(const wrong of [
   {...opts,channelId:'../../etc/passwd'},
   {...opts,attachmentId:'155'},
   {...opts,expectedContentType:'image/webp'},
 ])assert.throws(()=>verifyDiscordUrl(url,wrong));
});
