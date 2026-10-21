'use strict';
const crypto=require('node:crypto');
const REPOSITORY='AvengersMobControl/avengers-stat-center';
const REPOSITORY_ID='1393506638';
const WORKFLOW_REF='AvengersMobControl/avengers-stat-center/.github/workflows/automatic-piggy-dispatch.yml@refs/heads/main';
const OIDC_AUDIENCE='avengers-stat-center-piggy-dispatch';
const fail=m=>{throw Error(m)};
const num=x=>typeof x==='number'&&Number.isFinite(x)?x:null;
const sum=(rows,key)=>rows.reduce((n,r)=>n+(num(r[key])??0),0);
function participatingRows(event,clan){
 if(!event||!Array.isArray(event.rows))return [];
 return event.rows.filter(r=>r.clan===clan&&r.score!==1);
}
function selectLatestEligiblePiggy(projection,policy){
 if(!policy||policy.enabled!==true||policy.status!=='approved')return {decision:'automatic-piggy-policy-disabled',event:null};
 const events=(projection?.events||[]).filter(e=>e.kind==='piggy'&&e.status!=='revoked'&&
   typeof e.date==='string'&&e.date>policy.minimumEventDateExclusive)
   .sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
 const event=events.at(-1);
 if(!event)return {decision:'no-new-piggy-event-after-baseline',event:null};
 if(event.status!=='final')return {decision:'latest-piggy-event-not-final',event:null,eventId:event.id,status:event.status};
 return {decision:'eligible-final-piggy-event',event};
}
function deriveLobbyLabel(event,clan){
 const meta=event?.metadata||{};
 for(const key of ['lobbyLabel','lobbyName','lobby']){
  if(typeof meta[key]==='string'&&meta[key].trim())return meta[key].trim();
 }
 const labels=[...new Set((event?.rows||[]).filter(r=>r.clan===clan&&r.score!==1).map(r=>{
  const m=r.metadata||{};
  return [m.lobbyLabel,m.lobbyName,m.lobby].find(v=>typeof v==='string'&&v.trim())?.trim();
 }).filter(Boolean))].sort();
 if(labels.length===1)return labels[0];
 if(labels.length>1)return 'Multiple lobbies ('+labels.length+')';
 return 'Not source-labeled';
}
function sourceEventForDispatch({approvedUpdates,holds,eventId,clan,minimumEventDateExclusive}){
 const update=(approvedUpdates?.updates||[]).filter(u=>u.event?.id===eventId).at(-1);
 if(!update||update.approved!==true||update.event.status!=='final')fail('Only the latest approved final Piggy source is dispatchable');
 const event=update.event;
 if(event.kind!=='piggy'||event.date<=minimumEventDateExclusive)fail('Event is before the automatic-dispatch baseline');
 if((holds?.holds||[]).some(h=>h.eventId===eventId&&(h.clan===clan||h.clan==='ALL')))fail('Event/clan has an active source hold');
 const rows=participatingRows(event,clan);
 if(!rows.length)fail('No verified participating rows for this event-time clan');
 return {event,rows};
}
function totals(rows){
 const scores=rows.filter(r=>num(r.score)!==null),stars=rows.filter(r=>num(r.stars)!==null),sparks=rows.filter(r=>num(r.sparks)!==null);
 return {participants:rows.length,knownScoreSum:sum(rows,'score'),knownStars:sum(rows,'stars'),
  knownSparks:sum(rows,'sparks'),unknownScoreRows:rows.length-scores.length,
  unknownStarRows:rows.length-stars.length,unknownSparkRows:rows.length-sparks.length};
}
function buildPiggyMessage(event,clan,report,siteUrl){
 siteUrl=siteUrl||'https://avengersmobcontrol.github.io/avengers-stat-center/';
 const rows=participatingRows(event,clan);
 if(!rows.length)fail('Cannot draft a Piggy message without verified clan rows');
 const t=totals(rows);
 if(report?.eventId!==event.id||report?.clan!==clan||report?.kind!=='piggy'||report?.eventStatus!=='final')
  fail('PNG manifest does not match the final source event and clan');
 const expected={participants:t.participants,knownScoreSum:t.knownScoreSum,knownStars:t.knownStars,
  knownSparks:t.knownSparks,unknownStarRows:t.unknownStarRows,unknownSparkRows:t.unknownSparkRows};
 for(const k of Object.keys(expected))if(report[k]!==expected[k])fail('PNG manifest/source mismatch: '+k);
 const sorted=rows.filter(r=>num(r.score)!==null&&r.score!==1)
  .sort((a,b)=>b.score-a.score||String(a.player||'').localeCompare(String(b.player||'')));
 const medal=['🥇','🥈','🥉'];
 const top=sorted.slice(0,5).map((r,i)=>(i<3?medal[i]:String(i+1)+'.')+' '+(r.player||'Unassigned account')+' — '+Number(r.score).toLocaleString('en-US')+' lines').join('\n');
 const date=new Date(event.date+'T00:00:00Z').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
 const lines=[
  '🏁 **'+clan+' PIGGY RACE — FINAL RESULTS · '+date.toUpperCase()+'**',
  '**'+t.participants+' participating players · '+t.knownScoreSum.toLocaleString('en-US')+' lines**',
  'Known rewards: **'+t.knownStars.toLocaleString('en-US')+' Stars** · **'+t.knownSparks.toLocaleString('en-US')+' Sparks**'
 ];
 if(clan==='AV-2'){
  const pot=event.metadata?.av2DisplayedPotStars;
  let rake=num(event.metadata?.av2RakePercentDisplayedShareSum);
  if(rake===null){
   const lobbies=new Set(rows.map(r=>String(r.metadata?.lobby??r.metadata?.group??'unknown')));
   const shares=rows.map(r=>num(r.metadata?.share));
   if(lobbies.size===1&&shares.every(x=>x!==null))rake=shares.reduce((a,b)=>a+b,0)*100;
  }
  if(pot||rake!==null)lines.push('AV-2 lobby pot: **'+(pot||'unknown')+'** · RAKE: **'+(rake===null?'unknown':rake.toFixed(1)+'%')+'** (sum of displayed shares)');
 }
 if(top)lines.push('','**Top five by lines**',top);
 if(typeof report.weekToWeekGrowthPercent==='number'&&Number.isFinite(report.weekToWeekGrowthPercent))
  lines.push('', 'Total lines vs prior final Piggy: '+(report.weekToWeekGrowthPercent>=0?'+':'')+report.weekToWeekGrowthPercent.toFixed(1)+'%.');
 const milestones=Array.isArray(report.milestones)?report.milestones:[];
 if(milestones.length){
  lines.push('', '**Line milestones**',milestones.map(m=>(Number(m.threshold)/1000)+'K+ '+Number(m.count)+(m.record?' 🏆':'')).join(' · '));
  lines.push('GOLD = CLAN RECORD OR TIED RECORD');
 }
 const career=Array.isArray(report.topThreeCareer)?report.topThreeCareer.filter(x=>x&&x.careerPodiums):[];
 if(career.length){
  lines.push('', '**Top-three recorded career podiums (W / 2nd / 3rd / P)**',
   career.map(x=>x.player+' '+x.careerPodiums.wins+'/'+x.careerPodiums.secondPlaces+'/'+x.careerPodiums.thirdPlaces+'/'+x.careerPodiums.podiums).join(' · '));
 }
 if(t.unknownStarRows||t.unknownSparkRows)
  lines.push('', 'Reward data: '+t.unknownStarRows+' unknown Star rows and '+t.unknownSparkRows+' unknown Spark rows; unknown values are not treated as zero.');
 const pbs=Number.isInteger(report.linePBs)?report.linePBs:null;
 const rankPBs=Number.isInteger(report.placementPBs)?report.placementPBs:null;
 const first=Number.isInteger(report.firstTracked)?report.firstTracked:null;
 if(pbs!==null||rankPBs!==null||first!==null)
  lines.push('', 'Verified history: '+(pbs===null?'—':pbs)+' line PBs · '+(rankPBs===null?'—':rankPBs)+' qualifying finishing-place PBs · '+(first===null?'—':first)+' first tracked appearances.');
 lines.push('', 'Full history: '+siteUrl);
 const message=lines.join('\n');
 if(message.length>1800)fail('Source-derived Piggy message exceeds the safe Discord length budget');
 return message;
}
function verifyPngBytes(bytes){
 if(!Buffer.isBuffer(bytes)||bytes.length<24||bytes.length>3000000)fail('PNG size is outside the allowed range');
 if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')fail('PNG signature invalid');
 if(bytes.readUInt32BE(12)!==0x49484452||bytes.readUInt32BE(16)!==2400||bytes.readUInt32BE(20)!==1500)
  fail('PNG must be a 2400×1500 approved-format raster');
 return crypto.createHash('sha256').update(bytes).digest('hex');
}
function decodePart(s){return Buffer.from(s.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8');}
async function verifyGitHubOIDC(token,{fetchImpl=globalThis.fetch,now=Math.floor(Date.now()/1000),jwks=null}={}){
 if(typeof token!=='string')fail('GitHub OIDC token required');
 const parts=token.split('.');
 if(parts.length!==3)fail('Malformed OIDC token');
 let header,claims;
 try{header=JSON.parse(decodePart(parts[0]));claims=JSON.parse(decodePart(parts[1]));}catch{fail('Malformed OIDC claims');}
 if(header.alg!=='RS256'||typeof header.kid!=='string')fail('Unsupported OIDC signing key');
 if(!jwks){
  const r=await fetchImpl('https://token.actions.githubusercontent.com/.well-known/jwks');
  if(!r.ok)fail('GitHub OIDC key lookup failed');
  jwks=await r.json();
 }
 const jwk=jwks.keys?.find(k=>k.kid===header.kid&&k.kty==='RSA'&&(!k.use||k.use==='sig'));
 if(!jwk)fail('GitHub OIDC signing key not found');
 const key=crypto.createPublicKey({key:jwk,format:'jwk'});
 const signature=Buffer.from(parts[2].replace(/-/g,'+').replace(/_/g,'/'),'base64');
 if(!crypto.verify('RSA-SHA256',Buffer.from(parts[0]+'.'+parts[1]),key,signature))fail('GitHub OIDC signature invalid');
 const aud=Array.isArray(claims.aud)?claims.aud:[claims.aud];
 if(claims.iss!=='https://token.actions.githubusercontent.com'||!aud.includes(OIDC_AUDIENCE)||
    !Number.isFinite(claims.exp)||claims.exp<=now||!Number.isFinite(claims.iat)||claims.iat>now+30||
    (Number.isFinite(claims.nbf)&&claims.nbf>now+30)||claims.exp-claims.iat>600)
  fail('GitHub OIDC issuer, audience or lifetime invalid');
 if(claims.repository!==REPOSITORY||String(claims.repository_id)!==REPOSITORY_ID||
    claims.ref!=='refs/heads/main'||claims.workflow_ref!==WORKFLOW_REF||
    !['schedule','workflow_dispatch','push'].includes(claims.event_name)||typeof claims.sha!=='string')
  fail('GitHub OIDC workflow identity is not authorized');
 return claims;
}
module.exports={REPOSITORY,REPOSITORY_ID,WORKFLOW_REF,OIDC_AUDIENCE,participatingRows,
 selectLatestEligiblePiggy,sourceEventForDispatch,totals,buildPiggyMessage,verifyPngBytes,verifyGitHubOIDC};
