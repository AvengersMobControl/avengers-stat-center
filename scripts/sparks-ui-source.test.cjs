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
