'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
test('profile Spark metric is backed by four-category roster ledger',()=>{
 const src=read('phase2.js');
 assert.match(src,/function combinedSparksFor\(name\)/);
 assert.match(src,/AVENGERS_ROSTER_EVENT_BREAKDOWN/);
 assert.match(src,/eventLoggedSparks/);
 assert.match(src,/screenshotGap/);
 assert.match(src,/Math\.max\(0,Number\(source\.eventLoggedSparks\)/);
 assert.doesNotMatch(src,/return Math\.max\(logged,snap\)/);
});
test('achievements Spark tiers use recorded ledger rather than legacy total',()=>{
 const src=read('community-highlights.js');
 assert.match(src,/let value=def\.id==='sparks'\?/);
 assert.match(src,/AVENGERS_ROSTER_EVENT_BREAKDOWN/);
 assert.match(src,/eventLoggedSparks/);
 assert.doesNotMatch(src,/let value=def\.id==='sparks'\?Math\.max\(0,Number\(m\.totalSparks\)/);
});
test('Kraken overview uses one categorized payout per canonical account',()=>{
 const src=read('kraken.js');
 assert.match(src,/seenKraken\.has\(name\)/);
 assert.match(src,/AVENGERS_ROSTER_EVENT_BREAKDOWN/);
 assert.match(src,/krakenSparks/);
 assert.doesNotMatch(src,/ps\.reduce\(\(s,p\)=>s\+\(Number\(p\.totalSparks\)/);
});
test('Stat Center loads event breakdown before rendered player and Kraken views',()=>{
 const html=read('index.html');
 const breakdown=html.indexOf('src="roster-event-breakdown.js"');
 const p2=html.indexOf('src="phase2.js"');
 const k=html.indexOf('src="kraken.js"');
 assert(breakdown>=0&&p2>breakdown&&k>breakdown);
});

test('roster Sparks totals show unadorned event totals, not stale snapshot warning triangles',()=>{
 const src=read('index.html');
 assert.match(src,/case 'totalCombinedSparks':return fmtNum\(r\.totalCombinedSparks\);/);
 assert.doesNotMatch(src,/Snapshot discrepancy/);
 assert.doesNotMatch(src,/snapshot comparison flags/);
 assert.doesNotMatch(src,/roster-reconciliation-warning.*⚠/);
 assert.match(src,/Total Sparks = Logged Sparks \+ Screenshot Gap/);
 assert.match(src,/totalCombinedSparks:logged\+unlogged/);
 assert.match(src,/case 'totalCombinedSparks':return fmtNum\(r\.totalCombinedSparks\);/);
 assert(src.includes('eventBreakdown.screenshotGap'));
 assert(!src.includes('const trackedAtCapture='));
 assert(src.includes('const unlogged=eventBreakdown.screenshotGap==null?0:'));
});

test('positive screenshot gap adds to logged total but older snapshots never subtract',()=>{
 const total=(logged,snapshot)=>{
   const delta=snapshot==null?null:snapshot-logged;
   const gap=delta==null?0:Math.max(0,delta);
   return {logged,gap,total:logged+gap};
 };
 assert.deepEqual(total(1000,1250),{logged:1000,gap:250,total:1250});
 assert.deepEqual(total(1000,750),{logged:1000,gap:0,total:1000});
 assert.deepEqual(total(1000,null),{logged:1000,gap:0,total:1000});
 assert.deepEqual(total(1000,1000),{logged:1000,gap:0,total:1000});
});

test('pre-Space screenshots and Hoops pre-transfer amount preserve source provenance',()=>{
 const s=read('sparks-pre-space-2026-10-16.js');
 assert(s.includes('S.preSpaceOct16'));
 assert.match(s,/AV-Hoops/);
 assert.match(s,/12416538/);
 assert.match(s,/2026-09-30/);
 assert(read('index.html').includes('sparks-pre-space-2026-10-16.js'));
});

test('roster preserves pre-transfer Sparks when AV-2 later shows zero',()=>{
 const code=read('index.html');
 assert(code.includes('const remember=(key,row)=>'));
 assert(code.includes('Number(row.allTimeSparks)>Number(prior.allTimeSparks)'));
});
