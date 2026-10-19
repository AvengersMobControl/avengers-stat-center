#!/usr/bin/env node
'use strict';
// AVENGERS weekly multi-event preview. Pure, deterministic, NO Discord client.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {exportRelease}=require('./export-event-summary.cjs');
const {analyze:spaceRanks}=require('../space-rank-history.js');
const {root}=require('./load-site-data.cjs');
const ISO=/^\d{4}-\d{2}-\d{2}$/;
function ok(check,msg){if(!check)throw Error(msg)}
function day(s,offset=0){const d=new Date(s+'T12:00:00Z');ok(ISO.test(s)&&!Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===s,'Invalid ISO date');d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10)}
function num(v){return typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null}
function sumKnown(rows,key){return rows.reduce((a,x)=>a+(num(x[key])??0),0)}
function isoMonday(s){return new Date(s+'T12:00:00Z').getUTCDay()===1}
function flashNo(e){let n=Number(e.metadata?.flash);if(!Number.isInteger(n))n=Number(String(e.id).match(/PF([1-4])/)?.[1]);return n>=1&&n<=4?n:null}
const sorted=(xs)=>xs.slice().sort((a,b)=>b.value-a.value||a.player.localeCompare(b.player));
const TIER={piggy:[10000,25000,50000,75000,100000],space:[100,250,350,500,750]};
function buildWeekly(release,{week='2026-10-12',clan='AVENGERS'}={}){
 ok(release?.schemaVersion===1&&release.source==='approved-event-ledger'&&release.projection?.version&&Array.isArray(release.projection.events),'Accepted canonical projection required');
 ok(ISO.test(week)&&isoMonday(week),'Week start must be an ISO Monday');
 ok(['AVENGERS','AV-2'].includes(clan),'Event-time clan must be explicit');
 const end=day(week,6),priorSun=day(week,-1);
 const projection=release.projection;
 const all=projection.events.filter(e=>e.status!=='revoked').slice().sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
 const kraken=all.find(e=>e.kind==='kraken'&&e.date===priorSun&&e.status!=='revoked');
 const noSparkFlashes=!!kraken;
 const relevant=all.filter(e=>e.date>=week&&e.date<=end&&['piggy','space','flash'].includes(e.kind) &&
  e.rows.some(r=>r.clan===clan&&r.player&&num(r.score)!==null));
 const selected={};for(const kind of ['piggy','space']){const e=relevant.filter(e=>e.kind===kind);
   ok(e.length<=1,'Multiple '+kind+' events in one weekly packet need explicit review');
   selected[kind]=e[0]||null;}
 const byFlash={};for(const e of relevant.filter(e=>e.kind==='flash')){
   const n=flashNo(e);ok(n!==null,'Flash event requires documented PF number');
   ok(!byFlash[n],'Duplicate PF'+n+' events require manual review');byFlash[n]=e;}
 const coverageWarnings=[],contributors=new Map(),seenMilestones=new Set(),badges=[],eventCards=[],pbHighlights=[],allKnown=[];
 const latestPerPlayer=new Map(),personal=projection.people||[];
 for(const e of all){
   if(e.date>end)break;
   for(const r of e.rows||[]){
     if(!r.player||num(r.score)===null||r.score<=0)continue;
     const k=e.kind+'|'+r.player,prior=latestPerPlayer.get(k)||[];
     if(e.date<week)prior.push({date:e.date,score:r.score,clan:r.clan,eventId:e.id});
     latestPerPlayer.set(k,prior);
   }
 }
 const sourceSpace=spaceRanks(all,projection.aliases||{});
 const groupRankPBs=(release.piggyPlacementPBs||{});
 const roleEvents=[selected.space,...[1,2,3,4].map(n=>byFlash[n]||null),selected.piggy];
 for(let slot=0;slot<roleEvents.length;slot++){
   const e=roleEvents[slot],kind=slot===0?'space':slot===5?'piggy':'flash';
   const flash=kind==='flash'?slot:null;
   if(!e){coverageWarnings.push('Missing accepted '+(flash?'PF'+flash:kind)+' event in '+week+' week');eventCards.push({slot:flash?'PF'+flash:kind,date:null,missing:true,status:'missing',kind,flash});continue;}
   const raw=e.rows.filter(r=>r.clan===clan&&r.player);
   const valid=raw.filter(r=>num(r.score)!==null&&r.score>0);
   const unique=new Map();for(const r of valid){const p=unique.get(r.player);if(!p||r.score>p.score)unique.set(r.player,r);}
   const rows=[...unique.values()].sort((a,b)=>b.score-a.score||a.player.localeCompare(b.player));
   const scored=new Set(rows.map(r=>r.player));
   const beforeEvent=all.filter(old=>old.kind===kind&&old.date<e.date);
   let above=0,baselined=0,pbs=0;
   const perEventPB=[];
   for(const r of rows){
     const matches=beforeEvent.flatMap(old=>{
       if(kind==='flash'&&flashNo(old)!==flash)return [];
       return old.rows.filter(x=>x.player===r.player&&x.clan===clan&&num(x.score)!==null&&x.score>0);
     });
     if(matches.length){baselined++;if(r.score>matches.reduce((a,v)=>a+v.score,0)/matches.length)above++;}
     if(kind==='piggy'||kind==='space'){
       const transitions=personal.find(p=>p.name===r.player)?.kinds?.[kind]?.pbs||[];
       const pb=transitions.find(x=>x.eventId===e.id);
       if(pb?.newPB&&!pb.firstRecorded){
         pbs++;perEventPB.push({player:r.player,kind,score:r.score,previous:num(pb.previousPB),improvement:num(pb.improvement)});
       }
       const thresholds=TIER[kind]||[];
       const previous=Math.max(0,...all.filter(old=>old.kind===kind&&old.date<e.date).flatMap(old=>old.rows.filter(x=>x.player===r.player&&num(x.score)!==null).map(x=>x.score)));
       for(const tier of thresholds)if(previous<tier&&r.score>=tier&&!seenMilestones.has(kind+'|'+r.player+'|'+tier)){
         seenMilestones.add(kind+'|'+r.player+'|'+tier);
         badges.push({player:r.player,category:kind,threshold:tier,date:e.date,eventId:e.id});
       }
     }
     const entry=contributors.get(r.player)||{player:r.player,value:0,events:0};
     let award=num(r.sparks);
     if(kind==='flash'&&noSparkFlashes){
       if(award!==null&&award>0){
         coverageWarnings.push('SOURCE RECONCILIATION: '+e.id+' '+r.player+' has '+award+' ledger Sparks, but the leader-confirmed post-Kraken flash has NO Sparks.');
       }
       award=0;
     }
     if(award===null&&kind!=='flash')coverageWarnings.push('Unverified Spark payout: '+e.id+' '+r.player);
     entry.value+=award||0;entry.events++;
     contributors.set(r.player,entry);
     allKnown.push({eventId:e.id,kind,player:r.player,award,recordedSparks:num(r.sparks),score:r.score});
   }
   pbHighlights.push(...perEventPB);
   const sparks=rows.reduce((s,r)=>s+(kind==='flash'&&noSparkFlashes?0:num(r.sparks)||0),0);
   const missingSparks=rows.filter(r=>kind!=='flash'&&num(r.sparks)===null).length;
   const card={slot:flash?'PF'+flash:kind,kind,flash,eventId:e.id,date:e.date,status:e.status,missing:false,
     participants:rows.length,trackedRows:raw.length,knownScore:sumKnown(rows,'score'),aboveAverage:above,benchmarkEligible:baselined,
     unbenchmarked:rows.length-baselined,knownSparks:sparks,unknownSparkPayouts:missingSparks,newScorePBs:pbs,
     topScore:rows.slice(0,3).map(r=>({player:r.player,score:r.score,sourceRank:num(r.metadata?.rank)})),
     noSparkAward:kind==='flash'&&noSparkFlashes,
     warnings:raw.length!==rows.length?['Nonpositive / repeated result rows excluded from ranked summary']:[]};
   if(e.status==='partial')coverageWarnings.push(e.id+' has partial source coverage; all aggregates are known-only.');
   eventCards.push(card);
 }
 const knownSparks=eventCards.filter(x=>!x.missing).reduce((n,e)=>n+e.knownSparks,0);
 const weeklySparkRows=allKnown.filter(x=>x.award!==null);
 const hasUnknown=eventCards.some(e=>!e.missing&&e.unknownSparkPayouts>0);
 const top5=sorted([...contributors.values()]).slice(0,5);
 const rankImproved=(groupRankPBs[selected.piggy?.id]||[]).filter(r=>r.improved);
 const spaceRankImproved=(sourceSpace.lobbyTransitionsByEvent.get(selected.space?.id)||[]).filter(x=>x.clan===clan&&x.improved);
 const uniqueEventPlayers=new Set(eventCards.filter(e=>!e.missing).flatMap(c=>{
    const ev=all.find(x=>x.id===c.eventId);return ev.rows.filter(r=>r.clan===clan&&r.player&&num(r.score)!==null&&r.score>0).map(r=>r.player);
 }));
 const report={
   schemaVersion:1,reviewType:'weekly-three-event-recap',clan,weekStart:week,weekEnd:end,
   source:'approved-event-ledger',projectionVersion:projection.version,
   status:'REVIEW ONLY — NOT APPROVED TO POST',eventCount:eventCards.filter(e=>!e.missing).length,
   expectedEventCount:6,events:eventCards,contributors:contributors.size,uniqueParticipants:uniqueEventPlayers.size,
   totalKnownSparks:knownSparks,hasUnknownSparkPayouts:hasUnknown,top5Sparks:top5,
   aboveAverageTotal:eventCards.reduce((n,e)=>n+(e.aboveAverage||0),0),
   benchmarkEligibleTotal:eventCards.reduce((n,e)=>n+(e.benchmarkEligible||0),0),
   newMilestones:badges.length,milestones:badges,scorePBs:pbHighlights.length,highlightPBs:pbHighlights.slice()
      .sort((a,b)=>(b.improvement||0)-(a.improvement||0)).slice(0,5),
   piggyFinishRankImproved:rankImproved.length,spaceLobbyRankImproved:spaceRankImproved.length,
   postKrakenNoSparkFlash:noSparkFlashes,krakenAnchor:noSparkFlashes?kraken.id:null,
   sourceFlashSparkConflict:coverageWarnings.some(x=>x.startsWith('SOURCE RECONCILIATION')),
   warnings:coverageWarnings,readyToPost:false,discordPostingEnabled:false,
   autoDispatchEnabled:false,discordChannelVerified:false,
   displayRules:{sparks:'Known approved result awards for Space and Piggy; immediately post-Kraken four flashes contribute 0 per leader rule. Any conflicting legacy source payouts are flagged for reconciliation.',averages:'Actual result strictly exceeds the prior mean from the SAME event-time clan and event category (each PF # tracked separately); no history means not counted.',milestones:'First crossing of tracked Piggy or Space performance badge thresholds; excludes uncertain Spark-collector milestones.'}
 };
 report.reviewDigest=crypto.createHash('sha256').update(JSON.stringify(report)).digest('hex');
 report.discordDraft=discordDraft(report);
 return report;
}
function format(n){return Number(n||0).toLocaleString('en-US')}
function discordDraft(m){
 const event=m.events.filter(x=>!x.missing);
 const c=m.top5Sparks.slice(0,5).map((x,i)=>String(i+1)+'. '+x.player+' — '+format(x.value)).join('\n');
 const pig=event.find(x=>x.kind==='piggy'),space=event.find(x=>x.kind==='space');
 const flash=m.events.filter(e=>e.kind==='flash').map(e=>e.missing?'PF'+e.flash+': source missing':'PF'+e.flash+': '+e.participants+' recorded, '+e.aboveAverage+'/'+e.benchmarkEligible+' above prior avg').join(' | ');
 return [
   '@everyone 🛡️ '+m.clan+' WEEKLY RECAP · '+m.weekStart+' to '+m.weekEnd,
   'The receipts: **'+format(m.totalKnownSparks)+' known Sparks** from approved scored races'+(m.hasUnknownSparkPayouts?' (some payouts unknown)':'')+'. '+event.length+' of 6 expected events captured; '+m.uniqueParticipants+' distinct competitors logged.',
   '**SPACE** '+(space?space.participants+' recorded racers; '+space.aboveAverage+'/'+space.benchmarkEligible+' exceeded previous Space average':'results not in approved source')+'.',
   '**FLASHES** '+flash+'.'+(m.postKrakenNoSparkFlash?' These were the first flashes after Kraken: **NO SPARKS** are counted for them.':''),
   '**PIGGY** '+(pig?format(pig.knownScore)+' tracked lines from '+pig.participants+' players; '+pig.aboveAverage+'/'+pig.benchmarkEligible+' above average':'results not in approved source')+'.',
   '**TOP FIVE SPARK CONTRIBUTORS (known awards)**\n'+(c||'Not enough verified data'),
   '**Achievements:** '+m.newMilestones+' new performance badge threshold crossings, '+m.scorePBs+' returning-player line/distance PBs, '+m.piggyFinishRankImproved+' improved qualified Piggy rank PBs, '+m.spaceLobbyRankImproved+' improved source Space lobby-rank PBs.',
   'Everyone contributing effort and showing up matters — thanks to the whole crew. Full history: https://avengersmobcontrol.github.io/avengers-stat-center/',
   m.warnings.length?'⚠️ **Review before any send:** '+m.warnings.filter(w=>!w.startsWith('SOURCE RECONCILIATION')).slice(0,3).join(' | ')+(m.sourceFlashSparkConflict?' | Legacy flash Spark records need correction for no-Spark week.':''):'',
   '[DRAFT ONLY. No Discord channel verified; no post authorization.]'
 ].filter(Boolean).join('\n\n');
}
function writeWeekly(name,week,clan){
 ok(/^[a-z0-9][a-z0-9-]*\.json$/i.test(name),'Safe reports/ JSON filename only');
 const r=buildWeekly(exportRelease(),{week,clan});
 const dir=path.join(root,'reports');fs.mkdirSync(dir,{recursive:true});
 const output=path.join(dir,name);fs.writeFileSync(output,JSON.stringify(r,null,2)+'\n');
 fs.writeFileSync(output.replace(/\.json$/,'.txt'),r.discordDraft+'\n');
 return {output,week:r.weekStart,eventCount:r.eventCount,sparks:r.totalKnownSparks,warnings:r.warnings.length,readyToPost:false};
}
module.exports={buildWeekly,discordDraft,writeWeekly,day,flashNo};
if(require.main===module){
 try{const [name,week,clan='AVENGERS']=process.argv.slice(2);
   ok(name&&week,'Usage: node scripts/export-weekly-review.cjs output.json YYYY-MM-DD [AVENGERS|AV-2]');
   console.log(JSON.stringify(writeWeekly(name,week,clan)));
 }catch(e){console.error(e.stack||e.message);process.exitCode=1;}
}
