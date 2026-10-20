'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {evaluate}=require('./report-clan-league-forfeitures.cjs');
const policy=require('../data/leader-reported-league-forfeitures.json');
const mock=[{start:'2026-08-03',end:'2026-09-06',members:[
 {clan:'AVENGERS',name:'AV-jacko',events:5,sparks:4000000,unknownSparks:0,estimatedKraken:40000}],
 clanSums:{AVENGERS:{sparks:169000000}}},{start:'2026-09-07',end:'2026-10-11',
 members:[{clan:'AVENGERS',name:'AV-jacko-mini',events:4,sparks:1600000,unknownSparks:0,estimatedKraken:0},
 {clan:'AVENGERS',name:'AV-LuckY',events:8,sparks:1300000,unknownSparks:0,estimatedKraken:0}],
 clanSums:{AVENGERS:{sparks:174000000}}}];
test('leader-reported names are exact historic identities, including Scout alias, and penalty is clan-only',()=>{
 assert.deepEqual(policy.entries.map(e=>[e.leagueEnd,e.name]),[
 ['2026-09-06','AV-jacko'],['2026-10-11','AV-jacko-mini'],['2026-10-11','AV-LuckY']]);
 const before=JSON.stringify(mock),r=evaluate(mock);
 assert.equal(r.entries.length,3);
 assert(r.entries.every(x=>x.status==='found_in_approved_event_rows'));
 assert.equal(r.comparisons[0].adjustedTrackedSparks,165000000);
 assert.equal(r.comparisons[1].adjustedTrackedSparks,171100000);
 assert.equal(r.ledgerModified,false);
 assert.equal(r.discordPosting,false);
 assert.equal(JSON.stringify(mock),before);
});
test('missing historical player is an evidence gap, never a fabricated zero deduction',()=>{
 const r=evaluate([mock[0],{...mock[1],members:[]}]);
 assert.equal(r.entries[1].status,'unmatched_requires_name_or_source_review');
 assert.equal(r.entries[1].knownEarnedSparks,null);
 assert.equal(r.comparisons[1].allSpecifiedMembersFound,false);
});
test('duplicate forfeitures and unsupported policies fail closed',()=>{
 assert.throws(()=>evaluate(mock,{...policy,entries:[...policy.entries,policy.entries[0]]}),/Duplicate forfeiture/);
 assert.throws(()=>evaluate(mock,{...policy,entries:[{...policy.entries[0],action:'debit_stars'}]}),/Unsupported forfeiture basis/);
});
