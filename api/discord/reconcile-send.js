'use strict';
/**
 * Read-only reconciliation check for an automatic post that came back ambiguous
 * ("possible-send; manual reconciliation required" from publish-event.js). It
 * NEVER sends, edits or deletes a Discord message, and it only looks at a slot
 * publish-event.js itself already marked `manual_reconciliation_required` --
 * it cannot be used to probe the channel for anything else.
 *
 * It reads the destination channel's recent messages with the same bot
 * credential publish-event.js uses, and only accepts a match that is
 * byte-for-byte identical to the pinned post: same bot author, same body text,
 * same attachment filename, and the downloaded PNG's own SHA-256 equal to
 * post.sha256 (the same guarantee send()'s own authenticated readback makes).
 * On a confirmed match it records the receipt exactly as a successful
 * automatic send would have, so a human never has to paste a message link
 * for a run to close the loop on an uncertain send.
 *
 * Added 2026-11-23 after the Nov 22 Big Pig send returned the ambiguous 502
 * and had to be reconciled by hand from a leader-supplied message link
 * (leader: "change the settings so you can retrieve it yourself").
 */
const crypto=require('node:crypto');
const posts=require('../../data/discord-posts.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');

function answer(res,code,data){
 res.statusCode=code;
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','no-store, max-age=0');
 res.end(JSON.stringify(data));
}
function tokenOkay(given,env){
 const expected=env.AVENGERS_RECONCILE_TOKEN_SHA256;
 if(!/^[a-f0-9]{64}$/.test(given||'')||!/^[a-f0-9]{64}$/.test(expected||''))return false;
 return crypto.timingSafeEqual(Buffer.from(sha(given),'hex'),Buffer.from(expected,'hex'));
}
async function discord(token,url){
 const r=await fetch(url,{headers:{Authorization:'Bot '+token,'User-Agent':'AVENGERS-Stat-Center-Reconcile/1.0'},signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('Discord HTTP '+r.status);
 return r.json();
}

async function handler(req,res){
 if(req.method!=='GET')return answer(res,405,{ok:false});
 const env=process.env;
 if(env.VERCEL_ENV!=='production'||env.AVENGERS_AUTO_PUBLISH_ENABLED!=='true')return answer(res,404,{ok:false});
 const url=new URL(req.url,'https://avengers-stat-center.vercel.app');
 const key=url.searchParams.get('post')||'';
 if(!tokenOkay(url.searchParams.get('token'),env))return answer(res,404,{ok:false});
 try{
  const post=(posts.posts||{})[key];
  if(!post||typeof post!=='object')throw Error('Unknown post');
  if(key!==`${post.kind}|${post.eventId}|${post.clan}`)throw Error('Post key mismatch');

  const {neon}=require('@neondatabase/serverless');
  const sql=neon(env.AVENGERS_DISPATCH_DATABASE_URL,{fullResults:false});

  // Only a slot publish-event.js itself flagged ambiguous is eligible -- this
  // endpoint cannot be pointed at an arbitrary post to go fishing in the channel.
  const slots=await sql.query(
   "SELECT id FROM avengers_dispatch_private.publication_slots WHERE kind=$1 AND event_id=$2 AND event_time_clan=$3 AND status='manual_reconciliation_required'",
   [post.kind,post.eventId,post.clan]);
  if(slots.length!==1)return answer(res,200,{ok:true,found:false,reason:'no-slot-awaiting-reconciliation'});
  const slotId=slots[0].id;

  const intents=await sql.query(
   "SELECT id,projection_sha256,template_version,destination_channel_id FROM avengers_dispatch_private.send_intents WHERE slot_id=$1 AND intent_status='awaiting_manual_receipt' ORDER BY created_at DESC LIMIT 1",
   [slotId]);
  if(intents.length!==1)return answer(res,200,{ok:true,found:false,reason:'no-unresolved-intent'});
  const intent=intents[0];
  const channel=intent.destination_channel_id;

  const bot=env.DISCORD_BOT_TOKEN;
  if(typeof bot!=='string'||bot.length<30)throw Error('Discord bot token unavailable');
  const me=await discord(bot,'https://discord.com/api/v10/users/@me');
  const messages=await discord(bot,'https://discord.com/api/v10/channels/'+channel+'/messages?limit=20');

  for(const m of messages){
   if(String(m.author?.id)!==String(me.id))continue;
   if(m.content!==post.body)continue;
   const att=(m.attachments||[]).find(a=>a.filename===post.file&&a.content_type?.startsWith('image/png'));
   if(!att)continue;
   const check=await fetch(att.url,{signal:AbortSignal.timeout(16000)});
   if(!check.ok)continue;
   const bytes=Buffer.from(await check.arrayBuffer());
   if(bytes.length!==post.size||sha(bytes)!==post.sha256)continue;

   // Byte-for-byte confirmed -- record the receipt exactly as send()'s own
   // persist() would have, then the slot is no longer in reconciliation.
   await sql.query(
    "INSERT INTO avengers_dispatch_private.message_receipts(slot_id,intent_id,discord_channel_id,discord_message_id,projection_sha256,image_sha256,template_version,proof_method,verified_by,verified_at) VALUES($1,$2,$3,$4,$5,$6,$7,'authenticated_discord_png_sha256','avengers-bot-readback-reconcile',now())",
    [slotId,intent.id,channel,String(m.id),intent.projection_sha256,post.sha256,intent.template_version]);
   await sql.query("UPDATE avengers_dispatch_private.send_intents SET intent_status='receipt_recorded',resolved_at=now() WHERE id=$1",[intent.id]);
   await sql.query("UPDATE avengers_dispatch_private.publication_slots SET status='active',row_version=row_version+1,updated_at=now() WHERE id=$1",[slotId]);
   await sql.query("INSERT INTO avengers_dispatch_private.audit_events(slot_id,action,actor,details) VALUES($1,'api_receipt_recorded','avengers-bot-readback-reconcile',$2::jsonb)",
    [slotId,JSON.stringify({channel,messageId:String(m.id),imageSha256:post.sha256,via:'reconcile-send'})]);
   return answer(res,200,{ok:true,found:true,messageId:String(m.id),channelId:channel});
  }
  return answer(res,200,{ok:true,found:false,reason:'no-matching-message-in-recent-history'});
 }catch(e){
  return answer(res,503,{ok:false,reason:String(e?.message||'reconcile blocked').slice(0,140)});
 }
}
module.exports=handler;
module.exports._test={tokenOkay};
