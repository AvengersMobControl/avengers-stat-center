'use strict';
// The ONLY automatic operation here is private read-only source collection.
// This route must never stage data, create new members, publish website events or send Discord posts.
const config=require('../../discord-ingest-config.json');
const {scanChannel,verifyPending,discordClient,errorCode}=require('../../server/results-intake-core.cjs');
const {connect}=require('../../server/results-intake-store.cjs');
module.exports.config={maxDuration:60};
function reply(res,status,payload){
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.status(status).json(payload);
}
function permitted(req,env){
  const auth=String(req.headers.authorization||'');
  return Boolean((env.CRON_SECRET && auth==='Bearer '+env.CRON_SECRET) ||
    (env.DISCORD_PULL_SECRET && auth==='Bearer '+env.DISCORD_PULL_SECRET));
}
async function handler(req,res,options={}){
  const env=options.env||process.env;
  if(req.method!=='GET'&&req.method!=='POST')
    return reply(res,405,{status:'method_not_allowed'});
  if(!permitted(req,env))return reply(res,401,{status:'unauthorized'});
  if(!env.DISCORD_BOT_TOKEN||!env.AVENGERS_DISPATCH_DATABASE_URL)
    return reply(res,503,{status:'missing_private_configuration'});
  let store,owner,run;
  try{
    store=options.store||connect(env.AVENGERS_DISPATCH_DATABASE_URL,config.channels);
    if(req.query?.status==='1')return reply(res,200,{status:'private_state',...(await store.status())});
    owner=await store.acquireLease();
    if(!owner)return reply(res,409,{status:'another_intake_running'});
    run=await store.beginRun();
    const discord=options.discord||discordClient(env.DISCORD_BOT_TOKEN);
    const results=[],failures=[];
    for(const [key,channel] of Object.entries(config.channels)){
      try{
        results.push(await scanChannel({channelKey:key,channelId:channel.id,store,discord,
          maxPages:2,pageSize:100}));
      }catch(e){failures.push({channelKey:key,code:errorCode(e)});}
    }
    let proof={attempted:0,verified:0,failed:0};
    try{proof=await verifyPending({store,discord,limit:8,http:options.http||fetch});}
    catch(e){failures.push({channelKey:'proof_queue',code:errorCode(e)});}
    const continued=results.filter(x=>!x.complete).length;
    const state=await store.status();
    const statuses=state.attachmentStatus||{};
    const outstanding=(statuses.pending||0)+(statuses.retry||0)+
      (statuses.blocked||0)+(statuses.unsupported||0);
    const status=failures.length||continued||outstanding||
      results.length!==Object.keys(config.channels).length
      ?'incomplete':'source_intake_verified';
    const counts={channelsAttempted:results.length+failures.filter(x=>x.channelKey!=='proof_queue').length,
      channelsComplete:results.filter(x=>x.complete).length,
      channelsContinuing:continued,messages:results.reduce((n,x)=>n+x.messages,0),
      attachments:results.reduce((n,x)=>n+x.attachments,0),
      proofsAttempted:proof.attempted,proofsVerified:proof.verified,
      proofFailures:proof.failed,channelFailures:failures.length,proofsOutstanding:outstanding};
    await store.finishRun(run,status,counts);
    return reply(res,status==='source_intake_verified'?200:503,{
      status,counts,
      // Source ingestion alone is NEVER a published event/no-change.
      websitePublished:false,
      pendingReview:true,
      ...(failures.length?{errors:failures}: {})
    });
  }catch(error){
    if(store&&run)try{await store.finishRun(run,'failed',{
      errorCode:errorCode(error),websitePublished:false});}catch{}
    return reply(res,503,{status:'intake_failed',code:errorCode(error),websitePublished:false});
  }finally{
    if(store&&owner)try{await store.releaseLease(owner);}catch{}
  }
}
module.exports=handler;
module.exports.permitted=permitted;
