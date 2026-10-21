'use strict';
/**
 * Private, GitHub-OIDC-authenticated automatic Big Piggy publisher.
 * Only accepts a deterministic PNG/message produced by the main-branch
 * workflow from an approved final canonical event. No imports, edits or deletes.
 */
const crypto=require('node:crypto');
const {neon}=require('@neondatabase/serverless');
const {READ_ONLY_SQL,evaluateAutomaticDispatch}=require('../scripts/private-dispatch-readiness.cjs');
const {resolveSummaryDestination}=require('../server/discord-summary-destination.cjs');
const {verifyGitHubOIDC,verifyPngBytes,sourceEventForDispatch,buildPiggyMessage}=require('../scripts/automatic-piggy-dispatch-core.cjs');
const approved=require('../data/approved-event-updates.json');
const holds=require('../data/ingestion-result-holds.json');
const policy=require('../data/automatic-piggy-dispatch-policy.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const SCHEMA='avengers_dispatch_private.';
const respond=(res,status,body)=>{
 res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','no-store, max-age=0');res.setHeader('Pragma','no-cache');
 res.end(JSON.stringify(body));
};
const db=env=>{
 const url=env.AVENGERS_DISPATCH_DATABASE_URL;
 if(typeof url!=='string'||!url.startsWith('postgres'))throw Error('Dispatch database unavailable');
 return neon(url,{fullResults:false});
};
async function discord(token,url,method='GET',body){
 const options={method,headers:{Authorization:'Bot '+token,'User-Agent':'AVENGERS-Stat-Center-Piggy-Dispatcher/1.0'},
  signal:AbortSignal.timeout(15000)};
 if(body)options.body=body;
 const response=await fetch(url,options);
 if(!response.ok)throw Error('Discord HTTP '+response.status);
 return response.json();
}
async function githubMainSha(){
 const response=await fetch('https://api.github.com/repos/AvengersMobControl/avengers-stat-center/git/ref/heads/main',{
  headers:{Accept:'application/vnd.github+json','User-Agent':'AVENGERS-Stat-Center-Piggy-Dispatcher/1.0'},
  signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('Canonical main revision cannot be verified');
 const body=await response.json();
 const value=body?.object?.sha;
 if(!/^[a-f0-9]{40}$/i.test(value||''))throw Error('Canonical main revision is invalid');
 return value.toLowerCase();
}
function validateBody(body,claims,mainSha,env){
 if(!body||typeof body!=='object'||Array.isArray(body))throw Error('Dispatch payload missing');
 if(body.sourceCommit!==claims.sha||body.sourceCommit!==mainSha||
    String(env.VERCEL_GIT_COMMIT_SHA||'').toLowerCase()!==mainSha)throw Error('GitHub, payload and production deployment commits do not match');
 if(body.kind!=='piggy'||!['AVENGERS','AV-2'].includes(body.clan)||
    !policy.allowedKinds.includes(body.kind)||!policy.allowedClans.includes(body.clan))throw Error('Event kind or clan is not allowed');
 if(typeof body.eventId!=='string'||body.eventId.length>140||
    typeof body.projectionVersion!=='string'||!/^[a-f0-9]{64}$/.test(body.projectionVersion)||
    body.templateVersion!==policy.templateVersion)throw Error('Event, projection or template identity invalid');
 if(!body.report||body.report.kind!=='piggy'||body.report.eventId!==body.eventId||
    body.report.clan!==body.clan||body.report.date===undefined||
    body.report.projectionVersion!==body.projectionVersion||body.report.templateVersion!==body.templateVersion||
    body.report.eventStatus!=='final'||body.report.approvedSourceOnly!==true||
    body.report.previewOnly!==false||body.report.readyToPost!==true||body.report.discordPostingEnabled!==true)
  throw Error('PNG manifest is not a matching final approved-source report');
 if(!Number.isInteger(body.report.participants)||body.report.participants<1||
    !Number.isInteger(body.report.knownScoreSum)||body.report.knownScoreSum<0||
    !Number.isInteger(body.report.knownStars)||body.report.knownStars<0||
    !Number.isInteger(body.report.knownSparks)||body.report.knownSparks<0||
    !Number.isInteger(body.report.unknownStarRows)||body.report.unknownStarRows<0||
    !Number.isInteger(body.report.unknownSparkRows)||body.report.unknownSparkRows<0||
    !Number.isInteger(body.report.linePBs)||body.report.linePBs<0||
    !Number.isInteger(body.report.placementPBs)||body.report.placementPBs<0||
    !Number.isInteger(body.report.firstTracked)||body.report.firstTracked<0||
    !(body.report.weekToWeekGrowthPercent===null||(typeof body.report.weekToWeekGrowthPercent==='number'&&Number.isFinite(body.report.weekToWeekGrowthPercent)))||
    !Array.isArray(body.report.averageTrend)||!Array.isArray(body.report.milestones)||!Array.isArray(body.report.topThreeCareer))
  throw Error('PNG manifest metrics invalid');
 for(const m of body.report.milestones){
  if(!Number.isInteger(m.threshold)||m.threshold<5000||!Number.isInteger(m.count)||m.count<1||typeof m.record!=='boolean')
   throw Error('PNG benchmark manifest invalid');
 }
 for(const p of body.report.averageTrend){
  if(typeof p.date!=='string'||typeof p.average!=='number'||!Number.isFinite(p.average)||p.average<0)
   throw Error('PNG average-trend manifest invalid');
 }
 if(typeof body.imageBase64!=='string'||body.imageBase64.length>4000000||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(body.imageBase64))throw Error('PNG payload missing or too large');
 const bytes=Buffer.from(body.imageBase64,'base64');
 if(bytes.toString('base64')!==body.imageBase64)throw Error('PNG base64 encoding is not canonical');
 const imageSha=verifyPngBytes(bytes);
 if(imageSha!==body.imageSHA256||imageSha!==body.report.imageSHA256)throw Error('PNG SHA-256 does not match the review manifest');
 return {bytes,imageSha};
}
async function checkPreflight(sql,token,channelId,env){
 const rows=await sql.query(READ_ONLY_SQL,[]);
 if(rows.length!==1)throw Error('Exactly one safety row is required');
 const check=evaluateAutomaticDispatch(rows[0]);
 if(!check.ready||!check.permitsAutomaticSend||check.permitsAutomaticDelete||!check.permitsPublicEndpoint)
  throw Error('Restricted runtime or explicit automatic-send safety flags are not ready');
 const channel=await discord(token,'https://discord.com/api/v10/channels/'+channelId);
 if(String(channel.id)!==channelId||String(channel.guild_id)!==env.DISCORD_GUILD_ID)
  throw Error('Fixed Discord channel/guild verification failed');
 return check;
}
async function reserve(sql,channelId,body,imageSha,claims){
 const edition=JSON.stringify({kind:'piggy',eventId:body.eventId,clan:body.clan,
  sourceCommit:body.sourceCommit,projectionVersion:body.projectionVersion,
  templateVersion:body.templateVersion,imageSHA256:imageSha});
 const planSha=sha(edition+'\n'+body.message);
 const inserted=await sql.query('INSERT INTO '+SCHEMA+'publication_slots(kind,event_id,event_time_clan) VALUES($1,$2,$3) ON CONFLICT(kind,event_id,event_time_clan) DO NOTHING RETURNING id',
  ['piggy',body.eventId,body.clan]);
 if(inserted.length!==1){
  const current=await sql.query('SELECT s.status,r.projection_sha256,r.image_sha256,r.template_version,r.discord_message_id FROM '+SCHEMA+
   'publication_slots s LEFT JOIN '+SCHEMA+'message_receipts r ON r.slot_id=s.id AND r.receipt_status=\'active\' WHERE s.kind=$1 AND s.event_id=$2 AND s.event_time_clan=$3',
   ['piggy',body.eventId,body.clan]);
  if(current.length!==1)throw Error('Existing publication slot state is ambiguous');
  const row=current[0];
  if(row.status==='active'&&row.discord_message_id&&row.projection_sha256===body.projectionVersion&&
     row.image_sha256===imageSha&&row.template_version===body.templateVersion)
   return {decision:'already-published',messageId:String(row.discord_message_id)};
  throw Error('Existing Piggy publication requires manual reconciliation; automatic correction is disabled');
 }
 const slotId=inserted[0].id;
 const intent=await sql.query('INSERT INTO '+SCHEMA+'send_intents(slot_id,intent_kind,plan_sha256,projection_sha256,image_sha256,template_version,edition,destination_channel_id,approved_by,approved_at,approved_for_automatic_send) VALUES($1,\'first\',$2,$3,$4,$5,$6,$7,$8,now(),TRUE) RETURNING id',
  [slotId,planSha,body.projectionVersion,imageSha,body.templateVersion,edition,channelId,'github-actions-run-'+String(claims.run_id||'unknown')]);
 if(intent.length!==1)throw Error('Automatic Piggy send intent could not be reserved');
 await sql.query('INSERT INTO '+SCHEMA+'audit_events(slot_id,action,actor,details) VALUES($1,\'automatic_authorization_recorded\',$2,$3::jsonb)',
  [slotId,'github-actions-piggy-dispatch',JSON.stringify({kind:'piggy',eventId:body.eventId,clan:body.clan,
   channelId,sourceCommit:body.sourceCommit,runId:String(claims.run_id||''),runAttempt:String(claims.run_attempt||'')})]);
 return {decision:'reserved',slotId,intentId:intent[0].id,projectionVersion:body.projectionVersion,
  imageSha,templateVersion:body.templateVersion};
}
async function sendAndReadback(token,channelId,bytes,imageSha,body){
 const filename='Piggy_'+body.clan+'_'+body.report.date+'_FINAL.png';
 const form=new FormData();
 form.append('payload_json',JSON.stringify({content:body.message,allowed_mentions:{parse:[]},
  attachments:[{id:0,filename,description:'Final Piggy Race results from the approved canonical Stat Center ledger'}]}));
 form.append('files[0]',new Blob([bytes],{type:'image/png'}),filename);
 const posted=await discord(token,'https://discord.com/api/v10/channels/'+channelId+'/messages','POST',form);
 if(String(posted.channel_id)!==channelId||!/^\d{17,22}$/.test(String(posted.id)))throw Error('Discord send response not verifiable');
 const readback=await discord(token,'https://discord.com/api/v10/channels/'+channelId+'/messages/'+posted.id);
 if(String(readback.id)!==String(posted.id)||String(readback.channel_id)!==channelId||readback.content!==body.message)
  throw Error('Discord message readback does not match exact message');
 const attachment=(readback.attachments||[]).find(a=>a.filename===filename);
 if(!attachment||!String(attachment.url).startsWith('https://'))throw Error('Discord PNG attachment missing on readback');
 const response=await fetch(attachment.url,{signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('Discord PNG readback download failed');
 const actual=Buffer.from(await response.arrayBuffer());
 if(sha(actual)!==imageSha||actual.length!==bytes.length)throw Error('Discord PNG byte readback hash mismatch');
 return {messageId:String(posted.id),attachmentBytes:actual.length,filename};
}
async function recordReceipt(sql,channelId,intent,proof){
 await sql.query('INSERT INTO '+SCHEMA+'message_receipts(slot_id,intent_id,discord_channel_id,discord_message_id,projection_sha256,image_sha256,template_version,proof_method,verified_by,verified_at) VALUES($1,$2,$3,$4,$5,$6,$7,\'authenticated_discord_png_sha256\',\'github-actions-piggy-readback\',now())',
  [intent.slotId,intent.intentId,channelId,proof.messageId,intent.projectionVersion,intent.imageSha,intent.templateVersion]);
 await sql.query('UPDATE '+SCHEMA+'send_intents SET intent_status=\'receipt_recorded\',resolved_at=now() WHERE id=$1',[intent.intentId]);
 await sql.query('UPDATE '+SCHEMA+'publication_slots SET status=\'active\',row_version=row_version+1,updated_at=now() WHERE id=$1',[intent.slotId]);
 await sql.query('INSERT INTO '+SCHEMA+'audit_events(slot_id,action,actor,details) VALUES($1,\'api_receipt_recorded\',\'github-actions-piggy-readback\',$2::jsonb)',
  [intent.slotId,JSON.stringify({messageId:proof.messageId,channelId,attachmentBytes:proof.attachmentBytes,imageSHA256:intent.imageSha})]);
}
module.exports=async function handler(req,res){
 if(req.method!=='POST')return respond(res,405,{ok:false,decision:'method-not-allowed'});
 const env=process.env;
 if(env.VERCEL_ENV!=='production')return respond(res,404,{ok:false,decision:'not-found'});
 try{
  const auth=String(req.headers.authorization||'').match(/^Bearer\s+(.+)$/i);
  if(!auth)return respond(res,401,{ok:false,decision:'github-oidc-required'});
  const claims=await verifyGitHubOIDC(auth[1]);
  const body=req.body;
  const mainSha=await githubMainSha();
  if(!body||body.sourceCommit!==claims.sha||body.sourceCommit!==mainSha||
     String(env.VERCEL_GIT_COMMIT_SHA||'').toLowerCase()!==mainSha)
   throw Error('GitHub, payload and production deployment commits do not match');
  if(claims.event_name==='push'&&body.action!=='verify')throw Error('Main-push OIDC may only run a no-send verification');
  if(body.action==='verify')return respond(res,200,{ok:true,decision:'oidc-endpoint-and-deployment-verified',
   sendAttempted:false,policyEnabled:policy.enabled,sendEnabled:env.AVENGERS_PIGGY_AUTO_DISPATCH_ENABLED==='true'});
  if(!policy.enabled||policy.status!=='approved'||env.AVENGERS_PIGGY_AUTO_DISPATCH_ENABLED!=='true')
   return respond(res,423,{ok:false,decision:'automatic-piggy-dispatch-disabled'});
  if(policy.automaticDelete!==false)return respond(res,423,{ok:false,decision:'automatic-delete-policy-invalid'});
  const {bytes,imageSha}=validateBody(body,claims,mainSha,env);
  const source=sourceEventForDispatch({approvedUpdates:approved,holds,eventId:body.eventId,clan:body.clan,
   minimumEventDateExclusive:policy.minimumEventDateExclusive});
  if(source.event.date!==body.report.date)throw Error('PNG event date differs from canonical source');
  if(body.report.lobbyLabel!==source.lobbyLabel)throw Error('PNG lobby identity differs from canonical source');
  const expectedRows=source.rows;
  const scoreRows=expectedRows.filter(r=>typeof r.score==='number'&&Number.isFinite(r.score));
  const starsRows=expectedRows.filter(r=>typeof r.stars==='number'&&Number.isFinite(r.stars));
  const sparksRows=expectedRows.filter(r=>typeof r.sparks==='number'&&Number.isFinite(r.sparks));
  const expected={participants:expectedRows.length,knownScoreSum:expectedRows.reduce((n,r)=>n+(r.score??0),0),
   knownStars:expectedRows.reduce((n,r)=>n+(r.stars??0),0),knownSparks:expectedRows.reduce((n,r)=>n+(r.sparks??0),0),
   unknownScoreRows:expectedRows.length-scoreRows.length,unknownStarRows:expectedRows.length-starsRows.length,unknownSparkRows:expectedRows.length-sparksRows.length};
  for(const k of Object.keys(expected))if(body.report[k]!==expected[k])throw Error('PNG report/source mismatch: '+k);
  const message=buildPiggyMessage(source.event,body.clan,body.report);
  if(message!==body.message)throw Error('Message differs from source-derived expected text');
  const route=resolveSummaryDestination({kind:'piggy',clan:body.clan},env);
  if(route.channelId!==policy.destinationChannelId)throw Error('Destination differs from approved fixed policy');
  const bot=env.DISCORD_BOT_TOKEN;
  if(typeof bot!=='string'||bot.length<30)throw Error('Discord bot credential unavailable');
  const sql=db(env);
  await checkPreflight(sql,bot,route.channelId,env);
  const reserved=await reserve(sql,route.channelId,body,imageSha,claims);
  if(reserved.decision==='already-published')return respond(res,200,{ok:true,decision:'already-published',messageId:reserved.messageId});
  let proof;
  try{
   proof=await sendAndReadback(bot,route.channelId,bytes,imageSha,body);
   await recordReceipt(sql,route.channelId,reserved,proof);
  }catch(error){
   try{
    await sql.query('UPDATE '+SCHEMA+'publication_slots SET status=\'manual_reconciliation_required\',updated_at=now() WHERE id=$1',[reserved.slotId]);
    await sql.query('INSERT INTO '+SCHEMA+'audit_events(slot_id,action,actor,details) VALUES($1,\'manual_reconciliation_required\',\'github-actions-piggy-dispatch\',$2::jsonb)',
     [reserved.slotId,JSON.stringify({reason:'send-or-readback-uncertain',runId:String(claims.run_id||'')})]);
   }catch{}
   return respond(res,502,{ok:false,decision:'manual-reconciliation-required',eventId:body.eventId,clan:body.clan});
  }
  return respond(res,200,{ok:true,decision:'sent',eventId:body.eventId,clan:body.clan,
   channelId:route.channelId,messageId:proof.messageId,attachmentBytes:proof.attachmentBytes,imageSHA256:imageSha});
 }catch(error){
  const msg=String(error?.message||'');
  const status=/already|existing Piggy publication requires/i.test(msg)?409:
   /github|oidc|identity|authorization/.test(msg.toLowerCase())?401:422;
  return respond(res,status,{ok:false,decision:'blocked',reason:msg.slice(0,240)});
 }
};
module.exports.config={api:{bodyParser:{sizeLimit:'4mb'}}};
