'use strict';
// Public health: ONLY dates/status/counts, never private identities, snowflakes or URLs.
// Runs independently of ChatGPT's 'completed' label; flags stale/partial source scans.
const {connect}=require('../../server/results-intake-store.cjs');
const config=require('../../discord-ingest-config.json');
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET')return res.status(405).json({status:'method_not_allowed'});
  if(!process.env.AVENGERS_DISPATCH_DATABASE_URL)
    return res.status(503).json({status:'unconfigured'});
  try{
    const state=await connect(process.env.AVENGERS_DISPATCH_DATABASE_URL,config.channels).status();
    const last=state.lastRun,finished=last?.finished_at?Date.parse(last.finished_at):NaN;
    const fresh=Number.isFinite(finished)&&Date.now()-finished<36*3600000;
    const complete=state.channels?.total===Object.keys(config.channels).length &&
      state.channels?.continuing===0 && last?.status==='source_intake_verified';
    const blocked=state.attachmentStatus?.blocked||0;
    const outstanding=(state.attachmentStatus?.pending||0)+
      (state.attachmentStatus?.retry||0)+(state.attachmentStatus?.unsupported||0);
    const healthy=fresh&&complete&&blocked===0&&outstanding===0;
    return res.status(healthy?200:503).json({
      status:healthy?'source_intake_healthy':'source_intake_needs_attention',
      lastRunAt:last?.fin¶»§q«^