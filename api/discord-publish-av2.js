'use strict';
/** Single, explicitly leader-authorized real AV-2 Oct18 Piggy summary PNG send.
 * No unattended scheduler. Never retry a delivery with uncertain receipt.
 * Source PNG comes from short-lived, encrypted Vercel URL and must match the
 * exact SHA256 of the 597522-byte approved screenshot/composite.
 */
const crypto=require('node:crypto');
const {neon}=require('@neondatabase/serverless');
const {READ_ONLY_SQL,evaluate}=require('../scripts/private-dispatch-readiness.cjs');
const {resolveSummaryDestination}=require('../server/discord-summary-destination.cjs');
const approved=require('../data/approved-event-updates.json');
const holds=require('../data/ingestion-result-holds.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const EXP_PNG='42686548ee813673bc78c9bfe43512c929f4ec252fb2aace57e356c75c39eeca';
const EVENT_ID='piggy|2026-10-18', CLAN='AV-2', KIND='piggy';
const FILE='AV2_Piggy_2026-10-18_CORRECTED_REVIEW.png';
const BODY='**AV-2 • PIGGY RACE — FINAL RESULTS • OCTOBER 18, 2026**\n'+
'19 AV-2 racers combined for **56,925 lines** and earned **4,178,040 Stars** plus **417,799 Sparks**. Whole-lobby Star pot: **5.86M**. AV-2 rake: **71.0%** (sum of displayed lobby shares).\n\n'+
'**Top five by lines**\n'+
'🥇 AV-TigerMx — 11,502\n'+
'🥈 AV-EXCALIBUR — 10,082\n'+
'🥉 AV-Caklet — 10,017\n'+
'4. AV2-Brisket — 8,688\n'+
'5. AV-Hoops — 3,792\n\n'+
'The attached official AV-2 Piggy summary includes finishing-place PBs (AV-2-only, 5+ same-lobby players), line PBs and first tracked appearances. Two Tier-10-not-reached racers have unreported rewards, not invented zeros.';

function answer(res,code,obj){res.statusCode=code;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(obj));}
async function discord(token,url,method='GET',body){const opts={method,headers:{Authorization:'Bot '+token,'User-Agent':'AVENGERS-Stat-Center-Approved-Report/1.0'},signal:AbortSignal.timeout(12000)};if(body)opts.body=body;const r=await fetch(url,opts);if(!r.ok)throw Error('Discord HTTP '+r.status);return r.json();}
function checkSource(){
 const releases=holds.releases||[];
 if(holds.holds?.some(h=>h.eventId===EVENT_ID&&h.clan===CLAN)||
  !releases.some(x=>x.eventId===EVENT_ID&&x.clan===CLAN&&x.status==='released'))throw Error('Oct18 source not released');
 const latest=approved.updates.filter(u=>u.event?.id===EVENT_ID).at(-1);
 if(!latest||latest.approved!==true||latest.event.status!=='final')throw Error('Oct18 reviewed final source absent');
 const rows=latest.event.rows.filter(r=>r.clan===CLAN);
 const n=field=>rows.reduce((s,r)=>s+(Number(r[field])||0),0);
 if(rows.length!==19||n('score')!==56925||n('stars')!==4178040||n('sparks')!==417799||
  Math.round(rows.reduce((s,r)=>s+(r.metadata?.share||0),0)*1000)!==710)throw Error('Oct18 AV-2 results diverged');
 if(latest.event.rows.filter(r=>r.clan==='AVENGERS').length!==50)throw Error('Oct18 AVENGERS source changed');
 return sha(JSON.stringify(latest.event));
}
async function getImage(env){
 const u=env.AVENGERS_AV2_OCT18_PNG_SIGNED_URL;
 if(typeof u!=='string'||!/^https:\/\/[a-z0-9-]+\.oaiusercontent\.com\/files\//.test(u))throw Error('Source image URL missing');
 const response=await fetch(u,{signal:AbortSignal.timeout(16000)});
 if(!response.ok)throw Error('Approved source image inaccessible');
 const bytes=Buffer.from(await response.arrayBuffer());
 if(bytes.length!==597522||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||sha(bytes)!==EXP_PNG)
  throw Error('Approved PNG bytes or integrity mismatch');
 return bytes;
}
async function preflight(sql,token,channel,env){
 const rows=await sql.query(READ_ONLY_SQL,[]);
 if(rows.length!==1||!evaluate(rows[0]).ready)throw Error('Runtime controls or restricted role not verified');
 const c=await discord(token,'https://discord.com/api/v10/channels/'+channel);
 if(String(c.id)!==channel||String(c.guild_id)!==env.DISCORD_GUILD_ID)throw Error('Discord channel or guild mismatch');
 return {channelId:channel,restrictedRuntime:true,automaticPosting:false};
}
async function stage(sql,projection){
 const edition=JSON.stringify({kind:KIND,eventId:EVENT_ID,clan:CLAN,projection,imageSha:EXP_PNG,template:'av2-piggy-corrected-original-v1'});
 const digest=sha(edition+'|'+BODY);
 const s=await sql.query(`INSERT INTO avengers_dispatch_private.publication_slots(kind,event_id,event_time_clan)
  VALUES($1,$2,$3) ON CONFLICT(kind,event_id,event_time_clan) DO NOTHING RETURNING id`,[KIND,EVENT_ID,CLAN]);
 if(s.length!==1)return null;
 const slotId=s[0].id;
 const i=await sql.query(`INSERT INTO avengers_dispatch_private.send_intents
  (slot_id,intent_kind,plan_sha256,projection_sha256,image_sha256,template_version,
   edition,destination_channel_id,approved_by,approved_at)
  VALUES ($1,'first',$2,$3,$4,$5,$6,$7,$8,now()) RETURNING id`,
  [slotId,digest,projection,EXP_PNG,'av2-piggy-corrected-original-v1',edition,process.env.AVENGERS_DISCORD_SUMMARY_CHANNEL_ID,'leader-chat-2026-10-20']);
 if(i.length!==1)throw Error('Cannot reserve report send');
 await sql.query(`INSERT INTO avengers_dispatch_private.audit_events(slot_id,action,actor,details)
  VALUES ($1,'manual_authorization_recorded','leader-chat-2026-10-20',$2::jsonb)`,
  [slotId,JSON.stringify({kind:KIND,clan:CLAN,imageSha256:EXP_PNG,manual:true})]);
 return {slotId,intentId:i[0].id,projection};
}
async function send(token,channel,bytes){
 const form=new FormData();
 form.append('payload_json',JSON.stringify({content:BODY,allowed_mentions:{parse:[]},attachments:[{id:0,filename:FILE,description:'Reviewed AV-2 October 18 Piggy Race final summary'}]}));
 form.append('files[0]',new Blob([bytes],{type:'image/png'}),FILE);
 const posted=await discord(token,'https://discord.com/api/v10/channels/'+channel+'/messages','POST',form);
 if(String(posted.channel_id)!==channel||!/^\d{17,22}$/.test(String(posted.id)))throw Error('Discord delivery not verifiable');
 const r=await discord(token,'https://discord.com/api/v10/channels/'+channel+'/messages/'+posted.id);
 if(r.content!==BODY||String(r.id)!==String(posted.id))throw Error('Discord message mismatch');
 const a=(r.attachments||[]).find(x=>x.filename===FILE && x.content_type?.startsWith('image/png'));
 if(!a||!String(a.url).startsWith('https://'))throw Error('PNG missing in Discord readback');
 const response=await fetch(a.url,{signal:AbortSignal.timeout(16000)});
 if(!response.ok)throw Error('Cannot readback Discord image');
 const original=Buffer.from(await response.arrayBuffer());
 if(original.length!==bytes.length||sha(original)!==EXP_PNG)throw Error('Discord image hash mismatch');
 return {messageId:String(posted.id),bytes:original.length};
}
async function persist(sql,channel,stage,proof){
 await sql.query(`INSERT INTO avengers_dispatch_private.message_receipts
 (slot_id,intent_id,discord_channel_id,discord_message_id,projection_sha256,image_sha256,template_version,
 proof_method,verified_by,verified_at)
 VALUES($1,$2,$3,$4,$5,$6,$7,'authenticated_discord_png_sha256','avengers-bot-readback',now())`,
 [stage.slotId,stage.intentId,channel,proof.messageId,stage.projection,EXP_PNG,'av2-piggy-corrected-original-v1']);
 await sql.query(`UPDATE avengers_dispatch_private.send_intents SET intent_status='receipt_recorded',resolved_at=now() WHERE id=$1`,[stage.intentId]);
 await sql.query(`UPDATE avengers_dispatch_private.publication_slots SET status='active',row_version=row_version+1,updated_at=now() WHERE id=$1`,[stage.slotId]);
 await sql.query(`INSERT INTO avengers_dispatch_private.audit_events(slot_id,action,actor,details)
 VALUES($1,'api_receipt_recorded','avengers-bot-readback',$2::jsonb)`,
 [stage.slotId,JSON.stringify({channel,messageId:proof.messageId,imageSha256:EXP_PNG})]);
}
module.exports=async function handler(req,res){
 if(req.method!=='GET')return answer(res,405,{ok:false});
 const env=process.env;
 if(env.VERCEL_ENV!=='production'||env.AVENGERS_AV2_OCT18_SEND_ENABLED!=='true')return answer(res,404,{ok:false});
 const u=new URL(req.url,'https://avengers-stat-center.vercel.app');
 const token=u.searchParams.get('token'),expected=env.AVENGERS_AV2_OCT18_ONCE_SHA256;
 if(!/^[a-f0-9]{64}$/.test(token||'')||!/^[a-f0-9]{64}$/.test(expected||'')||
    !crypto.timingSafeEqual(Buffer.from(sha(token),'hex'),Buffer.from(expected,'hex'))||
    !['preflight','send'].includes(u.searchParams.get('action')))return answer(res,404,{ok:false});
 const expiry=Date.parse(env.AVENGERS_AV2_OCT18_EXPIRES_UTC||'');
 if(!Number.isFinite(expiry)||Date.now()>expiry)return answer(res,410,{ok:false,reason:'expired'});
 try{
  const channel=resolveSummaryDestination({kind:KIND,clan:CLAN},env).channelId;
  const bot=env.DISCORD_BOT_TOKEN;
  if(typeof bot!=='string'||bot.length<30)throw Error('Bot credential not configured');
  const sql=neon(env.AVENGERS_DISPATCH_DATABASE_URL,{fullResults:false});
  const checks=await preflight(sql,bot,channel,env);
  const projection=checkSource();
  if(u.searchParams.get('action')==='preflight'){
   const image=await getImage(env);
   return answer(res,200,{ok:true,mode:'read-only',...checks,imageBytes:image.length,imageSha256:sha(image)});
  }
  const bytes=await getImage(env);
  const intent=await stage(sql,projection);
  if(!intent)return answer(res,409,{ok:false,status:'already-reserved; no duplicate send'});
  try{
   const proof=await send(bot,channel,bytes);
   await persist(sql,channel,intent,proof);
   return answer(res,200,{ok:true,channelId:channel,messageId:proof.messageId,
     imageBytes:proof.bytes,imageSha256:EXP_PNG,automaticPostingEnabled:false});
  }catch{
   try{await sql.query(`UPDATE avengers_dispatch_private.publication_slots SET
     status='manual_reconciliation_required',updated_at=now() WHERE id=$1`,[intent.slotId]);}catch{}
   return answer(res,502,{ok:false,status:'possible-send; manual reconciliation required; no retry'});
  }
 }catch(e){return answer(res,503,{ok:false,status:'preflight blocked',reason:String(e?.message||'failed').slice(0,90)});}
};
