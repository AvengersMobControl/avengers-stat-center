'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {create}=require('./create-site-release.cjs');
const {preview}=require('./stage-event-update.cjs');
const {build}=require('./build-site.cjs');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {UNITS}=require('./event-projection-core.cjs');
const accepted=require('../data/approved-event-updates.json').updates;
const base=create();
const person=(release,name='AV-HarryBallsagna')=>release.projection.people.find(x=>x.name===name);
const source=(release,id)=>release.projection.events.find(x=>x.id===id);
const EVENTS={
 piggy:{id:'piggy|2026-10-10',kind:'piggy',date:'2026-10-10',status:'final',unit:UNITS.piggy,metadata:{},sources:['fixture:verified-piggy'],rows:[]},
 space:{id:'space|2026-10-10',kind:'space',date:'2026-10-10',status:'final',unit:UNITS.space,metadata:{},sources:['fixture:verified-space'],rows:[]},
 flash:{id:'flash|2026-10-10|1',kind:'flash',date:'2026-10-10',status:'final',unit:UNITS.flash,metadata:{flash:1},sources:['fixture:verified-flash'],rows:[]},
 kraken:{id:'kraken|fixture',kind:'kraken',date:'2026-10-10',status:'partial',unit:UNITS.kraken,metadata:{monthKey:'fixture',monthLabel:'Fixture'},sources:['fixture:verified-kraken'],rows:[]}
};
const meta={clan:'AV-2',player:'AV-HarryBallsagna',score:60000,sparks:123,stars:1230};
for(const kind of Object.keys(EVENTS))test(kind+' approved insert / correction / revocation updates EVERY materialized result and export',()=>{
 const orig=EVENTS[kind],row={...meta,stars:kind==='kraken'?null:meta.stars};
 const e={...orig,rows:[row]},update={approved:false,expectedRevision:0,event:e};
 assert.throws(()=>preview(accepted,update,{requireApproval:true}),/reviewed approval/);
 const sim=preview(accepted,update);
 assert(sim.reviewRequired&&!sim.unchanged);
 assert(!sim.before.projection.events.some(x=>x.id===e.id));
 const acceptedAdd={...update,approved:true};
 const added=create({updates:[...accepted,acceptedAdd]}),p=person(added),old=person(base);
 const affected=source(added,e.id);
 assert.equal(affected.rows.length,1);
 assert.equal(affected.rows[0].clan,'AV-2','event-time clan cannot be current roster');
 assert.equal(affected.rows[0].sparks,123);
 assert.equal(affected.rows[0].stars,row.stars);
 assert.equal(p.screenshotGap,old.screenshotGap,'static official Unlogged Sparks preserved');
 assert.equal(p.earned.sparks-old.earned.sparks,123);
 assert.equal(p.categories[kind].sparks-old.categories[kind].sparks,123);
 if(kind!=='kraken')assert.equal(p.earned.stars-old.earned.stars,1230);
 assert.equal(added.breakdowns[row.player].eventLoggedSparks,p.earned.sparks);
 assert.equal(added.breakdowns[row.player][kind+'Sparks'],p.categories[kind].sparks);
 assert.equal(added.globals.AVENGERS_DATA.members.find(x=>x.name===row.player).totalSparks,p.earned.sparks);
 assert.equal(added.globals.AVENGERS_DATA.members.find(x=>x.name===row.player).ratingTotal,p.ratingTotal);
 assert.equal(added.projection.leagues.find(l=>l.end==='2026-10-11').clans['AV-2'].sparks-
  base.projection.leagues.find(l=>l.end==='2026-10-11').clans['AV-2'].sparks,123);
 const history=p.history.filter(x=>x.eventId===e.id);assert.equal(history.length,1);
 assert.equal(history[0].clan,'AV-2');
 if(kind==='piggy'||kind==='space'){
  const field=kind==='piggy'?'lines':'yearsB';
  const rows=added.globals.AVENGERS_DATA[kind].events[e.date];
  assert(rows.some(x=>x.name===row.player&&x[field]===row.score&&x.sparks===123));
 }else if(kind==='flash'){
  assert(added.globals.AVENGERS_PIGGY_FLASH_DATA.events.some(x=>x.id===e.id.slice(6)&&x.entries.some(r=>r.name===row.player&&r.sparks===123)));
 }else{
  assert(added.globals.AVENGERS_KRAKEN_DATA.players.find(x=>x.name===row.player).fixture===60000);
 }
 const correction={approved:true,expectedRevision:1,event:{...e,rows:[{...row,score:3,sparks:7,stars:kind==='kraken'?null:70}]}};
 const corrected=create({updates:[...accepted,acceptedAdd,correction]}),q=person(corrected);
 assert.equal(source(corrected,e.id).revision,2);
 assert.equal(q.categories[kind].sparks-old.categories[kind].sparks,7);
 assert.equal(q.totalSparks-q.earned.sparks,old.screenshotGap);
 assert.equal(corrected.breakdowns[row.player].eventLoggedSparks,old.earned.sparks+7);
 assert.notEqual(added.projection.version,corrected.projection.version);
 const revoke={approved:true,expectedRevision:2,event:{...correction.event,status:'revoked'}};
 const removed=create({updates:[...accepted,acceptedAdd,correction,revoke]});
 assert(!removed.projection.events.find(x=>x.id===e.id).rows.some(x=>x.status==='final'),'revoked event never remains active');
 assert.equal(person(removed).earned.sparks,old.earned.sparks);
 assert.equal(person(removed).screenshotGap,old.screenshotGap);
 assert.equal(removed.breakdowns[row.player][kind+'Sparks'],base.breakdowns[row.player][kind+'Sparks']);
 assert.equal(removed.globals.AVENGERS_DATA.members.find(x=>x.name===row.player).totalSparks,old.earned.sparks);
});
test('approved site bundle, browser marker, immutable assets and all six period exports share exactly one version',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'avengers-one-release-'));
 try{
  const r=build({destination:dir});
  const manifest=JSON.parse(fs.readFileSync(path.join(dir,'release-manifest.json'),'utf8'));
  assert.equal(manifest.version,r.release.projection.version);
  assert.equal(manifest.unattendedIngestionEnabled,false);
  const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
  assert(html.includes('data-release-version="'+manifest.version+'"'));
  assert(html.includes(manifest.version.slice(0,16)));
  const data=JSON.parse(fs.readFileSync(path.join(dir,manifest.exports.projection),'utf8'));
  const league=JSON.parse(fs.readFileSync(path.join(dir,manifest.exports.leagues),'utf8'));
  const ledger=JSON.parse(fs.readFileSync(path.join(dir,manifest.exports.ledger),'utf8'));
  assert.equal(data.version,manifest.version);assert.equal(league.version,manifest.version);
  assert.equal(ledger.version,manifest.version);
  assert.equal(league.data.length,6,'six independently recalculated league periods');
  assert.equal(r.release.globals.AVENGERS_DATA.meta.eventProjectionVersion,manifest.version);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
