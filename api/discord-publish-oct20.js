'use strict';
/**
 * Leader-authorized one-time AVENGERS Oct 20-21, 2026 Piggy Flashes Discord post.
 * NO automatic scheduler, arbitrary destination/body/upload or blind retries.
 * Uses the exact SHA-pinned final PNG plus a durable Neon send-once ledger.
 */
const crypto=require('node:crypto');
const {neon}=require('@neondatabase/serverless');
const {READ_ONLY_SQL,evaluate}=require('../scripts/private-dispatch-readiness.cjs');
const {resolveSummaryDestination}=require('../server/discord-summary-destination.cjs');
const approved=require('../data/approved-event-updates.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const KIND='flash', CLAN='AVENGERS', EVENT_ID='flash|2026-10-20-A';
const FILE='AVENGERS_Piggy_Flashes_October_20_2026_FINAL.png';
const EXPECTED_SHA='f81bdea669e2692536bf05b36adb8281a841b6f1d43aa3efb20dc6258fa76bee';
const EXPECTED_SIZE=1799067;
const BODY=[
'⚡ **AVENGERS PIGGY FLASHES | OCT 20–21** ⚡',
'',
'🔥 **948,521 Sparks** and **9,485,120 Stars** earned!',
'',
'💪 **137,708 total lines** from 43 recorded AVENGERS players.',
'',
'🏆 **AV-Addicted** delivered 6,036 lines in PF3 — the new **#1 recorded individual Flash performance** in clan history!',
'',
'⚡ **AV-INTEN** added 10,477 combined lines.',
'',
'🌟 **11 new daily PBs!** And 21 of 38 eligible players exceeded their previous Flash Set day-total averages.',
'',
'Great work, AVENGERS! Check out the full results and personal records below. 👇'
].join('\n');

function answer(res,code,data){
 res.statusCode=code;
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','no-store, max-age=0');
 res.end(JSON.stringify(data));
}
function nonceOkay(url,env){
 const given=url.searchParams.get('token'),expected=env.AVENGERS_FLASH_OCT20_ONCE_SHA256;
 if(!/^[a-f0-9]{64}$/.test(given||'')||!/^[a-f0-9]{64}$/.test(expected||''))return false;
 return crypto.timingSafeEqual(Buffer.from(sha(given),'hex'),Buffer.from(expected,'hex'));
}
async function discord(token,url,method='GET',body){
 const r=await fetch(url,{method,headers:{Authorization:'Bot '+token,'User-Agent':'AVENGERS-Stat-Center-Oct20-Approved/1.0'},body,signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('Discord HTTP '+r.status);
 return r.json();
}
function checkSource(){
 const parts=approved.updates.filter(u=>u.event?.metadata?.setId==='2026-10-20-A'&&u.event.kind==='flash').sort((a,b)=>a.event.metadata.flash-b.event.metadata.flash);
 if(parts.length!==4||parts.some((u,i)=>u.approved!==true||u.event.metadata.flash!==i+1||u.event.metadata.clan!==CLAN))
  throw Error('Oct20 approved four-Flash set diverged');
 const counts=[22,28,24,21];
 const rows=[];
 for(let i=0;i<parts.length;i++){
  const ev=parts[i].event;
  if(ev.rows.length!==counts[i]||ev.rows.some(r=>r.clan!==CLAN||r.score<=1||/tavito/i.test(r.player)))
   throw Error('Oct20 corrected participant coverage changed');
  rows.push(...ev.rows);
 }
 const sum=key=>rows.reduce((n,r)=>n+Number(r[key]||0),0);
 if(rows.length!==95||sum('score')!==137708||sum('stars')!==9485120||sum('sparks')!==948521)
  throw Error('Oct20 approved source totals changed');
 return sha(JSON.stringify(parts.map(p=>p.event)));
}
async function exactImage(){
 // The asset is included in the immutable deployment; never trust a caller-supplied URL.
 const url='https://'+process.env.VERCEL_URL+'/assets/reports/'+FILE;
 if(!/^https:\/\/[a-zA-Z0-9.-]+\/assets\/reports\//.test(url))throw Error('Deployment URL missing');
 const response=await fetch(url,{signal:AbortSignal.timeout(16000)});
 if(!response.ok)throw Error('Approved report asset unavailable '+response.status);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(bytes.length!==EXPECTED_SIZE||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||sha(bytes)!==EXPECTED_SHA)
   throw Error('Approved PNG mismatch');
 return bytes;
}
async function preflight(sql,token,channel,env){
 const checks=await sql.query(READ_ONLY_SQL,[]);
 if(checks.length!==1||!evaluate(checks[0]).ready)throw Error('Runtime safety controls invalid');
 const c=await discord(token,'https://discord.com/api/v10/channels/'+channel);
 if(String(c.id)!==channel||String(c.guild_id)!==env.DISCORD_GUILD_ID)
  throw Error('Discord destination mismatch');
 const prior=await sql.query('SELECT id,status FROM avengers_dispatch_private.publication_slots WHERE kind=$1 AND event_id=$2 AND event_time_clan=$3',[KIND,EVENT_ID,CLAN]);
 return {duplicateReserved:prior.length>0,automaticPostingEnabled:false};
}
async function reserve(sql,channel,projection){
 const edition=JSON.stringify({kind:KIND,eventId:EVENT_ID,clan:CLAN,channel,projection,imageSha:EXPECTED_SHA,template:'oct20-flash-v7-final'});
 const plan=sha(edition+'|'+BODY);
 const inserted=await sql.query('INSERT INTO avengers_dispatch_private.publication_slots(kind,event_id,event_time_clan) VALUES ($1,$2,$3) ON CONFLICT (kind,event_id,event_time_clan) DO NOTHING RETURNING id',[KIND,EVENT_ID,CLAN]);
 if(inserted.length!==1)return null;
 const slotId=inserted[0].id;
 const intent=await sql.query("INSERT INTO avengers_dispatch_private.send_intents(slot_id,intent_kind,plan_sha256,projection_sha256,image_sha256,template_version,edition,destination_channel_id,approved_by,approved_at) VALUES($1,'first',$2,$3,$4,$5,$6,$7,$8,now()) RETURNING id",
 [slotId,plan,projection,EXPECTED_SHA,'oct20-flash-v7-final',edition,channel,'leader-explicit-chat-2026-10-21']);
 if(intent.length!==1)throw Error('Intent reservation failed');
 await sql.query("INSERT INTO avengers_dispatch_private.audit_events(slot_id,action,actor,details) VALUES($1,'manual_authorization_recorded',$2,$3::jsonb)",
 [slotId,'leader-explicit-chat-2026-10-21',JSON.stringify({kind:KIND,clan:CLAN,channel,sha:EXPECTED_SHA})]);
 return {slotId,intentId:intent[0].id,projection};
}
async function post(token,channel,bytes){
 const form=new FormData();
 form.append('payload_json',JSON.stringify({content:BODY,allowed_mentions:{parse:[]},attachments:[{id:0,filename:FILE,description:'Approved October 20-21 AVENGERS Piggy Flashes final report'}]}));
 form.append('files[0]',new Blob([bytes],{type:'image/png'}),FILE);
 const m=await discord(token,'https://discord.com/api/v10/channels/'+channel+'/messages','POST',form);
 if(String(m.channel_id)!==channel||!/^\d{17,22}$/.test(String(m.id)))throw Error('Discord delivery not verifiable');
 const receipt=await discord(token,'https://discord.com/api/v10/channels/'+channel+'/messages/'+m.id);
 if(receipt.content!==BODY||String(receipt.id)!==String(m.id))throw Error('Discord readback content mismatch');
 const attachment=(receipt.attachments||[]).find(a=>a.filename===FILE&&a.content_type?.startsWith('image/png'));
 if(!attachment||!String(attachment.url).startsWith('https://'))throw Error('Discord PNG missing');
 const check=await fetch(attachment.url,{signal:AbortSignal.timeout(16000)});
 if(!check.ok)throw Error('Discord PNG download unavailable');
 const seen=Buffer.from(await check.arrayBuffer());
 if(seen.length!==EXPECTED_SIZE||sha(seen)!==EXPECTED_SHA)throw Error('Discord PNG SHA mismatch');
 return {messageId:String(m.id),bytes:seen.length};
}
async function persist(sql,channel,intent,proof){
 await sql.query("INSERT INTO avengers_dispatch_private.message_receipts(slot_id,intent_id,discord_channel_id,discord_message_id,projection_sha256,image_sha256,template_version,proof_method,verified_by,verified_at) VALUES($1,$2,$3,$4,$5,$6,$7,'authenticated_discord_png_sha256','avengers-bot-readback',now())",
 [intent.slotId,intent.intentId,channel,proof.messageId,intent.projection,EXPECTED_SHA,'oct20-flash-v7-final']);
 await sql.query("UPDATE avengers_dispatch_private.send_intents SET intent_status='receipt_recorded',resolved_at=now() WHERE id=$1",[intent.intentId]);
 await sql.query("UPDATE avengers_dispatch_private.publication_slots SET status='active',row_version=row_version+1,updated_at=now() WHERE id=$1",[intent.slotId]);
 await sql.query("INSERT INTO avengers_dispatch_private.audit_events(slot_id,action,actor,details) VALUES($1,'api_receipt_recorded','avengers-bot-readback',$2::jsonb)",
 [intent.slotId,JSON.stringify({channel,messageId:proof.messageId,imageSha256:EXPECTED_SHA})]);
}
module.exports=async function handler(req,res){
 if(req.method!=='GET')return answer(res,405,{ok:false});
 const env=process.env;
 if(env.VERCEL_ENV!=='production'||env.AVENGERS_FLASH_OCT20_SEND_ENABLED!=='true')return answer(res,404,{ok:false});
 const url=new URL(req.url,'https://avengers-stat-center.vercel.app');
 if(!nonceOkay(url,env)||!['preflight','send'].includes(url.searchParams.get('action')))return answer(res,404,{ok:false});
 const expiry=Date.parse(env.AVENGERS_FLASH_OCT20_EXPIRES_UTC||'');
 if(!Number.isFinite(expiry)||Date.now()>expiry)return answer(res,410,{ok:false,reason:'expired'});
 try{
  const channel=resolveSummaryDestination({kind:KIND,clan:CLAN},env).channelId;
  if(channel!=='1470175579058999386')throw Error('Unexpected Discord channel');
  const bot=env.DISCORD_BOT_TOKEN;
  if(typeof bot!=='string'||bot.length<30)throw Error('Discord bot token unavailable');
  const sql=neon(env.AVENGERS_DISPATCH_DATABASE_URL,{fullResults:false});
  const checks=await preflight(sql,bot,channel,env);
  const projection=checkSource();
  const bytes=await exactImage();
  if(url.searchParams.get('action')==='preflight')
   return answer(res,200,{ok:true,mode:'read-only',channelId:channel,imageBytes:bytes.length,imageSha256:sha(bytes),...checks});
  if(checks.duplicateReserved)return answer(res,409,{ok:false,reason:'already-reserved; no duplicate send'});
  const intent=await reserve(sql,channel,projection);
  if(!intent)return answer(res,409,{ok:false,reason:'already-reserved; no duplicate send'});
  // Committed reservation precedes the sole outbound attempt. Never retry uncertainty.
  try{
   const proof=await post(bot,channel,bytes);
   await persist(sql,channel,intent,proof);
   return answer(res,200,{ok:true,channelId:channel,messageId:proof.messageId,imageSha256:EXPECTED_SHA,imageBytes:proof.bytes,automaticPostingEnabled:false});
  }catch{
   try{await sql.query("UPDATE avengers_dispatch_private.publication_slots SET status='manual_reconciliation_required',updated_at=now() WHERE id=$1",[intent.slotId]);}catch{}
   return answer(res,502,{ok:false,reason:'possible-send; manual reconciliation required; never retry'});
  }
 }catch(e){return answer(res,503,{ok:false,reason:String(e?.message||'preflight blocked').slice(0,140)});}
};
