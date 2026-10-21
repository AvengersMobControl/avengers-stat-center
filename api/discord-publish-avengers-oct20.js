'use strict';
/** One user-authorized AVENGERS Oct20–21 Flash PNG + message; never automatically repost. */
const crypto=require('node:crypto');
const {neon}=require('@neondatabase/serverless');
const {READ_ONLY_SQL,evaluate}=require('../scripts/private-dispatch-readiness.cjs');
const {resolveSummaryDestination}=require('../server/discord-summary-destination.cjs');
const approved=require('../data/approved-event-updates.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const EXP_PNG='f81bdea669e2692536bf05b36adb8281a841b6f1d43aa3efb20dc6258fa76bee';
const EVENT_ID='flash|2026-10-20-A', CLAN='AVENGERS', KIND='flash';
const FILE='AVENGERS_Piggy_Flashes_October_20_2026_FINAL.png';
const IMAGE_URL='https://raw.githubusercontent.com/AvengersMobControl/avengers-stat-center/main/assets/reports/AVENGERS_Piggy_Flashes_October_20_2026_FINAL.png';
const BODY="⚡ **AVENGERS PIGGY FLASHES | OCT 20–21** ⚡\n\n🔥 **948,521 Sparks** and **9,485,120 Stars** earned!\n\n💪 **137,708 total lines** from 43 recorded AVENGERS players.\n\n🏆 **AV-Addicted** delivered 6,036 lines in PF3 — the new **#1 recorded individual Flash performance** in clan history!\n\n⚡ **AV-INTEN** added 10,477 combined lines.\n\n🌟 **11 new daily PBs!** And 21 of 38 eligible players exceeded their previous Flash Set day-total averages.\n\nGreat work, AVENGERS! Check out the full results and personal records below. 👇";

function answer(res,code,obj){res.statusCode=code;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(obj));}
async function discord(token,url,method='GET',body){const opts={method,headers:{Authorization:'Bot '+token,'User-Agent':'AVENGERS-Stat-Center-Approved-Report/1.0'},signal:AbortSignal.timeout(12000)};if(body)opts.body=body;const r=await fetch(url,opts);if(!r.ok)throw Error('Discord HTTP '+r.status);return r.json();}
function checkSource(){
 const list=approved.updates.filter(x=>x.event?.kind===KIND&&x.event?.metadata?.setId==='2026-10-20-A');
 if(list.length!==4)throw Error('Exactly four approved flash events required');
 for(const [n,count] of [[1,22],[2,28],[3,24],[4,21]]){
   const x=list.find(x=>x.event.metadata.flash===n);
   if(!x||x.approved!==true||x.event.metadata.clan!==CLAN||x.event.rows.length!==count)
     throw Error('Flash event source integrity mismatch PF'+n);
 }
 const rows=list.flatMap(x=>x.event.rows);
 const sum=field=>rows.reduce((s,r)=>s+(Number(r[field])||0),0);
 if(rows.length!==95||new Set(rows.map(x=>x.player)).size!==43||
    sum('score')!==137708||sum('stars')!==9485120||sum('sparks')!==948521||
    rows.some(r=>r.clan!==CLAN||r.score<=1||/tavito/i.test(r.player)||r.stars===null||r.sparks===null))
   throw Error('Approved Oct20 source diverged');
 return sha(JSON.stringify(list.map(x=>x.event)));
}
async function getImage(){
 const r=await fetch(IMAGE_URL,{signal:AbortSignal.timeout(18000)});
 if(!r.ok)throw Error('Approved PNG not publicly retrievable');
 const bytes=Buffer.from(await r.arrayBuffer());
 if(bytes.length!==1799067||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||sha(bytes)!==EXP_PNG)
  throw Error('Approved PNG length or SHA-256 mismatch');
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
 const edition=JSON.stringify({kind:KIND,eventId:EVENT_ID,clan:CLAN,projection,imageSha:EXP_PNG,template:'avengers-flashes-oct20-v7-final-v1'});
 const digest=sha(edition+'|'+BODY);
 const s=await sql.query(`INSERT INTO avengers_dispatch_private.publication_slots(kind,event_id,event_time_clan)
  VALUES($1,$2,$3) ON CONFLICT(kind,event_id,event_time_clan) DO NOTHING RETURNING id`,[KIND,EVENT_ID,CLAN]);
 if(s.length!==1)return null;
 const slotId=s[0].id;
 const i=await sql.query(`INSERT INTO avengers_dispatch_private.send_intents
  (slot_id,intent_kind,plan_sha256,projection_sha256,image_sha256,template_version,
   edition,destination_channel_id,approved_by,approved_at)
  VALUES ($1,'first',$2,$3,$4,$5,$6,$7,$8,now()) RETURNING id`,
  [slotId,digest,projection,EXP_PNG,'avengers-flashes-oct20-v7-final-v1',edition,process.env.AVENGERS_DISCORD_SUMMARY_CHANNEL_ID,'leader-chat-2026-10-21']);
 if(i.length!==1)throw Error('Cannot reserve report send');
 await sql.query(`INSERT INTO avengers_dispatch_private.audit_events(slot_id,action,actor,details)
  VALUES ($1,'manual_authorization_recorded','leader-chat-2026-10-21',$2::jsonb)`,
  [slotId,JSON.stringify({kind:KIND,clan:CLAN,imageSha256:EXP_PNG,manual:true})]);
 return {slotId,intentId:i[0].id,projection};
}
async function send(token,channel,bytes){
 const form=new FormData();
 form.append('payload_json',JSON.stringify({content:BODY,allowed_mentions:{parse:[]},attachments:[{id:0,filename:FILE,description:'Approved AVENGERS October 20–21 four-Flash results'}]}));
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
 [stage.slotId,stage.intentId,channel,proof.messageId,stage.projection,EXP_PNG,'avengers-flashes-oct20-v7-final-v1']);
 await sql.query(`UPDATE avengers_dispatch_private.send_intents SET intent_status='receipt_recorded',resolved_at=now() WHERE id=$1`,[stage.intentId]);
 await sql.query(`UPDATE avengers_dispatch_private.publication_slots SET status='active',row_version=row_version+1,updated_at=now() WHERE id=$1`,[stage.slotId]);
 await sql.query(`INSERT INTO avengers_dispatch_private.audit_events(slot_id,action,actor,details)
 VALUES($1,'api_receipt_recorded','avengers-bot-readback',$2::jsonb)`,
 [stage.slotId,JSON.stringify({channel,messageId:proof.messageId,imageSha256:EXP_PNG})]);
}
module.exports=async function handler(req,res){
 if(req.method!=='GET')return answer(res,405,{ok:false});
 const env=process.env;
 if(env.VERCEL_ENV!=='production'||env.AVENGERS_FLASH_OCT20_SEND_ENABLED!=='true')return answer(res,404,{ok:false});
 const u=new URL(req.url,'https://avengers-stat-center.vercel.app');
 const token=u.searchParams.get('token'),expected=env.AVENGERS_FLASH_OCT20_ONCE_SHA256;
 if(!/^[a-f0-9]{64}$/.test(token||'')||!/^[a-f0-9]{64}$/.test(expected||'')||
    !crypto.timingSafeEqual(Buffer.from(sha(token),'hex'),Buffer.from(expected,'hex'))||
    !['preflight','send'].includes(u.searchParams.get('action')))return answer(res,404,{ok:false});
 const expiry=Date.parse(env.AVENGERS_FLASH_OCT20_EXPIRES_UTC||'');
 if(!Number.isFinite(expiry)||Date.now()>expiry)return answer(res,410,{ok:false,reason:'expired'});
 try{
  const channel=resolveSummaryDestination({kind:KIND,clan:CLAN},env).channelId;
  const bot=env.DISCORD_BOT_TOKEN;
  if(typeof bot!=='string'||bot.length<30)throw Error('Bot credential not configured');
  const sql=neon(env.AVENGERS_DISPATCH_DATABASE_URL,{fullResults:false});
  const checks=await preflight(sql,bot,channel,env);
  const projection=checkSource();
  if(u.searchParams.get('action')==='preflight'){
   const image=await getImage();
   return answer(res,200,{ok:true,mode:'read-only',...checks,imageBytes:image.length,imageSha256:sha(image)});
  }
  const bytes=await getImage();
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
