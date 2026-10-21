'use strict';
const {backfillPage,productionStore,authorizedOperator}=require('../../server/discord-guide-backfill.cjs');
function reply(res,status,body){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.status(status).send(JSON.stringify(body));
}
module.exports=async function handler(req,res){
  if(req.method!=='POST')return reply(res,405,{error:'POST required'});
  const origin=req.headers.origin;
  const host=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim();
  if(origin) {
    let allowed=false;
    try{const u=new URL(origin);allowed=u.protocol==='https:'&&u.host===host;}catch{}
    if(!allowed)return reply(res,403,{error:'Origin denied'});
  }
  try{
    if(!(await authorizedOperator(req,process.env)))return reply(res,401,{error:'Guide reviewer access required'});
    const body=typeof req.body==='string'?JSON.parse(req.body):(req.body||{});
    if(typeof body.channelId!=='string')return reply(res,400,{error:'Valid channelId required'});
    const result=await backfillPage(body.channelId,process.env,productionStore());
    return reply(res,result.status,result);
  }catch(err){
    // Never log raw source messages or secrets.
    console.error('Private guide backfill failed',err?.code||err?.name||'Error');
    return reply(res,503,{error:'Private guide backfill unavailable'});
  }
};
