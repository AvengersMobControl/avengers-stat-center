'use strict';
/**
 * One-off, leader-authorized Discord CANARY ONLY. Never posts actual result
 * data. No automation, delete permissions, webhook, arbitrary text or file.
 * A strong, expiring one-time request token is required; before outbound POST
 * a durable unique Neon slot+intent is committed. Any uncertain outcome must
 * be manually reconciled, NEVER blindly retried.
 */
const crypto=require('node:crypto');
const {neon}=require('@neondatabase/serverless');
const {READ_ONLY_SQL,evaluate}=require('../scripts/private-dispatch-readiness.cjs');
const {resolveSummaryDestination}=require('../server/discord-summary-destination.cjs');
const {image}=require('../server/discord-canary-image.cjs');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const EVENT_ID='piggy|discord-transport-canary-20261020';
const CLAN='AV-2';
const KIND='piggy';
const FILE='avengers-attachment-TEST-ONLY.png';
const BODY='**AVENGERS / AV-2 — DISCORD TRANSPORT TEST**\nThis is ONE supervised test of PNG attachment + message delivery in #Performance Statistics. It is **not event results**, not a clan update, and does not enable automatic posting.';

function respond(res,code,data){
 res.statusCode=code;
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','no-store, max-age=0');
 res.setHeader('Pragma','no-cache');
 res.end(JSON.stringify(data));
}
function validNonce(query,env){
 const given=query.get('token'),expected=env.AVENGERS_DISCORD_CANARY_ONCE_SHA256;
 if(!/^[a-f0-9]{64}$/.test(given||'')||!/^[a-f0-9]{64}$/.test(expected||''))return false;
 const v=sha(given);
 return crypto.timingSafeEqual(Buffer.from(v,'hex'),Buffer.from(expected,'hex'));
}
async function discordJson(token,url,method='GET',body){
 const options={method,headers:{Authorization:'Bot '+token,'User-Agent':'AVENGERS-Stat-Center-Canary/1.0'},signal:AbortSignal.timeout(12000)};
 if(body)options.body=body;
 const r=await fetch(url,options);
 if(!r.ok)throw new Error('Discord HTTP '+r.status);
 return r.json();
}
function db(env){
 const value=env.AVENGERS_DISPATCH_DATABASE_URL;
 if(typeof value!=='string'||!value.startsWith('postgres'))throw new Error('Canary database not configured');
 return neon(value,{fullResults:false});
}
async function preflight(sql,token,channelId,env){
 const rows=await sql.query(READ_ONLY_SQL,[]);
 if(rows.length!==1||!evaluate(rows[0]).ready)throw new Error('Restricted DB or disabled safety controls not verified');
 const c=await discordJson(token,'https://discord.com/api/v10/channels/'+channelId);
 if(String(c.id)!==channelId||String(c.guild_id)!==env.DISCORD_GUILD_ID)
    throw new Error('Discord channel/guild mismatch');
 return {channelId:String(c.id),guildMatch:true,dbRuntimeRestricted:true,automaticPosting:false};
}
async function reserve(sql,channelId,pngBytes){
 const imageSha=sha(pngBytes),projectionSha=sha('TEST-NO-EVENT-SOURCE:2026-10-20:AV-2');
 const template='test-only-png-v1';
 const edition=JSON.stringify({kind:KIND,eventId:EVENT_ID,clan:CLAN,channelId,imageSha,projectionSha,template});
 const planSha=sha(edition+'|'+BODY);
 // A committed unique slot is the send-once lock. If later steps fail it
 // intentionally blocks a retry until a human reconciles it.
 const slotRows=await sql.query(`INSERT INTO avengers_dispatch_private.publication_slots(kind,event_id,event_time_clan)
 VALUES ($1,$2,$3) ON CONFLICT (kind,event_id,event_time_clan) DO NOTHING RETURNING id`,[KIND,EVENT_ID,CLAN]);
 if(slotRows.length!==1)return null;
 const slotId=slotRows[0].id;
 const intents=await sql.query(`INSERT INTO avengers_dispatch_private.send_intents
  (slot_id,intent_kind,plan_sha256,projection_sha256,image_sha256,template_version,
   edition,destination_channel_id,approved_by,approved_at)
 VALUES ($1,'first',$2,$3,$4,$5,$6,$7,$8,now()) RETURNING id`,
 [slotId,planSha,projectionSha,imageSha,template,edition,channelId,'leader-in-chat-2026-10-20']);
 if(intents.length!==1)throw new Error('Unable to reserve intent');
 const intentId=intents[0].id;
 await sql.query(`INSERT INTO avengers_dispatch_private.audit_events
 (slot_id,action,actor,details) VALUES ($1,'manual_authorization_recorded',$2,$3::jsonb)`,
 [slotId,'leader-in-chat-2026-10-20',JSON.stringify({canaryOnly:true,kind:KIND,channelId})]);
 return {slotId,intentId,imageSha,projectionSha,template};
}
async function postAndCheck(botToken,channelId,pngBytes,pngSha){
 const fd=new FormData();
 fd.append('payload_json',JSON.stringify({
  content:BODY,allowed_mentions:{parse:[]},
  attachments:[{id:0,filename:FILE,description:'Synthetic test image - not game results'}]
 }));
 fd.append('files[0]',new Blob([pngBytes],{type:'image/png'}),FILE);
 const msg=await discordJson(botToken,'https://discord.com/api/v10/channels/'+channelId+'/messages','POST',fd);
 if(!/^\d{17,22}$/.test(String(msg.id))||String(msg.channel_id)!==channelId)
   throw new Error('Post response not verifiable');
 const readback=await discordJson(botToken,'https://discord.com/api/v10/channels/'+channelId+'/messages/'+msg.id);
 if(String(readback.id)!==String(msg.id)||readback.content!==BODY)
   throw new Error('Message readback does not match');
 const attachment=(readback.attachments||[]).find(a=>a.filename===FILE&&a.content_type?.startsWith('image/png'));
 if(!attachment||!String(attachment.url).startsWith('https://'))throw new Error('Missing PNG attachment on readback');
 const r=await fetch(attachment.url,{signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw new Error('Discord attachment cannot be retrieved');
 const actual=Buffer.from(await r.arrayBuffer());
 if(sha(actual)!==pngSha)throw new Error('Discord attachment SHA mismatch');
 return {messageId:String(msg.id),bytes:actual.length};
}
async function receipt(sql,channelId,intent,proof){
 await sql.query(`INSERT INTO avengers_dispatch_private.message_receipts
 (slot_id,intent_id,discord_channel_id,discord_message_id,projection_sha256,image_sha256,
  template_version,proof_method,verified_by,verified_at)
 VALUES ($1,$2,$3,$4,$5,$6,$7,'authenticated_discord_png_sha256','canary-bot-readback',now())`,
 [intent.slotId,intent.intentId,channelId,proof.messageId,intent.projectionSha,intent.imageSha,intent.template]);
 await sql.query(`UPDATE avengers_dispatch_private.send_intents SET intent_status='receipt_recorded',resolved_at=now() WHERE id=$1`,[intent.intentId]);
 await sql.query(`UPDATE avengers_dispatch_private.publication_slots SET status='active',row_version=row_version+1,updated_at=now() WHERE id=$1`,[intent.slotId]);
 await sql.query(`INSERT INTO avengers_dispatch_private.audit_events (slot_id,action,actor,details)
 VALUES ($1,'api_receipt_recorded','canary-bot-readback',$2::jsonb)`,
 [intent.slotId,JSON.stringify({channelId,messageId:proof.messageId,canaryOnly:true})]);
}
module.exports = async function handler(req,res){
 // Vercel Node protected runtime only. No GET side effects on unauthenticated
 // or off-production requests. No public listing or arbitrary destinations.
 if(req.method!=='GET')return respond(res,405,{ok:false});
 const env=process.env;
 if(env.VERCEL_ENV!=='production'||env.AVENGERS_DISCORD_CANARY_ENABLED!=='true')
   return respond(res,404,{ok:false});
 const u=new URL(req.url,'https://avengers-stat-center.vercel.app');
 if(!validNonce(u.searchParams,env)||!['preflight','send'].includes(u.searchParams.get('action')))
   return respond(res,404,{ok:false});
 const expires=Date.parse(env.AVENGERS_DISCORD_CANARY_EXPIRES_UTC||'');
 if(!Number.isFinite(expires)||Date.now()>expires)return respond(res,410,{ok:false,reason:'expired'});
 const action=u.searchParams.get('action');
 try{
  const route=resolveSummaryDestination({kind:KIND,clan:CLAN},env);
  const token=env.DISCORD_BOT_TOKEN;
  if(typeof token!=='string'||token.length<30)throw new Error('bot token missing');
  const sql=db(env);
  const checks=await preflight(sql,token,route.channelId,env);
  if(action==='preflight')return respond(res,200,{ok:true,mode:'read-only',...checks});
  const pngBytes=image();
  if(pngBytes.length>8*1024*1024||pngBytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')
     throw new Error('Bad test PNG');
  const reserved=await reserve(sql,route.channelId,pngBytes);
  if(!reserved)return respond(res,409,{ok:false,status:'already-reserved; will not send again'});
  // Once the durable slot exists the transport may execute exactly ONCE.
  // Any error below means NO automated retry; inspect Discord manually.
  try{
   const proof=await postAndCheck(token,route.channelId,pngBytes,reserved.imageSha);
   await receipt(sql,route.channelId,reserved,proof);
   return respond(res,200,{ok:true,mode:'one-shot-canary',channelId:route.channelId,
     messageId:proof.messageId,attachmentBytes:proof.bytes,imageSha256:reserved.imageSha,
     automationEnabled:false});
  }catch{
   try{await sql.query(`UPDATE avengers_dispatch_private.publication_slots
     SET status='manual_reconciliation_required',updated_at=now() WHERE id=$1`,[reserved.slotId]);}catch{}
   return respond(res,502,{ok:false,status:'possible-send; MANUAL RECONCILIATION REQUIRED; never retry'});
  }
 }catch{
  return respond(res,503,{ok:false,status:'preflight-blocked; no verified Discord post'});
 }
};
