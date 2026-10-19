'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {analyze,ordinal}=require('../space-rank-history.js');
const row=(player,clan,score,rank,group)=>({player,clan,score,metadata:{rank,group}});
const event=(date,rows,options={})=>({kind:'space',id:'space|'+date,date,status:options.status||'final',
  metadata:options.metadata||{},rows});
test('original lobby finish is never synthesized from score order or captured clan rank',()=>{
  const e=event('2026-09-01',[
    row('A','AVENGERS',100,5,1),row('B','AVENGERS',50,1,2),
    row('C','AV-2',200,1,1),row('D','AV-2',180,2,1)]);
  const rank=analyze([e]).byEvent.get(e.id);
  assert.equal(rank.get('AVENGERS|A').lobbyFinish,5);
  assert.equal(rank.get('AVENGERS|A').recordedClanFinish,1);
  assert.equal(rank.get('AVENGERS|B').lobbyFinish,1);
  assert.equal(rank.get('AVENGERS|B').recordedClanFinish,2);
  assert.equal(rank.get('AV-2|C').recordedClanFinish,1,'different clan has separate list');
  assert.equal(rank.get('AVENGERS|A').verifiedClanFinish,null,'final status is NOT full coverage proof');
});
test('partial, missing rank/lobby and invalid ranks cannot mint source finishes',()=>{
  const e=event('2026-10-16',[row('A','AVENGERS',555,1,'A'),row('B','AVENGERS',230,null,1),
    {player:'C',clan:'AVENGERS',score:170,metadata:{rank:1}}],{
      status:'partial',metadata:{verifiedAllLobbyClans:{AVENGERS:true}}});
  const out=analyze([e]);const ranks=out.byEvent.get(e.id);
  assert.equal(ranks.get('AVENGERS|A').lobbyFinish,1);
  assert.equal(ranks.get('AVENGERS|B').lobbyFinish,null);
  assert.equal(ranks.get('AVENGERS|C').lobbyFinish,null);
  assert.equal(ranks.get('AVENGERS|A').verifiedClanFinish,null);
  assert.equal(out.lobbyBestByPlayer.has('C'),false);
  assert.equal(ordinal(null),'—');assert.equal(ordinal(1),'1st');assert.equal(ordinal(22),'22nd');
});
test('source-scoped lobby PB improves independently of distance and retained aliases',()=>{
  const first=event('2026-09-01',[row('Old','AVENGERS',500,5,'main')]);
  const next=event('2026-09-08',[row('New','AVENGERS',100,1,'main')]);
  const transfer=event('2026-09-15',[row('New','AV-2',30,2,'av2')]);
  const result=analyze([next,transfer,first],{Old:'New'});
  assert.equal(result.lobbyBestByClan.get('AVENGERS|New').rank,1,'1st at 100B outranks 5th at 500B');
  assert.equal(result.lobbyBestByClan.get('AV-2|New').rank,2,'AV-2 history separate');
  assert.equal(result.lobbyBestByPlayer.get('New').rank,1);
  const change=result.lobbyTransitionsByEvent.get(next.id)[0];
  assert.deepEqual([change.previous,change.rank,change.improved,change.previousDate],[5,1,true,'2026-09-01']);
  assert.equal(result.lobbyTransitionsByEvent.get(transfer.id)[0].first,true,'first in AV-2 even after prior AVENGERS result');
});
test('verified all-lobby clan finish requires explicit per-clan attestation and final rows',()=>{
  const e=event('2026-09-01',[
    row('Winner','AVENGERS',400,1,'A'),row('Tied','AVENGERS',400,1,'B'),
    row('Last','AVENGERS',100,2,'B'),row('Other','AV-2',900,1,'Z')],
    {metadata:{verifiedAllLobbyClans:{AVENGERS:true}}});
  const out=analyze([e]);const map=out.byEvent.get(e.id);
  assert.equal(map.get('AVENGERS|Winner').verifiedClanFinish,1);
  assert.equal(map.get('AVENGERS|Tied').verifiedClanFinish,1,'competition ranking ties');
  assert.equal(map.get('AVENGERS|Last').verifiedClanFinish,3);
  assert.equal(map.get('AV-2|Other').verifiedClanFinish,null,'AV-2 not attested');
  assert.equal(out.verifiedClanBestByPlayer.get('Winner').rank,1);
  const corrected=event('2026-09-01',[row('Winner','AVENGERS',100,1,'A')],
    {status:'partial',metadata:{verifiedAllLobbyClans:{AVENGERS:true}}});
  assert.equal(analyze([corrected]).verifiedClanBestByPlayer.size,0,'correction invalidates certified finish');
  assert.equal(analyze([{...e,status:'revoked'}]).lobbyBestByPlayer.size,0,'revocation rebuilds all PBs');
});
test('actual Oct 16 approved partial Space event retains source rank and no false official finish',()=>{
  const {create}=require('./create-site-release.cjs');
  const events=create().projection.events;
  const e=events.find(e=>e.id==='space|2026-10-16');
  const out=analyze(events);
  const positions=out.byEvent.get(e.id);
  const av=e.rows.filter(r=>r.clan==='AVENGERS');
  const av2=e.rows.filter(r=>r.clan==='AV-2');
  assert.equal(av.length,44);assert.equal(av2.length,22);
  const leader=e.rows.find(r=>r.player==='AV-Zolika.x.TheBoss');
  assert.equal(positions.get('AVENGERS|'+leader.player).lobbyFinish,1);
  assert.equal(positions.get('AVENGERS|'+leader.player).lobby,'A');
  assert.equal(positions.get('AVENGERS|'+leader.player).verifiedClanFinish,null);
  assert([...positions.values()].every(r=>r.verifiedClanFinish===null),'66 recorded rows cannot be called official clan placements');
});
test('Space rank module is wired into the site and event table differentiates rank scopes',()=>{
  const html=readFileSync(join(__dirname,'../index.html'),'utf8');
  assert.match(html,/<script src="space-rank-history\.js"><\/script>/);
  assert.match(html,/Recorded Clan #/);
  assert.match(html,/Lobby Finish/);
  assert.match(html,/Verified Clan #/);
});
