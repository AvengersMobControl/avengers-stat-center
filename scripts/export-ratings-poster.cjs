#!/usr/bin/env node
'use strict';
// Weekly Player Power Ratings: poster data + week-over-week changes.
// Reads ONLY the approved projection (same source as the website). Never edits
// results, roster status or the rating formula. Writes under gitignored reports/
// unless --save-snapshot is given, which also writes the immutable weekly
// snapshot data/ratings-history/ratings-<date>.json used for next week's climbs.
//
// Usage: node scripts/export-ratings-poster.cjs <YYYY-MM-DD> [--save-snapshot]
//   <date> = the Sunday the ratings post goes out (America/Chicago).
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {exportRelease}=require('./export-event-summary.cjs');
const {root}=require('./load-site-data.cjs');
const {RATING_BENCHMARKS}=require('./event-projection-core.cjs');

const SELECTION=JSON.parse(fs.readFileSync(path.join(root,'data/ratings-poster-selection.json'),'utf8'));
const HISTORY_DIR=path.join(root,'data/ratings-history');
const CATEGORY_KEYS={
  piggy:['piggyPB','piggyArena','piggyLast3'],
  space:['spacePB','spaceArena','spaceLast3'],
  kraken:['krakenPB','krakenLast5','krakenLatest'],
  flash:['flashDailyPB','flashDailyArena']
};
// Display metadata for the 11-metric benchmark table. unit controls how
// render-ratings-poster.py formats the target/score numbers, matching the
// site's own conventions (fmtNum for piggy/flash lines, fmtB for space
// billion-lightyears, one-decimal plain number for kraken million-damage).
const METRIC_DISPLAY={
  piggyPB:{label:'Piggy PB',unit:'num'},
  piggyArena:{label:'Piggy Arena Avg',unit:'num'},
  piggyLast3:{label:'Piggy Last 3 Avg',unit:'num'},
  spacePB:{label:'Space PB',unit:'B'},
  spaceArena:{label:'Space Arena Avg',unit:'B'},
  spaceLast3:{label:'Space Last 3 Avg',unit:'B'},
  krakenPB:{label:'Kraken PB',unit:'num1'},
  krakenLast5:{label:'Kraken Last 5 Avg',unit:'num1'},
  krakenLatest:{label:'Kraken Latest',unit:'num1'},
  flashDailyPB:{label:'Flash Daily PB',unit:'num'},
  flashDailyArena:{label:'Flash Daily Arena Avg',unit:'num'}
};
// Benchmark/leaders table: all 11 rated metrics, their approved target and
// weight (RATING_BENCHMARKS, sums to the 10-point base), and the current
// gold/silver (1st/2nd) leader for each, straight from awardRatingCrowns'
// ratingLeaders output (same source the per-player crown badges use).
function metricsTable(ratingLeaders){
  const leaderOf=(key,metal)=>{
    const hit=(ratingLeaders?.[key]||[]).find(e=>e.metal===metal);
    return hit?{name:hit.name,score:hit.score}:null;
  };
  return Object.keys(RATING_BENCHMARKS).map(key=>{
    const {target,weight}=RATING_BENCHMARKS[key];
    const disp=METRIC_DISPLAY[key]||{label:key,unit:'num'};
    return {key,label:disp.label,unit:disp.unit,target,weight,
      first:leaderOf(key,'gold'),second:leaderOf(key,'silver')};
  });
}
const EPS=1e-9;
const r3=v=>Math.round(v*1000)/1000;
const byRating=(a,b)=>b.ratingAdjusted-a.ratingAdjusted||b.ratingTotal-a.ratingTotal||a.name.localeCompare(b.name);

// Competition ranking (1,1,3) on full precision; ties share a rank.
function competitionRanks(list){
  const out=new Map();let rank=0,prev=null;
  list.forEach((p,i)=>{if(prev===null||Math.abs(p.ratingAdjusted-prev)>EPS)rank=i+1;prev=p.ratingAdjusted;out.set(p.name,rank);});
  return out;
}

function select(people){
  const sorted=people.slice().sort(byRating);
  const left=sorted.filter(p=>p.status==='Active');
  const pinned=new Set(SELECTION.pinnedAv2||[]);
  const av2All=sorted.filter(p=>p.status==='AV2');
  const av2=[...av2All.filter(p=>pinned.has(p.name)),...av2All.filter(p=>!pinned.has(p.name))]
    .slice(0,SELECTION.av2Slots).sort(byRating);
  const alumniSlots=SELECTION.totalPlayers-left.length-av2.length;
  if(alumniSlots<0)throw Error('Active + AV-2 slots exceed the '+SELECTION.totalPlayers+'-player poster');
  const alumni=sorted.filter(p=>p.status==='Inactive').slice(0,alumniSlots);
  return {left,av2,alumni};
}

function categoryPoints(p){
  return Object.fromEntries(Object.entries(CATEGORY_KEYS).map(([c,keys])=>
    [c,keys.reduce((s,k)=>s+(Number(p.ratingPoints?.[k])||0),0)]));
}
function crownCounts(p){
  const c=Object.values(p.ratingCrowns||{});
  return {gold:c.filter(x=>x.metal==='gold').length,silver:c.filter(x=>x.metal==='silver').length};
}

function previousSnapshot(date){
  if(!fs.existsSync(HISTORY_DIR))return null;
  const files=fs.readdirSync(HISTORY_DIR).filter(f=>/^ratings-\d{4}-\d{2}-\d{2}\.json$/.test(f)&&f.slice(8,18)<date).sort();
  if(!files.length)return null;
  const file=files.at(-1);
  return {file:'data/ratings-history/'+file,data:JSON.parse(fs.readFileSync(path.join(HISTORY_DIR,file),'utf8'))};
}

function build(date){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))throw Error('Date must be YYYY-MM-DD');
  const release=exportRelease(),projection=release.projection;
  const people=projection.people.filter(p=>['Active','AV2','Inactive'].includes(p.status)&&Number.isFinite(p.ratingAdjusted));
  const {left,av2,alumni}=select(people);
  const shown=[...left,...av2,...alumni].sort(byRating);
  const posterRank=competitionRanks(shown);
  // Climbs use the full current-member cohort (Active + AV-2), so a player
  // moving on/off the 100-player poster is never mistaken for a climb.
  const cohort=people.filter(p=>p.status==='Active'||p.status==='AV2').sort(byRating);
  const overallRank=competitionRanks(cohort);
  const panelOf=new Map([...left.map(p=>[p.name,'AVENGERS']),...av2.map(p=>[p.name,'AV-2']),...alumni.map(p=>[p.name,'ALUMNI'])]);
  const row=p=>({canonicalName:p.name,status:p.status,ratingTotal:p.ratingTotal,ratingBonus:p.ratingBonus,
    ratingAdjusted:p.ratingAdjusted,overallRank:overallRank.get(p.name)??null,posterRank:posterRank.get(p.name)??null,
    posterPanel:panelOf.get(p.name)||null,categoryBasePoints:categoryPoints(p),crowns:crownCounts(p),
    crownMetrics:Object.fromEntries(Object.entries(p.ratingCrowns||{}).map(([k,v])=>[k,v.metal]))});
  const players=[...cohort,...alumni].map(row);

  const prev=previousSnapshot(date);
  const changes={baseline:prev?.file||null,firstWeek:!prev,climbs:[],newlyRanked:[],perfectTen:[],newPerfectTen:[],crownsGained:[],crownsLost:[]};
  const prevBy=new Map((prev?.data.players||[]).map(p=>[p.canonicalName,p]));
  for(const p of players){
    if(p.ratingTotal>=10-1e-6){
      changes.perfectTen.push(p.canonicalName);
      const before=prevBy.get(p.canonicalName);
      if(prev&&!(before&&before.ratingTotal>=10-1e-6))changes.newPerfectTen.push(p.canonicalName);
    }
    if(!prev||p.overallRank===null)continue;
    const before=prevBy.get(p.canonicalName);
    if(!before||before.overallRank===null||!['Active','AV2'].includes(before.status)){changes.newlyRanked.push({name:p.canonicalName,rank:p.overallRank});continue;}
    const climb=before.overallRank-p.overallRank,delta=r3(p.ratingAdjusted-before.ratingAdjusted);
    if(climb>0||delta>0)changes.climbs.push({name:p.canonicalName,from:before.overallRank,to:p.overallRank,climb,ratingDelta:delta,
      significant:climb>=SELECTION.significantClimb.places||delta>=SELECTION.significantClimb.rating});
    for(const [k,m] of Object.entries(p.crownMetrics))if(before.crownMetrics?.[k]!==m)changes.crownsGained.push({name:p.canonicalName,metric:k,metal:m});
    for(const [k,m] of Object.entries(before.crownMetrics||{}))if(!p.crownMetrics[k])changes.crownsLost.push({name:p.canonicalName,metric:k,metal:m});
  }
  changes.climbs.sort((a,b)=>b.climb-a.climb||b.ratingDelta-a.ratingDelta);

  const snapshot={schemaVersion:1,weekEndingLocal:date,timezone:'America/Chicago',generatedAtUtc:new Date().toISOString(),
    sourceGitSha:process.env.GITHUB_SHA||gitSha(),projectionVersion:projection.version,
    scope:{eligibleCrownCohort:'Active + AV2',overallRankCohort:'Active + AV2',posterTargetPlayers:SELECTION.totalPlayers,
      rankRule:'competition-ranking on full adjusted precision'},players};
  const poster={date,counts:{total:shown.length,avengers:left.length,av2:av2.length,alumni:alumni.length},
    leaders:shown.slice(0,3).map(p=>row(p)),
    left:left.map(row),right:[...av2,...alumni].sort(byRating).map(row),sourceGitSha:snapshot.sourceGitSha,
    metrics:metricsTable(projection.ratingLeaders)};
  return {snapshot,poster,changes};
}
function gitSha(){try{return require('node:child_process').execSync('git rev-parse HEAD',{cwd:root}).toString().trim();}catch{return null;}}

module.exports={build,select,competitionRanks};
if(require.main===module){
  try{
    const [date,flag]=process.argv.slice(2);
    if(flag&&flag!=='--save-snapshot')throw Error('Usage: node scripts/export-ratings-poster.cjs YYYY-MM-DD [--save-snapshot]');
    const out=build(date);
    fs.mkdirSync(path.join(root,'reports'),{recursive:true});
    const report=path.join(root,'reports','ratings-'+date+'.json');
    fs.writeFileSync(report,JSON.stringify({poster:out.poster,changes:out.changes},null,1)+'\n');
    let saved=null;
    if(flag==='--save-snapshot'){
      fs.mkdirSync(HISTORY_DIR,{recursive:true});
      saved=path.join(HISTORY_DIR,'ratings-'+date+'.json');
      if(fs.existsSync(saved))throw Error('Snapshot already exists (snapshots are immutable): '+saved);
      fs.writeFileSync(saved,JSON.stringify(out.snapshot,null,1)+'\n');
    }
    console.log(JSON.stringify({report,snapshot:saved,counts:out.poster.counts,firstWeek:out.changes.firstWeek,
      perfectTen:out.changes.perfectTen,significantClimbs:out.changes.climbs.filter(c=>c.significant).length,
      sha256:crypto.createHash('sha256').update(fs.readFileSync(report)).digest('hex')}));
  }catch(e){console.error(e.message);process.exitCode=1;}
}
