'use strict';
// Short-lived, preview-only one-channel history import runner.
// No source message text or identifiers are returned to the browser.
// Remove this file after historical backfill; never merge into production.
const { backfillPage, productionStore } = require('../../server/discord-guide-backfill.cjs');
const { researchScope } = require('../../server/discord-guide-research.cjs');
module.exports=async function handler(req,res) {
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Robots-Tag','noindex');
  const respond=(status,body)=>res.status(status).send(JSON.stringify(body));
  if(req.method!=='GET') return respond(405,{error:'GET only'});
  if(process.env.VERCEL_ENV!=='preview'||
    process.env.VERCEL_GIT_COMMIT_REF!=='feature/discord-strategy-research-20261021')
    return respond(404,{error:'Not available'});
  if(Date.now()>Date.parse('2026-10-23T06:00:00Z'))
    return respond(410,{error:'Import runner expired'});
  const channelId=String(req.query?.channelId||'');
  const scope=researchScope(process.env);
  if(!scope||!scope.has(channelId))return respond(400,{error:'Unapproved source channel'});
  const requested=Number(req.query?.pages||1);
  const pages=Number.isInteger(requested)&&requested>=1&&requested<=4?requested:1;
  const summary={mode:'preview-private-import',channelId,pagesProcessed:0,
    totalScanned:0,totalSaved:0,candidateCount:0,completed:false};
  try {
    const store=productionStore();
    for(let i=0;i<pages;i++) {
      const result=await backfillPage(channelId,process.env,store);
      if(result.status===429) {
        summary.rateLimited=true;
        summary.retryAfterMs=result.retryAfterMs;
        break;
      }
      if(result.status!==200)return respond(result.status,{
        ...summary,error:result.error||'Source page failed',failedAtPage:i+1});
      summary.pagesProcessed++;
      summary.totalScanned+=result.scanned||0;
      summary.totalSaved+=result.saved||0;
      summary.candidateCount+=result.candidateCount||0;
      if(result.finished){summary.completed=true;break;}
    }
    return respond(200,summary);
  }catch(err){
    console.error('Guide import error',err?.code||err?.name||'Error');
    return respond(503,{...summary,error:'Private history import failed'});
  }
};
