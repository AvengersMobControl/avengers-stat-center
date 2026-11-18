'use strict';
// Isolated, source-only intake. Never publishes event data or Discord messages.
// GET is a Vercel Cron invocation; POST is private leader/operator replay.
// Leader 2026-11-18: scheduled intake runs only in the hour before each posting
// run (Sunday 6 PM and Friday 7 AM America/Chicago) and sweeps every channel for
// everything posted since the last run. vercel.json fires at :00/:20/:40 in both
// the CST and CDT UTC hours; inIntakeWindow() drops the ones outside the window.
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
function inIntakeWindow(nowMs=Date.now()){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',
    weekday:'short',hour:'numeric',hourCycle:'h23'}).formatToParts(new Date(nowMs)).map(p=>[p.type,p.value]));
  const hour=Number(parts.hour);
  return (parts.weekday==='Sun'&&hour===18)||(parts.weekday==='Fri'&&hour===7);
}
// Page through each channel until its lookback window is exhausted. Checkpoints
// persist, so a sweep cut short by the deadline resumes on the next :20/:40 call.
async function sweepAll({keys,scan,deadline}){
  const out={channels:{},newOriginalProofs:0,attachmentsAccounted:0,unfinished:[]};
  for(const key of keys){
    let done=false,pages=0;
    while(!done&&Date.now()<deadline){
      const r=await scan({channelKey:key});
      if(r.status==='busy')break;
      pages++;out.newOriginalProofs+=r.newOriginalProofs||0;out.attachmentsAccounted+=r.attachmentsAccounted||0;
      done=r.cycleComplete===true;
    }
    out.channels[key]={pages,complete:done};
    if(!done)out.unfinished.push(key);
  }
  out.complete=out.unfinished.length===0;
  return out;
}
function respond(res,code,data){return res.status(code).setHeader('Cache-Control','private, no-store').json(data);}
async function handler(req,res){
  if(!['GET','POST'].includes(req.method))return respond(res,405,{error:'method-not-allowed'});
  const cron=req.method==='GET';
  if(!authorized(req.headers.authorization,cron?process.env.CRON_SECRET:process.env.DISCORD_PULL_SECRET))
    return respond(res,401,{error:'unauthorized'});
  let channelKey;
  if(cron){
    if(!inIntakeWindow())return respond(res,200,{status:'outside-intake-window',publication:'not-attempted'});
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
    if(cron){
      const started=Date.now();
      const sweep=await sweepAll({keys:KEYS,deadline:started+240000,
        scan:({channelKey:key})=>scanChannel({channelKey:key,store,token:process.env.DISCORD_BOT_TOKEN})});
      console.info('[source-intake] '+JSON.stringify({sweep:true,complete:sweep.complete,unfinished:sweep.unfinished,
        originals:sweep.newOriginalProofs,attachments:sweep.attachmentsAccounted,publication:'not-attempted'}));
      return respond(res,200,{status:'source-sweep',...sweep,publication:'not-attempted'});
    }
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
module.exports.inIntakeWindow=inIntakeWindow;
module.exports.sweepAll=sweepAll;
