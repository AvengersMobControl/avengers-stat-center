'use strict';
// Temporary preview-only diagnostic: source content is NEVER returned or logged.
// Use Vercel deployment protection; disable after initial access verification.
const { researchScope, discordGet } = require('../../server/discord-guide-research.cjs');
module.exports=async function handler(req,res) {
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method!=='GET')return res.status(405).send(JSON.stringify({error:'GET only'}));
  if(process.env.VERCEL_ENV!=='preview'||process.env.VERCEL_GIT_COMMIT_REF!=='feature/discord-strategy-research-20261021')
    return res.status(404).send(JSON.stringify({error:'Not available'}));
  if(Date.now()>Date.parse('2026-10-23T06:00:00Z'))return res.status(410).send(JSON.stringify({error:'Diagnostic expired'}));
  const scope=researchScope(process.env),token=process.env.DISCORD_BOT_TOKEN;
  if(!scope||!token||!process.env.DISCORD_GUILD_ID)return res.status(503).send(JSON.stringify({error:'Private configuration missing'}));
  const channels=[];
  for(const [channelId,policy] of scope) {
    const c=await discordGet('/channels/'+channelId,token);
    if(c.rateLimited){channels.push({channelId,status:'rate-limited',retryAfterMs:c.retryAfterMs});break;}
    if(!c.data){channels.push({channelId,status:c.status===403?'forbidden':'unavailable'});continue;}
    if(String(c.data.guild_id)!==process.env.DISCORD_GUILD_ID){
      channels.push({channelId,status:'wrong-guild'});continue;
    }
    const p=await discordGet('/channels/'+channelId+'/messages?limit=10',token);
    if(p.rateLimited){channels.push({channelId,status:'rate-limited',retryAfterMs:p.retryAfterMs});break;}
    if(!Array.isArray(p.data)){channels.push({channelId,status:'history-unavailable'});continue;}
    channels.push({
      channelId,
      status:'readable',
      latestPageCount:p.data.length,
      nonemptyTextCount:p.data.filter(m=>String(m.content||'').trim().length>0).length,
      attachmentMessageCount:p.data.filter(m=>Array.isArray(m.attachments)&&m.attachments.length>0).length,
      cutoff:policy.since,
      priority:policy.priority
    });
  }
  res.status(200).send(JSON.stringify({mode:'preview-diagnostic-no-content',checked:channels.length,channels}));
};
