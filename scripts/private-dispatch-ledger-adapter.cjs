'use strict';
// AVENGERS #8 -- PRIVATE, operator-driven publication ledger adapter.
// No HTTP handler, no Discord send/delete, no automatic approval, no credentials.
// Do not bundle this module in public build output or call it from a browser.
const crypto=require('node:crypto');
const {inspect}=require('./private-dispatch-readiness.cjs');
const {manifestHash,key}=require('./plan-event-summary-dispatch.cjs');
const SNOW=/^\d{15,22}$/, HEX=/^[a-f0-9]{64}$/;
const PNG=Buffer.from([137,80,78,71,13,10,26,10]);
const fail=()=>{throw Error('Private publication ledger operation blocked; investigate authorization and state offline');};
const identifier=x=>typeof x==='string'&&SNOW.test(x);
const sha=x=>typeof x==='string'&&HEX.test(x);
const validDate=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&x.length<=40;
const actor=x=>typeof x==='string'&&x.length>0&&x.length<=120&&x.trim()===x;
const planKinds=['space','piggy','flash','kraken'];
const clans=['AVENGERS','AV-2'];

function validateStage({plan,authorization,destinationChannelId,allowedChannelIds}){
 if(!plan||plan.schemaVersion!==1||!planKinds.includes(plan.kind)||!clans.includes(plan.clan)||
    !plan.eventId?.startsWith(plan.kind+'|')||plan.eventId.length>140||
    plan.identity!==key(plan)||!sha(plan.projectionVersion)||!sha(plan.imageSHA256)||
    !/^[a-z0-9-]{5,80}$/.test(plan.templateVersion||'')||
    typeof plan.edition!=='string'||plan.edition.length>600||
    plan.edition!==[plan.identity,plan.projectionVersion,plan.templateVersion,plan.imageSHA256].join('::')||
    !['needs-first-publication-approval','needs-correction-approval'].includes(plan.decision)||
    plan.approvedToPost!==false||plan.sendEnabled!==false||plan.deleteEnabled!==false||
    !Array.isArray(plan.actions)||plan.actions.length!==1||
    plan.actions[0].requiresExplicitAuthorization!==true)fail();
 if(!identifier(destinationChannelId)||!Array.isArray(allowedChannelIds)||
    !allowedChannelIds.every(identifier)||!allowedChannelIds.includes(destinationChannelId))fail();
 if(!authorization||authorization.approvedThisExactPlan!==true||
    authorization.planDigest!==manifestHash(plan)||
    authorization.destinationChannelId!==destinationChannelId||
    !actor(authorization.reviewedBy)||!validDate(authorization.approvedAt)||
    authorization.authorizedForAutomaticDispatch!==false)fail();
 return {plan,authorization,destinationChannelId};
}

async function transaction(pool,callback){
 if(!pool||typeof pool.connect!=='function')fail();
 let client,open=false;
 try{
  client=await pool.connect();
  if(!client||typeof client.query!=='function')fail();
  await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');open=true;
  const checked=await inspect(client);
  if(!checked.ready)fail();
  const result=await callback(client);
  await client.query('COMMIT');open=false;
  return result;
 }catch{
  if(open){try{await client.query('ROLLBACK')}catch{}}
  fail(); // never expose a SQL, credential, or external API error in caller output
 }finally{
  if(client&&typeof client.release==='function')client.release();
 }
}
function one(reply){if(!reply||!Array.isArray(reply.rows)||reply.rows.length!==1)fail();return reply.rows[0]}
function affected(reply){if(!reply||reply.rowCount!==1)fail()}
const names='avengers_dispatch_private.';

async function stageAuthorizedIntent({pool,plan,authorization,destinationChannelId,allowedChannelIds}){
 validateStage({plan,authorization,destinationChannelId,allowedChannelIds});
 return transaction(pool,async c=>{
  await c.query(`INSERT INTO ${names}publication_slots (kind,event_id,event_time_clan)
    VALUES ($1,$2,$3) ON CONFLICT (kind,event_id,event_time_clan) DO NOTHING`,
    [plan.kind,plan.eventId,plan.clan]);
  const slot=one(await c.query(`SELECT id,row_version,status FROM ${names}publication_slots
    WHERE kind=$1 AND event_id=$2 AND event_time_clan=$3 FOR UPDATE`,
    [plan.kind,plan.eventId,plan.clan]));
  if(!Number.isSafeInteger(Number(slot.id))||!Number.isSafeInteger(Number(slot.row_version)))fail();
  const blockers=one(await c.query(`SELECT
    (SELECT count(*) FROM ${names}send_intents WHERE slot_id=$1 AND intent_status='awaiting_manual_receipt') AS pending,
    (SELECT count(*) FROM ${names}message_receipts WHERE slot_id=$1 AND receipt_status='awaiting_manual_retirement') AS retiring`,[slot.id]));
  if(Number(blockers.pending)!==0||Number(blockers.retiring)!==0)fail();
  const current=await c.query(`SELECT id,discord_channel_id,discord_message_id,projection_sha256,image_sha256,template_version
    FROM ${names}message_receipts WHERE slot_id=$1 AND receipt_status='active' FOR UPDATE`,[slot.id]);
  if(!Array.isArray(current.rows)||current.rows.length>1)fail();
  const wasActive=current.rows.length===1;
  if(wasActive!==(plan.decision==='needs-correction-approval'))fail();
  if(wasActive&&(current.rows[0].discord_channel_id!==destinationChannelId||
   (plan.priorMessageId!==current.rows[0].discord_message_id)||
   (plan.priorChannelId!==current.rows[0].discord_channel_id)))fail();
  if(!wasActive&&(plan.priorMessageId!==null||plan.priorChannelId!==null))fail();
  const kind=wasActive?'correction':'first';
  const intent=one(await c.query(`INSERT INTO ${names}send_intents
   (slot_id,intent_kind,plan_sha256,projection_sha256,image_sha256,template_version,
    edition,destination_channel_id,approved_by,approved_at,approved_for_automatic_send)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,FALSE) RETURNING id`,[
   slot.id,kind,authorization.planDigest,plan.projectionVersion,plan.imageSHA256,
   plan.templateVersion,plan.edition,destinationChannelId,authorization.reviewedBy,authorization.approvedAt]));
  affected(await c.query(`UPDATE ${names}publication_slots SET
    status='awaiting_manual_receipt',row_version=row_version+1,updated_at=now()
    WHERE id=$1 AND row_version=$2`,[slot.id,slot.row_version]));
  affected(await c.query(`INSERT INTO ${names}audit_events(slot_id,action,actor,details)
    VALUES ($1,'manual_authorization_recorded',$2,$3::jsonb) RETURNING id`,
    [slot.id,authorization.reviewedBy,JSON.stringify({intentId:String(intent.id),kind,planDigest:authorization.planDigest})]));
  return {decision:'awaiting_manual_receipt',slotId:String(slot.id),intentId:String(intent.id),
    nextAction:'Manual Discord action and authenticated readback required',
    automaticSendAllowed:false,automaticDeleteAllowed:false};
 });
}
function validateReadback(message,channelId,messageId,imageHash){
 if(!message||message.channelId!==channelId||message.messageId!==messageId||
    message.contentType!=='image/png'||!Buffer.isBuffer(message.attachmentBytes)||
    message.attachmentBytes.length<PNG.length||message.attachmentBytes.length>25*1024*1024||
    !message.attachmentBytes.subarray(0,PNG.length).equals(PNG))fail();
 const found=crypto.createHash('sha256').update(message.attachmentBytes).digest('hex');
 if(found!==imageHash)fail();
}
async function recordAuthenticatedReceipt({pool,intentId,channelId,messageId,verifiedBy,observedAt,readback}){
 if(!/^\d{1,19}$/.test(String(intentId))||!identifier(channelId)||!identifier(messageId)||
  !actor(verifiedBy)||!validDate(observedAt)||typeof readback!=='function')fail();
 // The injected adapter MUST fetch an actual authenticated Discord message and
 // original PNG bytes. No user-supplied receipt object or boolean is accepted.
 // No retry/send/delete can be invoked by this code. Never infer a post succeeded.
 return transaction(pool,async c=>{
  const item=one(await c.query(`SELECT slot_id FROM ${names}send_intents WHERE id=$1`,[intentId]));
  const slot=one(await c.query(`SELECT id,row_version FROM ${names}publication_slots
    WHERE id=$1 FOR UPDATE`,[item.slot_id]));
  const intent=one(await c.query(`SELECT id,intent_kind,intent_status,destination_channel_id,
    projection_sha256,image_sha256,template_version FROM ${names}send_intents
    WHERE id=$1 AND slot_id=$2 FOR UPDATE`,[intentId,slot.id]));
  if(intent.intent_status!=='awaiting_manual_receipt'||intent.destination_channel_id!==channelId)fail();
  const pendingRetire=one(await c.query(`SELECT count(*) AS count FROM ${names}message_receipts
    WHERE slot_id=$1 AND receipt_status='awaiting_manual_retirement'`,[slot.id]));
  if(Number(pendingRetire.count)!==0)fail();
  const old=await c.query(`SELECT id,discord_channel_id,discord_message_id FROM ${names}message_receipts
    WHERE slot_id=$1 AND receipt_status='active' FOR UPDATE`,[slot.id]);
  if(!Array.isArray(old.rows)||old.rows.length>1||
    (old.rows.length===1)!==(intent.intent_kind==='correction'))fail();
  if(old.rows.length&&(old.rows[0].discord_channel_id!==channelId||
    old.rows[0].discord_message_id===messageId))fail();
  const message=await readback({channelId,messageId});
  validateReadback(message,channelId,messageId,intent.image_sha256);
  if(old.rows.length){
   affected(await c.query(`UPDATE ${names}message_receipts SET receipt_status='awaiting_manual_retirement'
     WHERE id=$1 AND receipt_status='active'`,[old.rows[0].id]));
  }
  const receipt=one(await c.query(`INSERT INTO ${names}message_receipts
   (slot_id,intent_id,discord_channel_id,discord_message_id,projection_sha256,image_sha256,
    template_version,receipt_status,proof_method,verified_by,verified_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,'active','authenticated_discord_png_sha256',$8,$9)
    RETURNING id`,[slot.id,intent.id,channelId,messageId,intent.projection_sha256,
    intent.image_sha256,intent.template_version,verifiedBy,observedAt]));
  affected(await c.query(`UPDATE ${names}send_intents SET
    intent_status='receipt_recorded',resolved_at=now()
    WHERE id=$1 AND intent_status='awaiting_manual_receipt'`,[intent.id]));
  const nextStatus=old.rows.length?'awaiting_old_retirement':'active';
  affected(await c.query(`UPDATE ${names}publication_slots SET
    status=$3,row_version=row_version+1,updated_at=now()
    WHERE id=$1 AND row_version=$2`,[slot.id,slot.row_version,nextStatus]));
  affected(await c.query(`INSERT INTO ${names}audit_events(slot_id,action,actor,details)
    VALUES ($1,$2,$3,$4::jsonb) RETURNING id`,[
      slot.id,old.rows.length?'replacement_receipt_recorded':'api_receipt_recorded',
      verifiedBy,JSON.stringify({receiptId:String(receipt.id),intentId:String(intent.id)})]));
  return {decision:nextStatus,receiptId:String(receipt.id),
   oldMessageRetirementRequired:old.rows.length>0,
   automaticSendAllowed:false,automaticDeleteAllowed:false};
 });
}
module.exports={stageAuthorizedIntent,recordAuthenticatedReceipt,validateStage,validateReadback};
