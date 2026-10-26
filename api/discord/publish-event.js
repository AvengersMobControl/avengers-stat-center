'use strict';
/**
 * Standing AVENGERS event-summary publisher (leader activated automatic posting 2026-10-26).
 *
 * Posts ONE event poster + write-up that is already committed in data/discord-posts.json
 * (staged by scripts/stage-discord-post.py) to the configured #Performance Statistics channel.
 * Callers choose only WHICH committed post; content, image and destination come from the
 * deployed repo and env. Guarded by:
 *  - AVENGERS_AUTO_PUBLISH_ENABLED=true (production only) and a clan allowlist (AVENGERS by default);
 *  - a single-use token whose SHA-256 is in AVENGERS_AUTO_PUBLISH_ONCE_SHA256, bound to one post key
 *    or a few (AVENGERS_AUTO_PUBLISH_POST, comma-separated) and an expiry (AVENGERS_AUTO_PUBLISH_EXPIRES_UTC);
 *  - the exact SHA-pinned PNG, approved source event, and the Neon send-once ledger;
 *  - authenticated readback of text and PNG bytes. Never retries an uncertain send.
 */
const crypto=require('node:crypto');
const posts=require('../../data/discord-posts.json');
const approved=require('../../data/approved-event-updates.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const AUTH='leader-standing-auto-discord-2026-10-26';
const CHANNEL='1470175579058999386';
const KINDS=new Set(['space','piggy','flash']);

function answer(res,code,data){
 res.statusCode=code;
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','no-store, max-age=0');
 res.end(JSON.stringify(data));
}
function tokenOkay(given,env){
 const expected=env.AVENGERS_AUTO_PUBLISH_ONCE_SHA256;
 if(!/^[a-f0-9]{64}$/.test(given||'')||!/^[a-f0-9]{64}$/.test(expected||''))return false;
 return crypto.timingSafeEqual(Buffer.from(sha(given),'hex'),Buffer.from(expected,'hex'));
}
function postKeys(env){
 // Keys this run's token may publish (comma-separated); the Neon ledger keeps each to one send.
 return String(env.AVENGERS_AUTO_PUBLISH_POST||'').split(',').map(k=>k.trim()).filter(Boolean);
}
function allowedClans(env){
 return new Set(String(env.AVENGERS_AUTO_PUBLISH_CLANS||'AVENGERS').split(',').map(s=>s.trim()).filter(Boolean));
}
function validPost(key,post){
 if(!post||typeof post!=='object')throw Error('Unknown post');
 if(key!==`${post.kind}|${post.eventId}|${post.clan}`)throw Error('Post key mismatch');
 if(!KINDS.has(post.kind))throw Error('Unsupported kind');
 if(!/^[A-Za-z0-9_.-]+\.png$/.test(post.file||''))throw Error('Bad file');
 if(!/^[a-f0-9]{64}$/.test(post.sha256||'')||!(post.size>0))throw Error('Bad image pin');
 if(typeof post.body!=='string'||!post.body.trim()||post.body.length>2000)throw Error('Bad body');
 if(post.approved!==true)throw Error('Post not approved');
 return post;
}
function mentions(body){
 // Leader rule 2026-10-26: write-ups start with @everyone, and only that ping is allowed.
 return {parse:body.startsWith('@everyone')?['everyone']:[]};
}
function sourceDigest(post){
 const ups=approved.updates.filter(u=>u.approved===true&&u.event&&u.event.kind===post.kind&&(
   post.kind==='flash'?(u.event.metadata||{}).setId===post.eventId.replace(/^flashset\|/,''):u.event.id===post.eventId));
 if(!ups.length)throw Error('Approved source event missing');
 const rows=ups.flatMap(u=>u.event.rows||[]).filter(r=>r.clan===post.clan);
 if(!rows.length)throw Error('No approved rows for clan');
 return sha(JSON.stringify(ups.map(u=>[u.event.id,u.expectedRevision,u.event.rows.length])));
}
async function discord(token,url,method='GET',body){
 const r=await fetch(url,{method,headers:{Authorization:'Bot '+token,'User-Agent':'AVENGERS-Stat-Center-Event-Publisher/1.0'},body,signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('Discord HTTP '+r.status);
 return r.json();
}
async function exactImage(post){
 const response=await fetch('https://avengers-stat-center.vercel.app/assets/reports/'+post.file,{signal:AbortSignal.timeout(16000)});
 if(!response.ok)throw Error('Approved report asset unavailable '+response.status);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(bytes.length!==post.size||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||sha(bytes)!==post.sha256)
  throw Error('Approved PNG mismatch');
 return bytes;
}
async function preflight(sql,token,channel,env,post){
 const {READ_ONLY_SQL,evaluate}=require('../../scripts/private-dispatch-readiness.cjs');
 const checks=await sql.query(READ_ONLY_SQL,[]);
 if(checks.length!==1||!evaluate(checks[0]).ready)throw Error('Runtime safety controls invalid');
 const c=await discord(token,'https://discord.com/api/v10/channels/'+channel);
 if(String(c.id)!==channel||String(c.guild_id)!==env.DISCORD_GUILD_ID)throw Error('Discord destination mismatch');
 const prior=await sql.query('SELECT id FROM avengers_dispatch_private.publication_slots WHERE kind=$1 AND event_id=$2 AND event_time_clan=$3',[post.kind,post.eventId,post.clan]);
 return {duplicateReserved:prior.length>0};
}
async function reserve(sql,channel,post,projection){
 const edition=JSON.stringify({kind:post.kind,eventId:post.eventId,clan:post.clan,channel,projection,imageSha:post.sha256,template:post.template});
 const plan=sha(edition+'|'+post.body);
 const inserted=await sql.query('INSERT INTO avengers_dispatch_private.publication_slots(kind,event_id,event_time_clan) VALUES ($1,$2,$3) ON CONFLICT (kind,event_id,event_time_clan) DO NOTHING RETURNING id',[post.kind,post.eventId,post.clan]);
 if(inserted.length!==1)return null;
 const slotId=inserted[0].id;
 const intent=await sql.query("INSERT INTO avengers_dispatch_private.send_intents(slot_id,intent_kind,plan_sha256,projection_sha256,image_sha256,template_version,edition,destination_channel_id,approved_by,approved_at) VALUES($1,'first',$2,$3,$4,$5,$6,$7,$8,now()) RETURNING id",
  [slotId,plan,projection,post.sha256,post.template,edition,channel,AUTH]);
 if(intent.length!==1)throw Error('Intent reservation failed');
 await sql.query("INSERT INTO avengers_dispatch_private.audit_events(slot_id,action,actor,details) VALUES($1,'manual_authorization_recorded',$2,$3::jsonb)",
  [slotId,AUTH,JSON.stringify({kind:post.kind,clan:post.clan,channel,sha:post.sha256})]);
 return {slotId,intentId:intent[0].id,projection};
}
async function send(token,channel,post,bytes){
 const form=new FormData();
 form.append('payload_json',JSON.stringify({content:post.body,allowed_mentions:mentions(post.body),
  attachments:[{id:0,filename:post.file,description:post.description||post.file}]}));
 form.append('files[0]',new Blob([bytes],{type:'image/png'}),post.file);
 const m=await discord(token,'https://discord.com/api/v10/channels/'+channel+'/messages','POST',form);
 if(String(m.channel_id)!==channel||!/^\d{17,22}$/.test(String(m.id)))throw Error('Discord delivery not verifiable');
 const receipt=await discord(token,'https://discord.com/api/v10/channels/'+channel+'/messages/'+m.id);
 if(receipt.content!==post.body||String(receipt.id)!==String(m.id))throw Error('Discord readback content mismatch');
 const att=(receipt.attachments||[]).find(a=>a.filename===post.file&&a.content_type?.startsWith('image/png'));
 if(!att||!String(att.url).startsWith('https://'))throw Error('Discord PNG missing');
 const check=await fetch(att.url,{signal:AbortSignal.timeout(16000)});
 if(!check.ok)throw Error('Discord PNG download unavailable');
 const seen=Buffer.from(await check.arrayBuffer());
 if(seen.length!==post.size||sha(seen)!==post.sha256)throw Error('Discord PNG SHA mismatch');
 return {messageId:String(m.id),bytes:seen.length};
}
async function persist(sql,channel,post,intent,proof){
 await sql.query("INSERT INTO avengers_dispatch_private.message_receipts(slot_id,intent_id,discord_channel_id,discord_message_id,projection_sha256,image_sha256,template_version,proof_method,verified_by,verified_at) VALUES($1,$2,$3,$4,$5,$6,$7,'authenticated_discord_png_sha256','avengers-bot-readback',now())",
  [intent.slotId,intent.intentId,channel,proof.messageId,intent.projection,post.sha256,post.template]);
 await sql.query("UPDATE avengers_dispatch_private.send_intents SET intent_status='receipt_recorded',resolved_at=now() WHERE id=$1",[intent.intentId]);
 await sql.query("UPDATE avengers_dispatch_private.publication_slots SET status='active',row_version=row_version+1,updated_at=now() WHERE id=$1",[intent.slotId]);
 await sql.query("INSERT INTO avengers_dispatch_private.audit_events(slot_id,action,actor,details) VALUES($1,'api_receipt_recorded','avengers-bot-readback',$2::jsonb)",
  [intent.slotId,JSON.stringify({channel,messageId:proof.messageId,imageSha256:post.sha256})]);
}

async function handler(req,res){
 if(req.method!=='GET')return answer(res,405,{ok:false});
 const env=process.env;
 if(env.VERCEL_ENV!=='production'||env.AVENGERS_AUTO_PUBLISH_ENABLED!=='true')return answer(res,404,{ok:false});
 const url=new URL(req.url,'https://avengers-stat-center.vercel.app');
 const action=url.searchParams.get('action'),key=url.searchParams.get('post')||'';
 if(!['preflight','send'].includes(action)||!tokenOkay(url.searchParams.get('token'),env)||!postKeys(env).includes(key))
  return answer(res,404,{ok:false});
 const expiry=Date.parse(env.AVENGERS_AUTO_PUBLISH_EXPIRES_UTC||'');
 if(!Number.isFinite(expiry)||Date.now()>expiry)return answer(res,410,{ok:false,reason:'expired'});
 try{
  const post=validPost(key,(posts.posts||{})[key]);
  if(!allowedClans(env).has(post.clan))throw Error('Clan not enabled for automatic posting');
  const {resolveSummaryDestination}=require('../../server/discord-summary-destination.cjs');
  const channel=resolveSummaryDestination({kind:post.kind,clan:post.clan},env).channelId;
  if(channel!==CHANNEL)throw Error('Unexpected Discord channel');
  const bot=env.DISCORD_BOT_TOKEN;
  if(typeof bot!=='string'||bot.length<30)throw Error('Discord bot token unavailable');
  const {neon}=require('@neondatabase/serverless');
  const sql=neon(env.AVENGERS_DISPATCH_DATABASE_URL,{fullResults:false});
  const checks=await preflight(sql,bot,channel,env,post);
  const projection=sourceDigest(post);
  const bytes=await exactImage(post);
  if(action==='preflight')return answer(res,200,{ok:true,mode:'read-only',post:key,channelId:channel,imageBytes:bytes.length,imageSha256:sha(bytes),bodyChars:post.body.length,...checks});
  if(checks.duplicateReserved)return answer(res,409,{ok:false,reason:'already-reserved; no duplicate send'});
  const intent=await reserve(sql,channel,post,projection);
  if(!intent)return answer(res,409,{ok:false,reason:'already-reserved; no duplicate send'});
  try{
   const proof=await send(bot,channel,post,bytes);
   await persist(sql,channel,post,intent,proof);
   return answer(res,200,{ok:true,post:key,channelId:channel,messageId:proof.messageId,imageSha256:post.sha256,imageBytes:proof.bytes});
  }catch{
   try{await sql.query("UPDATE avengers_dispatch_private.publication_slots SET status='manual_reconciliation_required',updated_at=now() WHERE id=$1",[intent.slotId]);}catch{}
   return answer(res,502,{ok:false,reason:'possible-send; manual reconciliation required; never retry'});
  }
 }catch(e){return answer(res,503,{ok:false,reason:String(e?.message||'preflight blocked').slice(0,140)});}
}
module.exports=handler;
module.exports._test={tokenOkay,validPost,mentions,allowedClans,sourceDigest,postKeys};
