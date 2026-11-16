'use strict';
// Isolated, source-only intake. Never publishes event data or Discord messages.
// GET is a Vercel Cron invocation; POST is private leader/operator replay.
const crypto=require('node:crypto');
const config=require('../../discord-ingest-config.json');
const {scanChannel}=require('../../server/result-source-intake.cjs');
const {makeStore}=require('../../server/result-source-store.cjs');
const KEYS=Object.keys(config.channels);
function authorized(actual,secret){
  if(!secret||typeof actual!=='string'||!actual.startsWith('Bearer '))return false;
  const a=Buffer.from(actual.slice(7)),b=Buffer.from(secret);
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
}
function respond(res,code,data){return res.status(code).setHeader('Cache-Control','private, no-store').json(data);}
async function handler(req,res){
  if(!['GET','POST'].includes(req.method))return respond(res,405,{error:'method-not-allowed'});
  const cron=req.method==='GET';
  if(!authorized(req.headers.authorization,cron?process.env.CRON_SECRET:process.env.DISCORD_PULL_SECRET))
    return respond(res,401,{error:'unauthorized'});
  let channelKey;
  if(cron){
    // One small, bounded channel page every five minutes; independent leases
    // make repeated/overlapping calls safe. No website publication side effects.
    channelKey=KEYS[Math.floor(Date.now()/300000)%KEYS.length];
  }else{
    channelKey=req.body?.channelKey;
    if(req.body?.action==='status')channelKey=KEYS[0];
    if(!KEYS.includes(channelKey))return respond(res,400,{error:'unknown-channel'});
  }
  if(!process.env.AVENGERS_RESULTS_DATABASE_URL||!process.env.DISCORD_BOT_TOKEN){
    console.error('[source-intake] configuration-missing');
    return respond(res,503,{error:'private-intake-not-configured'});
  }
  try{
    const {neon}=require('@neondatabase/serverless');
    const sql=neon(process.env.AVENGERS_RESULTS_DATABASE_URL);
    const store=makeStore({query:(q,params)=>sql.query(q,params)});
    if(!cron&&req.body?.action==='status')return respond(res,200,{kind:'private-source-intake',publication:'not-attempted',channels:await store.status()});
    const report=await scanChannel({channelKey,store,token:process.env.DISCORD_BOT_TOKEN});
    console.info('[source-intake] '+JSON.stringify({channel:channelKey,status:report.status,
      cycleComplete:report.cycleComplete||false,originals:report.newOriginalProofs||0,
      attachments:report.attachmentsAccounted||0,publication:'not-attempted'}));
    return respond(res,report.status==='busy'?202:200,report);
  }catch(e){
    // Do not echo private Discord source URLs, IDs, tokens, or query errors.
    const {safeError}=require('../../server/result-source-intake.cjs');
    const code=safeError(e);
    console.error('[source-intake] '+JSON.stringify({channel:channelKey,errorCode:code,
      publication:'not-attempted'}));
    return respond(res,503,{status:'failed',channel:channelKey,
      errorCode:code,publication:'not-attempted'});
  }
}
module.exports=handler;
module.exports.authorized=authorized;
