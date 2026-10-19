'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {empty,apply,project,UNITS}=require('./event-projection-core.cjs');
const members=[{name:'A',status:'AV2'},{name:'B',status:'Active'},{name:'Untouched',status:'Active'}];
const options={members,snapshots:{A:500,B:0,Untouched:null}};
function ev(kind,id,date,score,clan='AVENGERS',extra={}){
  return {id,kind,date,unit:UNITS[kind],status:'final',sources:['fixture:'+id],
    rows:[{player:'A',clan,score,sparks:10,stars:kind==='kraken'?null:100}],...extra};
}
function put(l,e,expectedRevision=0,extra={}){return apply(l,e,{approved:true,expectedRevision,...extra}).ledger;}
const person=(p,n='A')=>p.people.find(x=>x.name===n);
for(const kind of Object.keys(UNITS))for(const clan of ['AVENGERS','AV-2'])test(kind+' / '+clan+' insert, retry, lower former PB, revoke and restore',()=>{
  let l=put(empty(),ev(kind,'first','2026-09-12',10,clan));
  const before=project(l,options),untouched=person(before,'Untouched');
  l=put(l,ev(kind,'second','2026-10-01',30,clan));
  const added=project(l,options),a=person(added);
  assert.equal(a.kinds[kind].pb,30);assert.equal(a.kinds[kind].average,20);
  assert.equal(a.kinds[kind].pbs[1].previousPB,10);assert.equal(a.kinds[kind].pbs[1].improvement,2);
  assert.equal(a.categories[kind].sparks,20);assert.equal(added.clans[clan].sparks,20);
  assert.equal(added.leagues.find(p=>p.end==='2026-10-11').clans[clan].sparks,20);
  assert.deepEqual(person(added,'Untouched'),untouched);
  const retry=apply(l,ev(kind,'second','2026-10-01',30,clan),{approved:true});
  assert.equal(retry.action,'unchanged');assert.equal(project(retry.ledger,options).version,added.version);
  l=put(l,ev(kind,'second','2026-10-01',5,clan),1);
  const lowered=project(l,options);assert.equal(person(lowered).kinds[kind].pb,10);
  assert.equal(person(lowered).kinds[kind].average,7.5);assert.equal(person(lowered).kinds[kind].pbs[1].newPB,false);
  assert.notEqual(lowered.version,added.version);
  l=put(l,ev(kind,'second','2026-10-01',5,clan,{status:'revoked'}),2);
  const revoked=project(l,options);assert.equal(person(revoked).kinds[kind].eventsRecorded,1);
  assert.equal(revoked.clans[clan].sparks,10);assert.equal(l.changes.length,4);
  assert.equal(l.changes.at(-1).before.rows[0].score,5);
  l=put(l,ev(kind,'second','2026-10-01',7,clan),3);
  assert.equal(person(project(l,options)).kinds[kind].eventsRecorded,2);
  assert.equal(before.clans[clan].sparks,10,'previous projection not mutated');
});
test('four reward categories reconcile independently; screenshot gap stays outside earned rewards',()=>{
  let l=empty();for(const [i,k]of Object.keys(UNITS).entries())l=put(l,ev(k,k,'2026-10-0'+(i+1),100));
  const p=project(l,options),a=person(p);
  assert.equal(a.earned.sparks,40);assert.equal(a.earned.stars,300);
  assert.equal(a.screenshotGap,460);assert.equal(a.totalSparks,500);
  assert.equal(p.clans.AVENGERS.sparks,40);assert.equal(p.leagues.at(-1).clans.AVENGERS.stars,300);
  assert.equal(person(p,'Untouched').screenshotGap,null);
  const after=project(l,{...options,snapshots:{A:20}});assert.equal(person(after).screenshotGap,0);assert.equal(person(after).totalSparks,40);
});
test('aliases and roster transfers preserve historical clan and distinct Frenchie accounts',()=>{
  const aliases={Old:'A'};let l=put(empty(),ev('piggy','p','2026-09-12',7000,'AVENGERS',{rows:[{player:'Old',clan:'AVENGERS',score:7000,sparks:10,stars:100}]}),0,{aliases});
  l=put(l,ev('space','s','2026-10-02',480.6,'AV-2'));
  const p=project(l,{...options,aliases,members:[...members,{name:'AV-Frenchie2',status:'AV2'},{name:'AV-Frenchie(-4)',status:'AV2'}]});
  assert.equal(person(p).status,'AV2');assert.equal(person(p).kinds.space.pb,480.6,'actual Space score used once');
  assert.equal(p.clans.AVENGERS.sparks,10);assert.equal(p.clans['AV-2'].sparks,10);
  assert.equal(p.people.filter(x=>x.name.startsWith('AV-Frenchie')).length,2);
});
test('Frenchie source identity is clan-specific for every normalized event kind',()=>{
  for(const kind of Object.keys(UNITS)){
    const id='frenchie-'+kind,when='2026-10-18';
    const e=ev(kind,id,when,20,'AV-2',{rows:[{player:'AV-FrenchieUSA',clan:'AV-2',score:20,sparks:18100,stars:kind==='kraken'?null:181000}]});
    const l=put(empty(),e);assert.equal(l.events[0].rows[0].player,'AV-Frenchie2');
    const other=ev(kind,id,when,20,'AVENGERS',{rows:[{player:'AV-FrenchieUSA',clan:'AVENGERS',score:20,sparks:18100,stars:kind==='kraken'?null:181000}]});
    const av=put(empty(),other);assert.notEqual(av.events[0].rows[0].player,'AV-Frenchie2');
  }
});
test('partial events and unknown fields remain explicit; known zero is distinct',()=>{
  const l=put(empty(),ev('piggy','partial','2026-10-01',null,'AV-2',{status:'partial',rows:[{player:'A',clan:'AV-2',score:null,sparks:null,stars:0}]}));
  const p=project(l,options),a=person(p);
  assert.equal(a.kinds.piggy.pb,null);assert.equal(a.kinds.piggy.unknownScores,1);
  assert.equal(a.categories.piggy.unknownSparks,1);assert.equal(a.categories.piggy.unknownStars,0);
  assert.equal(a.totalSparksComplete,false);assert.deepEqual(p.coverage.partialEvents,['partial']);
  assert.equal(p.council.at(-1).observedEvents.length,0);
});
test('ratings, last three, PB ranks and Council observations rebuild from the same corrected rows',()=>{
  let l=empty();for(const [i,v]of [1000,3500,7000,14000].entries())l=put(l,ev('piggy','p'+i,'2026-09-'+(12+i),v));
  l=put(l,ev('space','s','2026-09-27',49));l=put(l,ev('kraken','k','2026-10-11',1750));
  const p=project(l,options),a=person(p);
  assert.equal(a.kinds.piggy.last3,(3500+7000+14000)/3);
  assert.equal(a.ratingPB,14000/35000+49/350+0.5);
  assert.equal(a.ratingAvg,6375/25000+49/200+1750/2800);
  assert.equal(p.rankings.piggyPB[0].name,'A');
  const period=p.council.find(x=>x.end==='2026-10-11');
  assert.equal(period.observedEvents.filter(r=>r.underMinimum).length,2);
  assert.equal(period.observedEvents.find(r=>r.kind==='space').limit,50);
});
test('conflicting duplicates, ambiguous identities, bad units and concurrent corrections fail closed',()=>{
  const e=ev('piggy','x','2026-10-01',1);
  assert.throws(()=>apply(empty(),e),/approval/);
  assert.throws(()=>put(empty(),{...e,unit:'damage'}),/unit/);
  assert.throws(()=>put(empty(),{...e,date:'2026-02-30'}),/date/);
  assert.throws(()=>put(empty(),{...e,rows:[{...e.rows[0],clan:null}]}),/clan/);
  assert.throws(()=>put(empty(),{...e,rows:[{...e.rows[0],sparks:-1}]}),/sparks/);
  assert.throws(()=>put(empty(),{...e,rows:[e.rows[0],{...e.rows[0],score:2}]}),/Conflicting/);
  const l=put(empty(),e);assert.throws(()=>put(l,{...e,rows:[]}),/Revision/);
  const overlap=put(l,{...e,id:'other'});assert.throws(()=>project(overlap,options),/Overlapping/);
  assert.throws(()=>project(l,{aliases:{A:'B',B:'A'}}),/cycle/);
  assert.throws(()=>put(empty(),ev('kraken','k','2026-10-11',1,'AV-2',{rows:[{player:'A',clan:'AV-2',score:1,sparks:10,stars:0}]})),/no Stars/);
});
test('projection is deterministic, version covers membership and snapshots, source inputs remain unchanged',()=>{
  const e=ev('space','s','2026-10-02',480.6);const frozen=JSON.stringify(e),l=put(empty(),e);
  const saved=JSON.stringify(l),a=project(l,options),b=project(l,{...options,members:[...members].reverse()});
  assert.equal(a.version,b.version);assert.equal(JSON.stringify(e),frozen);assert.equal(JSON.stringify(l),saved);
  assert.notEqual(a.version,project(l,{...options,snapshots:{A:501}}).version);
  assert.notEqual(a.version,project(l,{...options,members:members.map(m=>({...m,status:'Inactive'}))}).version);
});
test('unknown historical clan and unassigned reward stay explicit without fabricating a member',()=>{
  const e=ev('kraken','unknown','2026-10-11',1,'AV-2',{rows:[
    {player:null,sourceIdentity:'source-rank-20',clan:'AV-2',score:36.2,sparks:18100,stars:null},
    {player:'A',clan:null,clanAttribution:'unknown',score:10,sparks:null,stars:null}
  ]});
  const p=project(put(empty(),e),options);
  assert.equal(p.clans['AV-2'].sparks,18100);
  assert.equal(p.coverage.unassignedRows.length,1);
  assert.equal(p.coverage.unknownClanRows,1);
  assert(!p.people.some(m=>m.name===null));
  assert.equal(person(p).earned.unknownSparks,1);
});

test('dated lifetime Sparks gap persists after later earnings across a transfer',()=>{
 let l=put(empty(),ev('piggy','earlier','2026-09-28',50));
 l=put(l,ev('space','later','2026-10-16',60,'AV-2'));
 const p=project(l,{members:[{name:'A',status:'AV2'}],snapshots:{A:{amount:500,beforeDate:'2026-09-30'}}});
 const a=person(p);
 assert.equal(a.loggedAtSnapshot,10);assert.equal(a.screenshotGap,490);
 assert.equal(a.totalSparks,510);assert.equal(a.earned.sparks,20);
 assert.equal(p.clans.AVENGERS.sparks,10);assert.equal(p.clans['AV-2'].sparks,10);
});

test('pre-logging gap stays fixed after Space payout and transfer resets',()=>{
 let l=put(empty(),ev('piggy','old','2026-09-22',1,'AVENGERS'));
 l=put(l,ev('space','oct16','2026-10-16',1,'AV-2'));
 const evidence={A:[{amount:500,beforeDate:'2026-09-30',clan:'AVENGERS'},
  {amount:0,beforeDate:'2026-10-16',clan:'AV-2'}]};
 const p=person(project(l,{members,snapshots:evidence}));
 assert.equal(p.loggedAtSnapshot,10);
 assert.equal(p.screenshotGap,490);
 assert.equal(p.totalSparks,510);
 assert.equal(p.snapshotBreakdown[1].gap,0);
 const reversed=person(project(l,{members,snapshots:{A:[...evidence.A].reverse()}}));
 assert.equal(reversed.screenshotGap,490);
});
test('different clan screens never create additive historical Sparks',()=>{
 let l=put(empty(),ev('piggy','old','2026-09-22',1,'AVENGERS'));
 l=put(l,ev('space','new','2026-10-12',1,'AV-2'));
 const evidence={A:[{amount:500,beforeDate:'2026-09-30',clan:'AVENGERS'},
   {amount:600,beforeDate:'2026-10-16',clan:'AV-2'}]};
 const p=person(project(l,{members,snapshots:evidence}));
 assert.equal(p.screenshotGap,580);
 assert.equal(p.totalSparks,600);
 assert.equal(p.snapshotBreakdown[0].gap,490);
 assert.equal(p.snapshotBreakdown[1].gap,580);
});
test('smaller later same-clan screenshot never adds a second stint balance',()=>{
 let l=put(empty(),ev('piggy','old','2026-09-20',1));
 l=put(l,ev('space','new','2026-10-10',1));
 const evidence={A:[{amount:500,beforeDate:'2026-09-30',clan:'AVENGERS'},
  {amount:60,beforeDate:'2026-10-16',clan:'AVENGERS'}]};
 const p=person(project(l,{members,snapshots:evidence}));
 assert.equal(p.screenshotGap,490);
 assert.equal(p.totalSparks,510);
 assert.equal(p.snapshotBreakdown[1].gap,40);
});
test('Oct 16 pre-Space screenshot excludes same-day Space reward',()=>{
 let l=put(empty(),ev('piggy','old','2026-10-12',1));
 l=put(l,ev('space','space','2026-10-16',1));
 const p=person(project(l,{members,snapshots:{A:{amount:60,beforeDate:'2026-10-16',clan:'AVENGERS'}}}));
 assert.equal(p.screenshotGap,50);
 assert.equal(p.totalSparks,70);
});

test('approved prior-to-logging Sparks never change when newer events are logged',()=>{
 let ledger=put(empty(),ev('piggy','before','2026-09-28',10));
 const snapshots={A:[{amount:500,beforeDate:'2026-09-30',clan:'AVENGERS'}]};
 const opts={members,snapshots,priorToLogging:{A:490,B:0,Untouched:0}};
 const before=person(project(ledger,opts));
 assert.equal(before.screenshotGap,490);
 ledger=put(ledger,ev('space','future','2026-10-16',10,'AV-2'));
 const after=person(project(ledger,opts));
 assert.equal(after.screenshotGap,490);
 assert.equal(after.totalSparks,510);
 const changed=person(project(ledger,{...opts,snapshots:{A:[...snapshots.A,{amount:0,beforeDate:'2026-10-17',clan:'AV-2'}]}}));
 assert.equal(changed.screenshotGap,490);
 assert.equal(changed.totalSparks,510);
});
