#!/usr/bin/env node
'use strict';
// Review-only diff from one proposed result update against the accepted
// canonical release. Intentionally has NO Discord API, approval or publish code.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {preview}=require('./stage-event-update.cjs');
const {root}=require('./load-site-data.cjs');
function assert(ok,message){if(!ok)throw Error(message)}
const keys=['piggy','space','flash','kraken'],clans=['AVENGERS','AV-2','Unknown'];
const num=x=>typeof x==='number'&&Number.isFinite(x)?x:0;
const key=r=>(r.clan||'Unknown')+'|'+(r.player||r.sourceIdentity||'unidentified');
const sum=(rows,field)=>rows.reduce((n,r)=>n+num(r[field]),0);
const ordered=xs=>xs.sort((a,b)=>a.name.localeCompare(b.name)||String(a.clan).localeCompare(String(b.clan)));
function viewEvent(ledger,id){const e=ledger.events.find(x=>x.id===id);return e&&e.status!=='revoked'?e:null}
function totals(rows,clan){const a=rows.filter(r=>(r.clan||'Unknown')===clan);
 return {recordedRows:a.length,knownSparks:sum(a,'sparks'),unknownSparkPayouts:a.filter(r=>r.sparks===null).length,
   knownStars:sum(a,'stars'),unknownStarPayouts:a.filter(r=>r.stars===null).length,
   positiveScores:a.filter(r=>r.score>0).length};
}
function memberSnapshot(p){
 if(!p)return null;
 const k=p.kinds||{};
 return {name:p.name,loggedSparks:p.earned.sparks,loggedStars:p.earned.stars,
   unloggedSparks:p.screenshotGap||0,totalSparks:p.totalSparks,
   events:p.earned.events,ratingTotal:p.ratingTotal,
   pb:Object.fromEntries(keys.map(x=>[x,k[x]?.pb??null])),
   categories:Object.fromEntries(keys.map(x=>[x,{sparks:p.categories[x].sparks,stars:p.categories[x].stars}]))};
}
function make(current,update,{enforceUnapproved=true}={}){
 assert(Array.isArray(current),'Require accepted update list');
 assert(update?.event&&typeof update.event.id==='string','Require a candidate event');
 if(enforceUnapproved)assert(update.approved!==true,'Candidate must not already be preapproved');
 const id=update.event.id,run=preview(current,update);
 const original=viewEvent(run.before.ledger,id),replacement=viewEvent(run.after.ledger,id);
 const oldRows=original?.rows||[],newRows=replacement?.rows||[];
 const clans=[...new Set(['AVENGERS','AV-2','Unknown',...oldRows.map(r=>r.clan).filter(Boolean),...newRows.map(r=>r.clan).filter(Boolean)])];
 const before=new Map(oldRows.map(x=>[key(x),x])),after=new Map(newRows.map(x=>[key(x),x]));
 assert(before.size===oldRows.length&&after.size===newRows.length,'Ambiguous duplicate identities; refuse to produce approval sheet');
 const rows=[...new Set([...before.keys(),...after.keys()])].sort().map(k=>{
   const old=before.get(k),now=after.get(k);
   const v=old&&now?(JSON.stringify([old.score,old.sparks,old.stars,old.metadata?.rank,old.metadata?.lobby,old.metadata?.group])===JSON.stringify([now.score,now.sparks,now.stars,now.metadata?.rank,now.metadata?.lobby,now.metadata?.group])?'unchanged':'corrected'):now?'added':'removed';
   return {member:now?.player||old?.player||'Unassigned',eventClan:now?.clan||old?.clan||'Unknown',change:v,
     scoreBefore:old?.score??null,scoreAfter:now?.score??null,
     sparksBefore:old?.sparks??null,sparksAfter:now?.sparks??null,
     starsBefore:old?.stars??null,starsAfter:now?.stars??null,
     originalLobbyFinish:now?.metadata?.rank??null};
 });
 const count=(kind)=>rows.filter(r=>r.change===kind).length;
 const clanChanges=Object.fromEntries(clans.map(clan=>{
   const a=totals(oldRows,clan),b=totals(newRows,clan);
   return [clan,{before:a,proposed:b,sparksDelta:b.knownSparks-a.knownSparks,starsDelta:b.knownStars-a.knownStars,
    unknownSparkRowDelta:b.unknownSparkPayouts-a.unknownSparkPayouts,unknownStarRowDelta:b.unknownStarPayouts-a.unknownStarPayouts}];
 }));
 const bp=new Map(run.before.projection.people.map(p=>[p.name,p])),ap=new Map(run.after.projection.people.map(p=>[p.name,p]));
 const changedMembers=[...new Set([...bp.keys(),...ap.keys()])].sort().flatMap(n=>{
   const a=memberSnapshot(bp.get(n)),b=memberSnapshot(ap.get(n));
   if(JSON.stringify(a)===JSON.stringify(b))return [];
   if(a&&b)assert(a.unloggedSparks===b.unloggedSparks,'Unlogged Sparks must remain frozen: '+n);
   return [{name:n,before:a,proposed:b}];
 });
 const leagueChanges=run.before.leagues.map(l=>{
   const current=run.after.leagues.find(x=>x.start===l.start&&x.end===l.end);
   assert(current,'Missing or changed five-week league: '+l.end);
   const totals=l=>Object.fromEntries(clans.map(c=>{
     const rs=l.rows.filter(x=>(x.clan||'Unknown')===c);
     return[c,{sparks:sum(rs,'sparks'),stars:sum(rs,'stars'),participants:rs.length}];
   }));
   const a=totals(l),b=totals(current);
   return {start:l.start,end:l.end,before:a,proposed:b,
     changed:JSON.stringify(a)!==JSON.stringify(b)};
 }).filter(l=>l.changed);
 const manifest={schemaVersion:1,source:'approved-ledger-simulation',mode:'REVIEW_ONLY',
   eventId:id,kind:update.event.kind,eventDate:update.event.date,
   beforeStatus:original?.status||'absent',afterStatus:replacement?.status||'revoked',
   expectedRevision:update.expectedRevision??null,
   fromVersion:run.before.projection.version,toVersion:run.after.projection.version,
   projectionUnchanged:run.unchanged,
   screenshotApprovalRecorded:false,originalImageProvenanceIndependentlyVerified:false,
   imported:false,discordSent:false,readyToImport:false,
   sourceCoverage:replacement?.status==='partial'?'PARTIAL — additional rows may be missing':'SOURCE STATUS: '+(replacement?.status||'revoked'),
   counts:{newRows:count('added'),correctedRows:count('corrected'),removedRows:count('removed'),
     unchangedRows:count('unchanged'),membersAffected:changedMembers.length,leaguesAffected:leagueChanges.length},
   clanChanges,rows,changedMembers,leagueChanges,
   restrictions:['Independent original Discord attachment byte hash + final-screen visual inspection required.',
     'Explicit leader approval of THIS proposed member/result correction is required.',
     'Any held AV-2 Oct 18 Piggy import stays held regardless of an otherwise valid screenshot.',
     'Pre-Kraken source history, frozen Unlogged Sparks and alias semantics must be preserved.',
     'A source-only dry run never writes data, turns on automation, or sends Discord PNGs.']};
 const digest=crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
 return {...manifest,reviewDigest:digest};
}
function csv(m){
 const header=['member','eventClan','change','scoreBefore','scoreAfter','sparksBefore','sparksAfter','starsBefore','starsAfter','originalLobbyFinish'];
 const esc=v=>{const x=String(v??'');return /[",\r\n]/.test(x)?'"'+x.replaceAll('"','""')+'"':x;};
 return [header.join(','),...m.rows.map(r=>header.map(k=>esc(r[k])).join(','))].join('\n')+'\n';
}
module.exports={make,csv};
if(require.main===module){
 try{
 const args=process.argv.slice(2);
 assert(args.length>=1&&args.length<=2,'Usage: node scripts/report-ingest-candidate.cjs review-candidate.json [safe-label]');
 const label=args[1]||'review-candidate';
 assert(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,80}$/.test(label),'Safe output label required');
 const update=JSON.parse(fs.readFileSync(args[0],'utf8'));
 const accepted=JSON.parse(fs.readFileSync(path.join(root,'data/approved-event-updates.json'),'utf8')).updates;
 const m=make(accepted,update);
 const dir=path.join(root,'reports');fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,label+'.json'),JSON.stringify(m,null,2)+'\n');
 fs.writeFileSync(path.join(dir,label+'.csv'),csv(m));
 console.log(JSON.stringify({output:['reports/'+label+'.json','reports/'+label+'.csv'],...m.counts,
   reviewDigest:m.reviewDigest,approvalRequired:true,discordSent:false},null,2));
 }catch(e){console.error(e.stack||e.message);process.exitCode=1;}
}
