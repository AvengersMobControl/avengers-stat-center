'use strict';
/**
 * Source-only screenshot collector; no Discord sends or website writes.
 * Vercel's UTC cron covers the two Central-time windows. The local time gate
 * runs BEFORE any Discord, Neon or remote website IO. Exit after a genuinely
 * verified published event source coverage receipt, never on download alone.
 */
const crypto=require('node:crypto');
const config=require('../../discord-ingest-config.json');
const {scanChannel,safeError}=require('../../server/result-source-intake.cjs');
const {makeStore}=require('../../server/result-source-store.cjs');
const {activeWindow,channelCutoff,scopedKey,chooseNext,publicationCoverage}=require('../../server/result-intake-window.cjs');
const KEYS=Object.keys(config.channels);
const PAGES='https://avengersmobcontrol.github.io/avengers-stat-center/';
function authorized(actual,secret){
  if(!secret||typeof actual!=='string'||!actual.startsWith('Bearer '))return false;
  const a=Buffer.from(actual.slice(7)),b=Buffer.from(secret);
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
}
function respond(res,code,data){
  return res.status(code).setHeader('Cache-Control','private, no-store').json(data);
}
async function publicLedger(fetchImpl=fetch){
  const get=async path=>{
    const url=PAGES+path+(path.includes('?')?'&':'?')+'checked='+Date.now();
    const r=await fetchImpl(url,{headers:{Accept:'application/json'},cache:'no-store',
      signal:AbortSignal.timeout(12000)});
    if(!r.ok)throw Error('public-ledger-http-'+r.status);
    return r.json();
  };
  const manifest=await get('release-manifest.json');
  if(!/^[a-f0-9]{40}$/.test(String(manifest.sourceCommit)) ||
     !/^[a-f0-9]{64}$/.test(String(manifest.version)) ||
     !/^exports\/ledger\.[a-f0-9]+\.json$/.test(String(manifest.exports?.ledger))){
    throw Error('public-ledger-manifest-invalid');
  }
  const l=await get(manifest.exports.ledger);
  if(l.version!==manifest.version||!Array.isArray(l.data?.events))
    throw Error('public-ledger-version-mismatch');
  return {publicCommit:manifest.sourceCommit,version:manifest.version,events:l.data.events};
}
async function handler(req,res){
  if(!['GET','POST'].includes(req.method))return respond(res,405,{error:'method-not-allowed'});
  const cron=req.method==='GET';
  if(!authorized(req.headers.authorization,cron?process.env.CRON_SECRET:process.env.DISCORD_PULL_SECRET))
    return respond(res,401,{error:'unauthorized'});
  // No background network, database, or Discord activity outside the windows.
  const window=cron?activeWindow(Date.now()):null;
  if(cron&&!window)return respond(res,200,{status:'outside-approved-windows',networkActivity:false,
    next:'Friday 06:00–07:30 or Sunday 16:00–18:30 America/Chicago'});
  if(!process.env.AVENGERS_RESULTS_DATABASE_URL||!process.env.DISCORD_BOT_TOKEN){
    console.error('[source-intake] configuration-missing');
    return respond(res,503,{error:'private-intake-not-configured'});
  }
  let channelKey=null;
  try{
    const {neon}=require('@neondatabase/serverless');
    const sql=neon(process.env.AVENGERS_RESULTS_DATABASE_URL);
    const store=makeStore({query:(q,params)=>sql.query(q,params)});
    if(!cron){
      channelKey=req.body?.channelKey;
      if(req.body?.action==='status')return respond(res,200,
        {kind:'private-source-intake',publication:'not-attempted',channels:await store.status()});
      if(!KEYS.includes(channelKey))return respond(res,400,{error:'unknown-channel'});
      const report=await scanChannel({channelKey,store,token:process.env.DISCORD_BOT_TOKEN});
      return respond(res,report.status==='busy'?202:200,report);
    }
    const existing=await store.websitePublished(window.id);
    if(existing)return respond(res,200,{status:'stopped-after-website-publication',
      window:window.id,publicCommit:existing.sourceSha,releaseVersion:existing.releaseVersion,
      discordRequests:0,publication:'verified'});
    // Full previous-window publication checkpoint is used for delayed AV-2
    // posts. Recovered source attachments are SHA-deduplicated against history.
    const prior=await store.previousWebsitePublication();
    if(Number.isFinite(prior)&&prior<window.startMs){
      const earlier=Math.max(window.cutoffs.av2,prior);
      window.cutoffs.av2=earlier; window.cutoffs.kraken=earlier;
    }
    let checkpoints=await store.windowCheckpoints(window,scopedKey);
    const selected=chooseNext(window,checkpoints,2);
    const capture=[];
    for(const k of selected){
      channelKey=k;
      try{
        const result=await scanChannel({channelKey:k,checkpointKey:scopedKey(window,k),
          cutoffMs:channelCutoff(window,k),store,token:process.env.DISCORD_BOT_TOKEN});
        capture.push({channel:k,status:result.status,cycleComplete:result.cycleComplete||false,
          newProofs:result.newOriginalProofs||0,attachments:result.attachmentsAccounted||0});
      }catch(err){
        // Another channel's verified results must not be blocked by one
        // incomplete AV-2 or source error. Failure remains visible.
        const errorCode=safeError(err);
        capture.push({channel:k,status:'failed',errorCode});
        console.error('[source-intake] '+JSON.stringify({window:window.id,channel:k,
          status:'source-failed',errorCode}));
      }
    }
    checkpoints=await store.windowCheckpoints(window,scopedKey);
    let coverage=null,publicCommit=null,version=null,publicError=null;
    try{
      const sourceRows=await store.sourceRows(window);
      const live=await publicLedger();
      publicCommit=live.publicCommit; version=live.version;
      coverage=publicationCoverage(window,checkpoints,sourceRows,live.events);
      if(coverage.websitePublished){
        await store.markWebsitePublished(window,{publicCommit,version,coverage});
      }
    }catch(err){
      publicError=safeError(err);
      console.error('[source-intake] '+JSON.stringify({window:window.id,
        status:'publication-verification-unavailable',errorCode:publicError}));
    }
    const verified=coverage?.websitePublished===true;
    const failed=capture.some(x=>x.status==='failed');
    const result={window:window.id,localWindow:window.mode,
      status:verified?'stopped-after-website-publication':failed?'source-partially-failed':'awaiting-website-publication',
      publication:verified?'verified':'not-verified',publicCommit:verified?publicCommit:null,
      releaseVersion:verified?version:null,scans:capture,
      outstanding:verified?[]:{
        missingScan:coverage?.missingScan||[],
        missingOriginals:coverage?.missingOriginals??null,
        flashChannelsAwaitingPublication:coverage?.flashes?.filter(f=>!f.confirmed).map(f=>f.channel)||[],
        primaryAwaitingPublication:!coverage?.mainKind,
        av2Incomplete:coverage?.av2?.partial??null
      },minutesRemaining:window.minutesLeft};
    // This is the actionable failure signal for end-of-window ChatGPT
    // publication watchdogs; it does not claim to notify the user itself.
    if(window.minutesLeft<=5&&!verified){
      console.error('[source-intake] '+JSON.stringify({status:'FAILED_PUBLICATION',
        window:window.id,missingScan:result.outstanding?.missingScan,
        missingFlash:result.outstanding?.flashChannelsAwaitingPublication,
        primaryMissing:result.outstanding?.primaryAwaitingPublication}));
    }
    console.info('[source-intake] '+JSON.stringify({window:window.id,status:result.status,
      scanned:capture.map(x=>x.channel),websiteVerified:verified}));
    return respond(res,failed?503:200,result);
  }catch(err){
    const code=safeError(err);
    console.error('[source-intake] '+JSON.stringify({window:window?.id||null,
      channel:channelKey,errorCode:code,publication:'not-attempted'}));
    return respond(res,503,{status:'failed',window:window?.id||null,errorCode:code,
      publication:'not-attempted'});
  }
}
module.exports=handler;
module.exports.authorized=authorized;
module.exports.publicLedger=publicLedger;
