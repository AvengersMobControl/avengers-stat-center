'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {rankRows,bestFinishes,placementHistory,careerPodiums,formatFinish,MIN_AVENGERS_IN_LOBBY}=require('../roster-piggy-pb-rank.js');
function race(id,clan='AVENGERS',size=30,opts={}){
  const rows=Array.from({length:size},(_,i)=>({
    player:i===0?(opts.first||'Hero'):'Player '+i,
    clan,
    score:i===0?(opts.firstLines||10000):50000-i*80,
    metadata:{rank:i+1,...(opts.lobby!==undefined?{lobby:opts.lobby}:{})}
  }));
  return {id,kind:opts.kind||'piggy',date:'2026-10-11',status:opts.status||'final',rows};
}
test('best finishing rank ignores lines and finds the best place across large AVENGERS races',()=>{
  const first=race('piggy|first');
  const fifth=race('piggy|fifth');
  fifth.rows[0].metadata.rank=5;
  fifth.rows[0].score=30000;
  assert.equal(first.rows[0].score,10000);
  assert.equal(fifth.rows[0].score,30000);
  const result=rankRows([{name:'Hero',piggyPB:30000},{name:'Player 1',piggyPB:49920}],[first,fifth]);
  assert.equal(result[0].piggyPBRank,1,'1st with 10k overrides 5th with 30k');
  assert.equal(result[1].piggyPBRank,2,'other members retain their best literal place');
  assert.equal(formatFinish(result[0].piggyPBRank),'1st');
  assert.equal(formatFinish(result[1].piggyPBRank),'2nd');
});
test('AV-2 races excluded even if they contain 35 racers, as are solo and 29-player AVENGERS races',()=>{
  const av2=race('piggy|av2','AV-2',35,{first:'AV2Only'});
  const small=race('piggy|small','AVENGERS',29,{first:'SmallOnly'});
  const solo=race('piggy|solo','AVENGERS',1,{first:'Solo'});
  const rows=rankRows([{name:'AV2Only'},{name:'SmallOnly'},{name:'Solo'}],[av2,small,solo]);
  assert.deepEqual(rows.map(r=>r.piggyPBRank),[null,null,null]);
  assert.equal(MIN_AVENGERS_IN_LOBBY,30);
});
test('Two separate sub-30 AVENGERS lobbies on same date do not combine; solo winner never beats main',()=>{
  const event=race('piggy|oct11','AVENGERS',30,{first:'MainWinner',lobby:'main'});
  event.rows.push({player:'SoloWinner',clan:'AVENGERS',score:100,metadata:{rank:1,lobby:'solo'}});
  const out=rankRows([{name:'MainWinner'},{name:'SoloWinner'}],[event]);
  assert.deepEqual(out.map(r=>r.piggyPBRank),[1,null]);
  const split=race('piggy|split','AVENGERS',20,{first:'LobbyA',lobby:'A'});
  split.rows.push(...race('unused','AVENGERS',20,{first:'LobbyB',lobby:'B'}).rows);
  assert.equal(bestFinishes([split]).qualifying.size,0);
});
test('A qualifying rank is lifetime per player; clan roster filtering must not rerank finishes',()=>{
  const event=race('piggy|large');
  const currentAV=rankRows([{name:'Hero'}],[event]);
  const transferredToAV2=rankRows([{name:'Alias'}],[event],{Alias:'Hero'});
  assert.deepEqual(currentAV.map(r=>r.piggyPBRank),[1]);
  assert.deepEqual(transferredToAV2.map(r=>r.piggyPBRank),[1]);
  assert.equal(rankRows([{name:'Untracked'}],[event])[0].piggyPBRank,null);
});
test('Never infer finish from a line score if original rank missing, invalid or revoked',()=>{
  const event=race('piggy|valid');
  event.rows[0].metadata.rank=null;
  const flash=race('flash|1','AVENGERS',35,{first:'FlashWinner',kind:'flash'});
  const revoked=race('piggy|revoked','AVENGERS',35,{first:'RevokedWinner',status:'revoked'});
  const out=rankRows([{name:'Hero'},{name:'FlashWinner'},{name:'RevokedWinner'}],[event,flash,revoked]);
  assert.deepEqual(out.map(r=>r.piggyPBRank),[null,null,null]);
  assert.deepEqual([1,2,3,4,11,12,13,21,22,23,30].map(formatFinish),
    ['1st','2nd','3rd','4th','11th','12th','13th','21st','22nd','23rd','30th']);
});
test('Rosters use approved event results and display sortable ordinal placement, not personal-best lines',()=>{
  const html=readFileSync(join(__dirname,'../index.html'),'utf8');
  assert.match(html,/<script src="roster-piggy-pb-rank\.js"><\/script>/);
  assert.match(html,/rows=window\.AVENGERS_ROSTER_PIGGY_PB_RANK\.rankRows\(rows,window\.AVENGERS_EVENT_PROJECTION\?\.events\|\|\[\],D\.aliasMap\|\|\{\}\);/);
  assert.match(html,/piggyPBRank:\{label:'Piggy PB Rank',type:'number',get:r=>r\.piggyPBRank\}/);
  assert.match(html,/id:'piggyAchievements',name:'Piggy Achievements',keys:\['piggyWins','piggyPodiums','piggyPBRank'\],summary:'piggyPBRank'/);
  assert.match(html,/r\.piggyPBRank==null\?missing:window\.AVENGERS_ROSTER_PIGGY_PB_RANK\.formatFinish\(r\.piggyPBRank\)/);
  assert.match(html,/Line totals do not determine this number/);
});

test('rank PB improvements are recorded by event even without a higher line PB',()=>{
  const early=race('piggy|2026-09-01','AVENGERS',30,{first:'Hero',firstLines:30000});
  early.date='2026-09-01';early.rows[0].metadata.rank=5;
  const later=race('piggy|2026-10-01','AVENGERS',35,{first:'Hero',firstLines:10000});
  later.date='2026-10-01';later.rows[0].metadata.rank=1;
  const ignored=race('piggy|2026-10-08','AVENGERS',29,{first:'SoloWinner'});
  ignored.date='2026-10-08';
  const history=placementHistory([ignored,later,early]);
  assert.deepEqual(history.byEvent.get(early.id).filter(x=>x.player==='Hero').map(x=>[x.previousRank,x.newRank,x.firstQualified]),[[null,5,true]]);
  assert.deepEqual(history.byEvent.get(later.id).filter(x=>x.player==='Hero').map(x=>[x.previousRank,x.newRank,x.improved]),[[5,1,true]]);
  assert.equal(history.byPlayer.get('Hero'),1);
  assert.equal(history.byEvent.get(ignored.id).length,0);
  assert.equal(rankRows([{name:'Hero',piggyPB:30000}],[early,later])[0].piggyPBRank,1);
});
test('rank PB event history excludes AV-2 and individual lobby winners',()=>{
  const main=race('piggy|2026-10-11','AVENGERS',30,{first:'Main',lobby:'main'});
  main.date='2026-10-11';
  main.rows.push({player:'Solo',clan:'AVENGERS',score:500,metadata:{rank:1,lobby:'separate'}});
  main.rows.push(...race('x','AV-2',34,{first:'AV2Winner',lobby:'av2'}).rows);
  const history=placementHistory([main]);
  assert.equal(history.byPlayer.get('Main'),1);
  assert.equal(history.byPlayer.get('Solo'),undefined);
  assert.equal(history.byPlayer.get('AV2Winner'),undefined);
  assert(!history.byEvent.get(main.id).some(x=>x.player==='Solo'||x.player==='AV2Winner'));
});

test('career podiums count only verified event-time Piggy finishes, independent of lines',()=>{
  const e1=race('piggy|2026-09-01','AVENGERS',30,{first:'Hero'});e1.date='2026-09-01';
  const e2=race('piggy|2026-09-08','AVENGERS',30,{first:'Hero'});e2.date='2026-09-08';
  e2.rows[0].metadata.rank=2;
  const e3=race('piggy|2026-09-15','AVENGERS',30,{first:'Hero'});e3.date='2026-09-15';
  e3.rows[0].metadata.rank=3;
  const small=race('piggy|small','AVENGERS',29,{first:'Hero'});
  const other=race('piggy|av2','AV-2',40,{first:'Hero'});
  const flash=race('flash|1','AVENGERS',40,{first:'Hero',kind:'flash'});
  const revoked=race('piggy|revoked','AVENGERS',40,{first:'Hero',status:'revoked'});
  const sum=careerPodiums([e3,e1,e2,small,other,flash,revoked]);
  assert.deepEqual(sum.byPlayer.get('Hero'),{wins:1,secondPlaces:1,thirdPlaces:1,podiums:3});
  assert.equal(sum.byEvent.get(e3.id).find(x=>x.player==='Hero').podiums,3);
  assert.equal(sum.byEvent.get(e1.id).find(x=>x.player==='Hero').wins,1);
  const row=rankRows([{name:'Old Hero'}],[e1,e2,e3,small,other,flash,revoked],{'Old Hero':'Hero'})[0];
  assert.equal(row.piggyWins,1);assert.equal(row.piggyPodiums,3);
  assert.equal(row.piggyPBRank,1);
});
test('October 18 leader spotlights are verified against complete event history',()=>{
  const {create}=require('./create-site-release.cjs');
  const {projection}=create();
  const summary=careerPodiums(projection.events);
  assert.deepEqual(summary.byPlayer.get('AV-SiFra'),{wins:1,secondPlaces:0,thirdPlaces:0,podiums:1});
  assert.deepEqual(summary.byPlayer.get('AV-Chuck'),{wins:0,secondPlaces:1,thirdPlaces:0,podiums:1});
  assert.deepEqual(summary.byPlayer.get('AV-WolfLegend'),{wins:0,secondPlaces:0,thirdPlaces:2,podiums:2});
});
test('roster and player profiles expose historical wins and podiums without re-ranking lines',()=>{
  const html=readFileSync(join(__dirname,'../index.html'),'utf8');
  assert.match(html,/id:'piggyAchievements',name:'Piggy Achievements'/);
  assert.match(html,/piggyPodiums:'Podiums'/);
  assert.match(html,/Piggy Podiums<\/span><strong>\$\{podium\.podiums\}/);
});

test('Piggy and Flash display actual original ranks, not Sparks/Lines efficiency',()=>{
  const html=readFileSync(join(__dirname,'../index.html'),'utf8');
  const flash=readFileSync(join(__dirname,'../piggy-flashes.js'),'utf8');
  assert(!html.includes("Sparks/Effort (per line)"));
  assert(!flash.includes("Sparks/Effort (per line)"));
  assert.match(html,/Original event finishing position; — means source rank not recorded/);
  assert.match(html,/eventRow\?\.metadata\?\.rank\?\?eventRow\?\.rank/);
  assert.match(html,/Piggy Flash Event Results/);
  assert.match(html,/Space Reward \/ Effort/);
  assert(!flash.includes("efficiency(r.sparks,r.lines)"));
});

test('Space Sparks/Effort is displayed only in Space Race Event, never in other tables',()=>{
  const html=readFileSync(join(__dirname,'../index.html'),'utf8');
  const eventStart=html.indexOf("} else if(view==='event'){",html.indexOf("function renderSpace(){"));
  const last3=html.indexOf("} else if(view==='last3'){",eventStart);
  const spaceEvent=html.slice(eventStart,last3);
  const roster=html.slice(html.indexOf("function rosterGroupedTable("),html.indexOf("function renderEventTotals(){"));
  const spaceOverall=html.slice(html.indexOf("function renderSpace(){"),eventStart);
  const allTotals=html.slice(html.indexOf("function renderEventTotals(){"),html.indexOf("function renderRecords(){"));
  const playerModal=html.slice(html.indexOf("function openPlayer("),html.indexOf("function closeModal(){"));
  assert.match(spaceEvent,/Sparks\/Effort \(per B\)/);
  for(const [area,source] of [['other Space tabs',spaceOverall],['roster',roster],['event totals',allTotals],['player details',playerModal]]){
    assert(!source.includes('Sparks/Effort'),area+' must not show reward-per-effort');
  }
  assert.equal((html.match(/Sparks\/Effort \(per B\)/g)||[]).length,1,'only the Space Event column has the header');
  assert.match(html,/fmtNum\(window\.AVENGERS_REWARD_METRICS\.efficiency\(r\.sparks,r\.yearsB\),0\)/);
});
test('Piggy achievement group defaults collapsed with wins/podiums/PB rank under its expanded header',()=>{
  const html=readFileSync(join(__dirname,'../index.html'),'utf8');
  assert.match(html,/piggyAchievements:false/);
  assert.match(html,/id:'piggyAchievements',name:'Piggy Achievements',keys:\['piggyWins','piggyPodiums','piggyPBRank'\],summary:'piggyPBRank'/);
  assert.match(html,/piggyWins:'Wins',piggyPodiums:'Podiums',piggyPBRank:'PB Rank'/);
  assert.match(html,/case 'piggyPBRank':return/);
  assert.match(html,/case 'piggyPodiums':return/);
  assert(!html.includes("{id:'effort',name:'Space Sparks/Effort'"));
});
