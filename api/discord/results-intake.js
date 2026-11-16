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
    if(req.query?.status==='1')return reply(res,200,{status:'private_state',...(await store.stat¶»§q«^