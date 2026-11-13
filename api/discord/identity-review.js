'use strict';
const core=require('../../server/discord-identity-review.cjs');
const bindings=require('../../server/discord-confirmed-bindings.cjs');
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
  // Only already leader-confirmed private DB records are eligible for ID
  // resolution. Verify exact username and joined-at before persisting a
  // full Discord snowflake; never use user-pasted rounded Excel values.
  let verified=new Map(),bindingError=false;
  try {
   const q=bindings.productionQuery(env);
   const resolved=await bindings.synchronize(q,members);
   verified=bindings.confirmedById(resolved);
   if(resolved.some(r=>['joined-date-mismatch','identity-conflict','ambiguous-username'].includes(r.state)))
    bindingError=true;
  }catch(e){
   bindingError=true;
   console.error('Private Discord bindings unavailable:',e.message);
  }
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
  // These aliases already ship in the public release-data bundle. This
  // additional public JSON export contains NO Discord identities or private strategies.
  let aliases={};
  const aliasesPath=String(manifest.exports?.identityAliases||'');
  if(/^exports\/identityAliases\.[a-f0-9]{8,64}\.json$/.test(aliasesPath)){
   const aliasRes=await fetch(siteUrl+aliasesPath,{cache:'no-store',signal:AbortSignal.timeout(8000)});
   if(aliasRes.ok){
    const aliasJson=await aliasRes.json();
    if(aliasJson.data&&typeof aliasJson.data==='object'&&!Array.isArray(aliasJson.data))
     aliases=aliasJson.data;
   }
  }
  const rows=members.map(m=>{
   const suggestion=core.suggest(m,all,aliases);
   const confirmed=verified.get(String(m.user.id))||[];
   const confirmedName=confirmed.join(' | ');
   const isConfirmed=confirmed.length>0;
   return {discordId:String(m.user.id),nickname:m.nick||'',globalName:m.user.global_name||'',
    username:m.user.username||'',joinedAt:m.joined_at||'',roles:m.roles||[],
    suggestedCanonical:isConfirmed?confirmedName:suggestion.suggestion,
    confirmedCanonical:confirmedName,
    matchStatus:isConfirmed?'confirmed':suggestion.status,
    matchStrength:isConfirmed?100:suggestion.score,
    reason:isConfirmed?'Leader-confirmed; exact Discord ID verified against username and joined date':suggestion.reason,
    source:isConfirmed?'private verified binding':suggestion.source,
    alternatives:isConfirmed?'':suggestion.candidates.slice(1).map(c=>c.canonical+' ('+c.score+')').join(' | '),
    topThree:isConfirmed?confirmedName:suggestion.candidates.map(c=>c.canonical+' ('+c.score+'; '+c.rosterStatus+')').join(' | '),
    rosterStatus:isConfirmed?confirmed.map(n=>all.find(p=>p.name===n)?.status||'Unlisted').join(' / '):
     all.find(p=>p.name===suggestion.suggestion)?.status||'',
    evidence:isConfirmed?'Verified against Discord member record':suggestion.evidence.join(' | ')};
  });
  // Two Discord accounts pointing to one canonical identity must always be
  // surfaced for manual review, even when each name independently looks strong.
  const topCounts=new Map();
  for(const row of rows)if(row.matchStatus!=='confirmed'&&row.matchStrength>=78&&row.suggestedCanonical)
   topCounts.set(row.suggestedCanonical,(topCounts.get(row.suggestedCanonical)||0)+1);
  for(const row of rows)if(row.matchStatus!=='confirmed'&&row.suggestedCanonical&&topCounts.get(row.suggestedCanonical)>1){
   row.matchStatus='shared-candidate';
   row.reason+='; multiple Discord profiles suggest this player';
  }
  const attention={'shared-candidate':0,ambiguous:1,possible:2,likely:3,unmatched:4,suggested:5,confirmed:6};
  rows.sort((a,b)=>(attention[a.matchStatus]??9)-(attention[b.matchStatus]??9)||
   (b.matchStrength-a.matchStrength)||
   (a.suggestedCanonical||a.nickname||a.username).localeCompare(b.suggestedCanonical||b.nickname||b.username));
  const columns=['Discord User ID','Server nickname','Global name','Username','Joined Discord server',
   'Role IDs','Suggested canonical','Roster status','Match status','Match strength (heuristic, not probability)',
   'Reason','Other candidates','Top 3 educated guesses','Evidence','Confirmed canonical (leader review)'];
  const data=[columns,...rows.map(r=>[r.discordId,r.nickname,r.globalName,r.username,r.joinedAt,r.roles.join(';'),
   r.suggestedCanonical,r.rosterStatus,r.matchStatus,r.matchStrength,r.reason,r.alternatives,r.topThree,r.evidence,r.confirmedCanonical])];
  if(req.query?.format==='csv'){
   res.setHeader('Content-Type','text/csv; charset=utf-8');
   res.setHeader('Content-Disposition','attachment; filename="AVENGERS_Discord_Canonical_Matching_Review.csv"');
   return res.status(200).send(core.csv(data));
  }
  const count=rows.length,suggested=rows.filter(r=>r.matchStatus==='suggested').length;
  const confirmedAccounts=rows.filter(r=>r.matchStatus==='confirmed').length;
  const plausible=rows.filter(r=>['likely','possible','ambiguous','shared-candidate'].includes(r.matchStatus)).length;
  const tr=rows.map(r=>'<tr><td>'+esc(r.nickname||r.globalName||r.username)+'</td><td>'+esc(r.username)+
   '</td><td><code>'+esc(r.discordId)+'</code></td><td><strong>'+
   esc(r.suggestedCanonical||'—')+'</strong><div class="muted">'+esc(r.rosterStatus)+'</div></td><td>'+
   esc(r.matchStatus)+'</td><td>'+esc(r.matchStrength||'—')+'</td><td>'+
   esc(r.reason||'Insufficient evidence')+(r.source?' <span class="muted">('+esc(r.source)+')</span>':'')+
   '</td><td>'+esc(r.topThree||'—')+'</td></tr>').join('');
  const page='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
   '<meta name="robots" content="noindex,nofollow"><title>AVENGERS Discord Identity Review</title>'+
   '<style>body{background:#071321;color:#eef4ff;font:15px system-ui;margin:30px auto;max-width:1160px;padding:0 16px}'+
   'h1{font-size:25px}p{color:#b7c8da}a{color:#9cceff}table{border-collapse:collapse;width:100%;font-size:13px}'+
   'td,th{padding:9px;border-bottom:1px solid #34485e;text-align:left}tr:nth-child(even){background:#14243a}'+
   '.scroll{overflow:auto}.button{display:inline-block;padding:12px 16px;background:#396db5;border-radius:9px;font-weight:bold}'+
   'code{font-size:12px}</style></head><body><h1>AVENGERS Discord identity review</h1>'+
   '<p>'+count+' non-bot Discord members retrieved; '+confirmedAccounts+' leader-confirmed account identities verified; '+suggested+' strong name suggestions; '+plausible+' educated guesses or ambiguous cases. <b>No guesses are automatically approved.</b></p>'+
   (bindingError?'<p style="color:#ffb4b4"><b>Private identity verification needs attention.</b> One or more records could not be verified; no mismatched IDs were saved.</p>':'')+
   '<p>Ranked using server nicknames, global names, Discord usernames, spelling similarity, public historical aliases, and current/historical player names. Strength is a <b>ranking score, not a probability</b>. Only the matches previously confirmed by the leader are marked confirmed, after Discord ID verification. Other guesses need leader confirmation. Uncertain and shared-candidate rows appear first. Review the CSV and fill "Confirmed canonical" only after verifying identity.</p>'+
   '<p><a class="button" href="/api/discord/identity-review?format=csv">Download private matching CSV</a></p>'+
   '<div class="scroll"><table><thead><tr><th>Display</th><th>Discord username</th><th>Permanent Discord ID</th><th>Best guess</th><th>Classification</th><th>Strength</th><th>Why</th><th>Top three alternatives</th></tr></thead><tbody>'+tr+'</tbody></table></div>'+
   '<p>This page is private, not part of the public Stat Center. No member names, Discord identifiers or approved links are committed to GitHub.</p></body></html>';
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'");
  return res.status(200).send(page);
 }catch(e){
  console.error('Discord roster review failed:',e.message);
  return fail(res,503,'Unable to retrieve the complete private Discord member roster. No partial list was exported.');
 }
};
