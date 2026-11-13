'use strict';
const core=require('../../server/discord-identity-review.cjs');
function fail(res,status,message){
 res.statusCode=status;res.setHeader('Content-Type','text/plain; charset=utf-8');return res.end(message);
}
function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store, max-age=0');
 res.setHeader('Pragma','no-cache');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('X-Frame-Options','DENY');
 if(req.method!=='GET')return fail(res,405,'GET required');
 const env=process.env;
 const session=core.signedSession(req,env);
 if(!session){
  return res.redirect(302,'/api/auth/discord/login?returnTo=%2Fapi%2Fdiscord%2Fidentity-review');
 }
 if(!env.DISCORD_BOT_TOKEN||!/^\d{17,22}$/.test(env.DISCORD_GUILD_ID||''))
  return fail(res,503,'Discord member export is not configured');
 try{
  const guildUrl='https://discord.com/api/v10/guilds/'+env.DISCORD_GUILD_ID;
  const [guild,member]=await Promise.all([
   core.discordRequest(guildUrl,env),
   core.discordRequest(guildUrl+'/members/'+session.id,env)
  ]);
  if(String(member?.user?.id)!==session.id)return fail(res,403,'Discord membership check failed');
  const isOwner=String(guild.owner_id)===session.id;
  const roles=isOwner?[]:await core.discordRequest(guildUrl+'/roles',env);
  if(!core.canReview(member,guild,roles,env))
   return fail(res,403,'This member-roster export is restricted to server owners and authorized administrators.');
  const members=await core.memberRoster(env);
  // Use the same canonical roster projection as the AVENGERS Stat Center.
  // Player names and status are already published; PRIVATE Discord identities are not.
  // Prefer the current public, immutable release projection as a roster source.
  // Vercel functions need not bundle the build-only index.html and legacy scripts.
  const siteUrl='https://avengersmobcontrol.github.io/avengers-stat-center/';
  const manifestRes=await fetch(siteUrl+'release-manifest.json',{cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(!manifestRes.ok)throw Error('Canonical release manifest unavailable');
  const manifest=await manifestRes.json();
  const exportPath=String(manifest.exports?.projection||'');
  if(!/^exports\/projection\.[a-f0-9]{8,64}\.json$/.test(exportPath))
   throw Error('Canonical release path invalid');
  const projectionRes=await fetch(siteUrl+exportPath,{cache:'no-store',signal:AbortSignal.timeout(8000)});
  if(!projectionRes.ok)throw Error('Canonical release projection unavailable');
  const wrapped=await projectionRes.json();
  if(!Array.isArray(wrapped.data?.people))throw Error('Invalid canonical projection');
  const all=wrapped.data.people.map(p=>({name:p.name,status:p.status}));
  const live=all.filter(p=>p.status==='Active'||p.status==='AV2');
  const aliases={};
  const rows=members.map(m=>{
   const suggestion=core.suggest(m,live,aliases);
   return {discordId:String(m.user.id),nickname:m.nick||'',globalName:m.user.global_name||'',
    username:m.user.username||'',joinedAt:m.joined_at||'',roles:m.roles||[],
    suggestedCanonical:suggestion.suggestion,matchStatus:suggestion.status,
    alternatives:suggestion.choices.join(' | '),rosterStatus:
     live.find(p=>p.name===suggestion.suggestion)?.status||'',
    evidence:suggestion.evidence.join(' | ')};
  }).sort((a,b)=>(a.suggestedCanonical||a.nickname||a.username).localeCompare(b.suggestedCanonical||b.nickname||b.username));
  const columns=['Discord User ID','Server nickname','Global name','Username','Joined Discord server',
   'Role IDs','Suggested canonical','Roster status','Match status','Other candidates','Evidence','Confirmed canonical (leader review)'];
  const data=[columns,...rows.map(r=>[r.discordId,r.nickname,r.globalName,r.username,r.joinedAt,r.roles.join(';'),
   r.suggestedCanonical,r.rosterStatus,r.matchStatus,r.alternatives,r.evidence,''])];
  if(req.query?.format==='csv'){
   res.setHeader('Content-Type','text/csv; charset=utf-8');
   res.setHeader('Content-Disposition','attachment; filename="AVENGERS_Discord_Canonical_Matching_Review.csv"');
   return res.status(200).send(core.csv(data));
  }
  const count=rows.length,suggested=rows.filter(r=>r.matchStatus==='suggested').length;
  const tr=rows.map(r=>'<tr><td>'+esc(r.nickname||r.globalName||r.username)+'</td><td>'+esc(r.username)+
   '</td><td><code>'+esc(r.discordId)+'</code></td><td>'+esc(r.suggestedCanonical||r.alternatives||'—')+
   '</td><td>'+esc(r.matchStatus)+'</td></tr>').join('');
  const page='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
   '<meta name="robots" content="noindex,nofollow"><title>AVENGERS Discord Identity Review</title>'+
   '<style>body{background:#071321;color:#eef4ff;font:15px system-ui;margin:30px auto;max-width:1160px;padding:0 16px}'+
   'h1{font-size:25px}p{color:#b7c8da}a{color:#9cceff}table{border-collapse:collapse;width:100%;font-size:13px}'+
   'td,th{padding:9px;border-bottom:1px solid #34485e;text-align:left}tr:nth-child(even){background:#14243a}'+
   '.scroll{overflow:auto}.button{display:inline-block;padding:12px 16px;background:#396db5;border-radius:9px;font-weight:bold}'+
   'code{font-size:12px}</style></head><body><h1>AVENGERS Discord identity review</h1>'+
   '<p>'+count+' non-bot Discord members retrieved; '+suggested+' have a single suggested canonical match. <b>Zero links auto-confirmed.</b></p>'+
   '<p>Suggestions are based on current AVENGERS/AV-2 canonical names and established aliases. Match status is <b>suggested</b>, not approved. Review the CSV and fill "Confirmed canonical" only after verifying identity.</p>'+
   '<p><a class="button" href="/api/discord/identity-review?format=csv">Download private matching CSV</a></p>'+
   '<div class="scroll"><table><thead><tr><th>Display</th><th>Discord username</th><th>Permanent Discord ID</th><th>Suggested canonical</th><th>Status</th></tr></thead><tbody>'+tr+'</tbody></table></div>'+
   '<p>This page is private, not part of the public Stat Center. No member names, Discord identifiers or approved links are committed to GitHub.</p></body></html>';
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'");
  return res.status(200).send(page);
 }catch(e){
  console.error('Discord roster review failed:',e.message);
  return fail(res,503,'Unable to retrieve the complete private Discord member roster. No partial list was exported.');
 }
};
