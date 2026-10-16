'use strict';
// Conservative, non-destructive Council minimums calculation.
// The historical event ledger does not prove every member's joining date or
// screenshot completeness. Only observed positive scores can be evaluated.
const POLICY_START='2026-09-11';
const NEAR_FRACTION=0.10;
const LIMITS={piggy:3500,space:30}; // Space measured in billions.
const SPECIAL_SPACE={'2026-09-27':50};
function canonical(name,aliases){
  let n=String(name||'').trim(),count=0;
  while(aliases?.[n] && aliases[n]!==n && count++<12)n=aliases[n];
  return n;
}
function eventClan(r,kind){
  const raw=String(r.eventClan||r.raceClan||r.clan||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  if(raw==='avengers'||raw==='av')return {clan:'AVENGERS',attribution:'explicit'};
  if(raw==='av2')return {clan:'AV-2',attribution:'explicit'};
  if(kind==='piggy'){
    const hasReward=(Number(r.stars)||0)>0 || (Number(r.sparks)||0)>0 || (Number(r.share)||0)>0;
    return {clan:hasReward?'AVENGERS':'AV-2',attribution:'inferred'};
  }
  return {clan:'AVENGERS',attribution:'inferred'};
}
function scoreOf(r,kind){
  const raw=kind==='piggy'?r.lines:r.yearsB;
  if(raw==null||raw==='')return null;
  const n=Number(raw);
  return Number.isFinite(n)&&n>0?n:null;
}
function threshold(kind,date){return kind==='piggy'?LIMITS.piggy:(SPECIAL_SPACE[date]||LIMITS.space);}
function validDay(d){return /^\d{4}-\d{2}-\d{2}$/.test(d);}
function build({piggyEvents={},spaceEvents={},periods=[],aliasMap={},policyStart=POLICY_START,nearFraction=NEAR_FRACTION}={}){
  const result=[];
  if(!(nearFraction>=0&&nearFraction<=1))throw Error('Invalid near threshold percentage');
  for(const p of periods){
    if(!validDay(p.start)||!validDay(p.end)||p.start>p.end)throw Error('Invalid league dates');
    const people=new Map(),eventRows=[],calendars={piggy:new Set(),space:new Set()};
    const getPerson=(name,clan)=>{
      const id=clan+'|'+name;
      if(!people.has(id))people.set(id,{
        name,clan,firstObserved:null,piggyScores:[],spaceScores:[],
        piggyAverage:null,spaceAverageB:null,
        piggyUnder:0,spaceUnder:0,piggyNear:0,spaceNear:0,
        piggy7000:'unknown',missedObserved:0,nearObserved:0,
        scoreEvidence:0,eligibleStart:'unverified',
        unknownAbsences:0,unverifiedClanAttributions:0,
        trendPiggy:null,trendSpace:null
      });
      return people.get(id);
    };
    for(const [kind,events] of [['piggy',piggyEvents],['space',spaceEvents]]){
      for(const [date,all] of Object.entries(events||{})){
        if(!validDay(date)||date<p.start||date>p.end||!Array.isArray(all))continue;
        const unique=new Map();
        for(const r of all){
          if(!r||!r.name||r.name==='Total'||r.name==='#N/A')continue;
          const value=scoreOf(r,kind);if(value===null)continue;
          const name=canonical(r.name,aliasMap),meta=eventClan(r,kind);
          if(!name)continue;
          const id=meta.clan+'|'+name;
          const prev=unique.get(id);
          // Duplicated archive imports must not double-count a race.
          // Prefer an explicit historical clan attribution, then highest
          // positive score. Conflicting score values remain a source-review
          // warning rather than being represented as two races.
          const better=!prev||
            (meta.attribution==='explicit'&&prev.attribution!=='explicit')||
            (meta.attribution===prev.attribution&&value>prev.value);
          if(better)unique.set(id,{name,clan:meta.clan,attribution:meta.attribution,value});
        }
        for(const r of unique.values()){
          calendars[kind].add(date+'|'+r.clan);
          const person=getPerson(r.name,r.clan);
          if(!person.firstObserved||date<person.firstObserved)person.firstObserved=date;
          const active=date>=policyStart,limit=threshold(kind,date);
          const under=active&&r.value<limit;
          const near=active&&r.value>=limit&&r.value<=limit*(1+nearFraction);
          const datum={date,kind,clan:r.clan,name:r.name,value:r.value,limit,
            policyActive:active,underMinimum:under,nearMinimum:near,
            clanAttribution:r.attribution};
          eventRows.push(datum);
          person[kind+'Scores'].push(datum);
          person.scoreEvidence++;
          if(r.attribution!=='explicit')person.unverifiedClanAttributions++;
          if(under)person[kind+'Under']++;
          if(near)person[kind+'Near']++;
        }
      }
    }
    const records=[...people.values()];
    const mean=list=>list.length?list.reduce((sum,x)=>sum+x.value,0)/list.length:null;
    const trend=list=>{
      const sorted=list.slice().sort((a,b)=>a.date.localeCompare(b.date));
      if(sorted.length<4)return null;
      const early=mean(sorted.slice(0,Math.min(3,Math.floor(sorted.length/2))));
      const late=mean(sorted.slice(-Math.min(3,Math.floor(sorted.length/2))));
      return early>0?Math.round((late/early-1)*1000)/10:null;
    };
    const allEventDates=kind=>[...calendars[kind]].map(s=>{const i=s.indexOf('|');return {date:s.slice(0,i),clan:s.slice(i+1)};});
    for(const person of records){
      person.piggyScores.sort((a,b)=>a.date.localeCompare(b.date));
      person.spaceScores.sort((a,b)=>a.date.localeCompare(b.date));
      person.piggyAverage=mean(person.piggyScores);
      person.spaceAverageB=mean(person.spaceScores);
      person.trendPiggy=trend(person.piggyScores);
      person.trendSpace=trend(person.spaceScores);
      person.missedObserved=person.piggyUnder+person.spaceUnder;
      person.nearObserved=person.piggyNear+person.spaceNear;
      person.piggy7000=p.end<policyStart?'not_effective':
        person.piggyScores.some(x=>x.policyActive&&x.value>=7000)?'met':'unverified';
      person.unknownAbsences=['piggy','space'].reduce((sum,kind)=>
        sum+allEventDates(kind).filter(e=>e.clan===person.clan
          &&e.date>=policyStart&&e.date>=person.firstObserved
          &&!person[kind+'Scores'].some(x=>x.date===e.date)).length,0);
    }
    records.sort((a,b)=>b.missedObserved-a.missedObserved||b.nearObserved-a.nearObserved||
      a.clan.localeCompare(b.clan)||a.name.localeCompare(b.name));
    eventRows.sort((a,b)=>a.date.localeCompare(b.date)||a.kind.localeCompare(b.kind)||a.name.localeCompare(b.name));
    result.push({start:p.start,end:p.end,policyEffective:!(p.end<policyStart),
      rules:{effectiveDate:policyStart,piggyLines:3500,oncePerLeaguePiggyLines:7000,
        spaceB:30,weekendSpaceDate:'2026-09-27',weekendSpaceB:50,
        nearPercent:nearFraction*100},
      members:records,observedEvents:eventRows,
      summary:{observedParticipantRows:eventRows.length,playersWithEvidence:records.length,
        observedBelowMinimum:records.reduce((n,x)=>n+x.missedObserved,0),
        nearMinimum:records.reduce((n,x)=>n+x.nearObserved,0),
        repeatedNearMinimumPlayers:records.filter(x=>x.nearObserved>=2).length,
        oncePerLeaguePiggyMet:records.filter(x=>x.piggy7000==='met').length,
        oncePerLeaguePiggyUnverified:records.filter(x=>x.piggy7000==='unverified').length,
        missingScoreAndMembershipEvidenceNotPenalized:true}});
  }
  return result;
}
module.exports={build,eventClan,canonical,scoreOf,threshold,POLICY_START};
