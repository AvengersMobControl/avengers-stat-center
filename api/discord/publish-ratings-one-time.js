'use strict';
/**
 * One-time leader-authorized AVENGERS 100-player ratings announcement.
 * Exact SHA-pinned image, fixed channel, expiring token, duplicate precheck,
 * Discord message and attachment readback. No automatic schedule.
 */
const {createHash,timingSafeEqual}=require('node:crypto');
const HASH='7af8c9f0d2b9f55d0959c9258f25a88eadd2c62f21a76d57e8c83d55858287b2';
const NAME='AVENGERS_Player_Power_Ratings_100_Crowns_November_17_2026_DISCORD.png';
const CHANNEL='1470175579058999386';
const MARKER='AVENGERS PLAYER POWER RATINGS UPDATE • November 17, 2026';
const text=['@everyone','','👑 **'+MARKER+'**','','The updated **100-player Power Ratings** are here, with gold and silver crowns for the leaders in all 11 performance metrics.','','🥇 **Gold Crowns:** +0.100 on standard metrics, +0.050 on Flash metrics.',
'🥈 **Silver Crowns:** +0.050 on standard metrics, +0.025 on Flash metrics.','','**Current Top Three**','🥇 AV-INTEN — **10.400**','🥈 AV-Addicted — **10.150**','🥉 AV-HarryBallsagna — **10.125**',
'','The original 10-point formula has not changed. Crowns reward actual first- and second-place performances; the adjusted score adds those bonuses separately. Average-based crowns require at least three qualifying results; ties share the same crown placement.','','The poster includes 49 active AVENGERS, 32 AV-2 members, and 19 selected alumni, retaining the approved 100-player format.','','https://avengersmobcontrol.github.io/avengers-stat-center/'].join('\n');
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=(res,status,body)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));};
const auth=(provided,expected)=>{if(!/^[a-f0-9]{64}$/.test(expected||'')||!/^[a-f0-9]{64}$/.test(provided||''))return false;return timingSafeEqual(Buffer.from(provided),Buffer.from(expected));};
async function discord(path,init={}){const r=await fetch('https://discord.com/api/v10'+path,{...init,headers:{Authorization:'Bot '+process.env.DISCORD_BOT_TOKEN,'User-Agent':'AVENGERS-Ratings-One-Time/1.0',...(init.headers||{})},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Discord '+r.status);return r.json();}
module.exports=async(req,res)=>{
 if(req.method!=='POST')return json(res,405,{ok:false});
 if(process.env.VERCEL_ENV!=='production'||!process.env.DISCORD_BOT_TOKEN||process.env.AVENGERS_DISCORD_SUMMARY_CHANNEL_ID!==CHANNEL)return json(res,503,{ok:false,reason:'not configured'});
 if(!(Date.now()<Date.parse(process.env.AVENGERS_RATINGS_SEND_EXPIRES_UTC||'')))return json(res,403,{ok:false,reason:'expired'});
 const token=String(req.headers['x-avengers-once-token']||'');
 if(!auth(sha(token),process.env.AVENGERS_RATINGS_SEND_SHA256))return json(res,403,{ok:false,reason:'unauthorized'});
 const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
 if(!['preflight','send'].includes(body.action)||typeof body.imageUrl!=='string')return json(res,400,{ok:false});
 let uri;
 try{uri=new URL(body.imageUrl);if(uri.protocol!=='https:'||uri.hostname!=='sdmntpreastus3.oaiusercontent.com'||!uri.pathname.startsWith('/files/'))throw Error('Invalid image source');}
 catch{return json(res,400,{ok:false,reason:'invalid image location'});}
 try{
  const recent=await discord('/channels/'+CHANNEL+'/messages?limit=100');
  const found=recent.find(x=>String(x.content||'').includes(MARKER));
  if(found)return json(res,409,{ok:false,reason:'already posted',channelId:CHANNEL,messageId:found.id});
  const fetched=await fetch(uri,{signal:AbortSignal.timeout(22000)});
  if(!fetched.ok)throw Error('Image fetch '+fetched.status);
  const bytes=Buffer.from(await fetched.arrayBuffer());
  if(bytes.length!==3890378||sha(bytes)!==HASH||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Image verification failed');
  if(body.action==='preflight')return json(res,200,{ok:true,action:'preflight',imageSha256:HASH,imageBytes:bytes.length,channelId:CHANNEL,duplicate:false});
  const form=new FormData();
  form.append('payload_json',JSON.stringify({content:text,allowed_mentions:{parse:['everyone']},attachments:[{id:0,filename:NAME,description:'AVENGERS 100-player ratings with gold and silver crown bonuses'}]}));
  form.append('files[0]',new Blob([bytes],{type:'image/png'}),NAME);
  // Send once. An ambiguous failure MUST NOT be retried.
  const sent=await discord('/channels/'+CHANNEL+'/messages',{method:'POST',body:form});
  const receipt=await discord('/channels/'+CHANNEL+'/messages/'+sent.id);
  const attachment=(receipt.attachments||[]).find(a=>a.filename===NAME);
  if(receipt.content!==text||!attachment||!attachment.url)throw Error('Discord message readback mismatch; DO NOT RETRY');
  const verified=await fetch(attachment.url,{signal:AbortSignal.timeout(22000)});
  const uploaded=Buffer.from(await verified.arrayBuffer());
  if(!verified.ok||sha(uploaded)!==HASH)throw Error('Discord image readback mismatch; DO NOT RETRY');
  return json(res,200,{ok:true,channelId:CHANNEL,messageId:sent.id,imageSha256:HASH,imageVerified:true});
 }catch(e){return json(res,502,{ok:false,reason:'publish attempt failed; verify Discord before any retry',detail:String(e.message).slice(0,150)});}
};