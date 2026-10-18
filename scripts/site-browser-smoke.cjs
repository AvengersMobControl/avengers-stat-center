#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {build}=require('./build-site.cjs');
let playwright;try{playwright=require('playwright');}catch{playwright=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');}
async function main(){
  const built=build(),dir=built.destination,errors=[],requests=[];
  const server=http.createServer((req,res)=>{
    const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.resolve(dir,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(dir+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
    const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    let executablePath=process.env.AVENGERS_CHROMIUM_EXECUTABLE,args=['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'];
    if(process.env.AVENGERS_CHROMIUM_MODULE){const {default:chromium}=await import(process.env.AVENGERS_CHROMIUM_MODULE);executablePath=await chromium.executablePath();args=chromium.args;}
    browser=await playwright.chromium.launch({headless:true,executablePath,args});
    const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>requests.push(r.url()));
    const origin=process.env.AVENGERS_SMOKE_URL||'http://127.0.0.1:'+server.address().port;
    await page.goto(origin,{waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.AVENGERS_EVENT_PROJECTION&&window.AVENGERS_COMMUNITY);
    assert.equal(await page.evaluate(()=>window.AVENGERS_REWARD_METRICS.efficiency(100,25)),4);
    const version=await page.evaluate(()=>window.AVENGERS_EVENT_PROJECTION.version);
    if(!process.env.AVENGERS_SMOKE_URL)assert.equal(version,built.manifest.version);
    for(const status of ['active','av2']){
      await page.selectOption('#globalStatusFilter',status);
      for(const name of ['overview','rosters','piggy','piggyFlashes','space','kraken','trends','eventTotals','ratings','players','records','achievements','weeklyRecap']){
        await page.click('.nav-btn[data-page="'+name+'"]');
        assert(await page.locator('#page-'+name).isVisible(),name+' is visible');
        assert((await page.locator('#page-'+name).innerText()).trim().length>20,name+' is populated');
        assert.deepEqual(errors,[],name+' has no browser errors');
      }
    }
    // The browser shows actual best finishing PLACES (not line-score rankings).
    // This value is fixed by the qualifying historic race, not the current clan roster.
    await page.click('.nav-btn[data-page="rosters"]');
    await page.click('#rostersContent button[data-roster-sort="piggyPBRank"]');
    let originalActiveRank=null, allMembersRank=null;
    for(const roster of ['active','av2','all']){
      await page.click('#rosterTabs button[data-roster="'+roster+'"]');
      assert.equal(await page.locator('#rostersContent button[data-roster-sort="piggyPBRank"]').count(),1,'Piggy PB Rank is visible for '+roster);
      const textRanks=await page.locator('#rostersContent td.roster-piggy-pb-rank').allTextContents();
      const isRank=t=>/^\d+(st|nd|rd|th)$/.test(t.trim());
      const ranks=textRanks.filter(isRank).map(t=>Number.parseInt(t.trim(),10));
      assert(ranks.every((v,i)=>i===0||v>=ranks[i-1]),roster+' sorts true finish ranks (not lines) best first');
      assert(textRanks.slice(ranks.length).every(t=>t.trim()==='—'),roster+' missing qualifying finishes are not ranked');
      if(roster!=='av2')assert(ranks.includes(1),roster+' includes an actual first-place finish');
      const harry=page.locator('#rostersContent tbody tr').filter({has:page.locator('[data-player="AV-HarryBallsagna"]')}).first();
      if(await harry.count()){
        const rank=await harry.locator('.roster-piggy-pb-rank').innerText();
        if(roster==='active') originalActiveRank=rank;
        if(roster==='all') allMembersRank=rank;
      }
    }
    assert.equal(originalActiveRank,allMembersRank,'Player best race finish cannot change when roster view changes');
    await page.click('.nav-btn[data-page="eventTotals"]');
    const leagueFooter=page.locator('#page-eventTotals .league-rewards-footnote');
    assert(await leagueFooter.count(),'historical league coverage summary is visible');
    assert((await leagueFooter.innerText()).includes('partial screenshot coverage'),
      'Incomplete historical event source coverage must be visible');
    assert((await leagueFooter.innerText()).includes('unknown event-time clan'),
      'Missing event-time clan attribution must not be hidden');
    await page.click('.nav-btn[data-page="records"]');
    const record=page.locator('#page-records .record-card').filter({hasText:'Space Records'}).locator('.record-row').filter({hasText:'AV-HarryBallsagna'});
    assert((await record.innerText()).includes('8/30/26'),'Space record date comes from PB event');
    const spaceCard=page.locator('#page-records .record-card').filter({hasText:'Space Records'});
    const oct2Standings=await page.evaluate(()=>{
      const D=window.AVENGERS_DATA,metrics=window.AVENGERS_REWARD_METRICS;
      return D.members.flatMap(m=>{
        const hit=metrics.record(D.space.history[m.name]||[],'yearsB');
        if(hit?.date!=='2026-10-02')return [];
        return [{name:m.name,pb:m.spacePB,actual:metrics.spaceRecordDisplay(m.spacePB,hit.date).value}];
      });
    });
    assert(oct2Standings.length>0,'current Oct 2 PBs exist for Records marking');
    for(const {name,pb,actual}of oct2Standings){
      const row=spaceCard.locator('.record-row').filter({has:page.locator('[data-player="'+name+'"]')});
      assert((await row.innerText()).includes(name+'*'),name+' gets Oct 2 asterisk');
      const expected=actual.toLocaleString('en-US',{maximumFractionDigits:1})+'B';
      assert((await row.innerText()).includes(expected),name+' shows actual distance: '+expected);
      assert((await row.innerText()).includes('10/2/26'),name+' retains PB date');
      assert(Math.abs(actual-pb*2/3)<.0001,name+' is displayed at two-thirds');
    }
    assert((await spaceCard.innerText()).includes('Original game distance shown (2/3'), 'Space Records explains Oct 2 adjustment');
    assert(!(await record.innerText()).includes('AV-HarryBallsagna*'),'Aug 30 PB is not marked');
    assert((await record.innerText()).includes('549.9B'),'unaffected PB still shows normalized original');
    await page.click('.nav-btn[data-page="rosters"]');
    await page.click('[data-roster-group="effort"]');
    assert((await page.locator('#rostersContent').innerText()).includes('Sparks/Effort'));
    await page.click('.nav-btn[data-page="space"]');
    await page.click('#spaceTabs [data-view="pot"]');
    assert((await page.locator('#spaceContent').innerText()).includes('Oct 16, 2026'));
    await page.selectOption('#globalStatusFilter','active');
    const currentPot=page.locator('#spaceContent tbody tr').filter({hasText:'Oct 16, 2026'});
    assert((await currentPot.innerText()).includes('≈'),'partial race retains estimated pot values');
    assert((await page.locator('#spaceContent').innerText()).includes('Lobby 6'));
    assert((await page.locator('#spaceContent').innerText()).includes('5,703,046'));
    await page.selectOption('#globalStatusFilter','av2');
    await page.selectOption('#spaceEventSelect','2026-10-16');
    assert((await page.locator('#spaceContent').innerText()).includes('AV-SiFra'));
    await page.selectOption('#globalStatusFilter','active');
    await page.selectOption('#spaceEventSelect','2026-09-18');
    assert((await page.locator('#spaceContent').innerText()).includes('Lobby 6'));
    const missing=page.locator('#spaceContent tr').filter({hasText:'AV-Animosity'});
    assert((await missing.innerText()).includes('—'));
    await page.selectOption('#spaceEventSelect','2026-10-16');
    assert.equal(await page.locator('#spaceContent tbody tr').count(),44,'AV event-time rows include all approved racers');
    await page.selectOption('#globalStatusFilter','av2');
    assert.equal(await page.locator('#spaceContent tbody tr').count(),22,'AV-2 event-time rows remain separate');
    await page.selectOption('#globalStatusFilter','active');
    await page.selectOption('#spaceEventSelect','2026-10-09');
    assert((await page.locator('#spaceContent').innerText()).toLowerCase().includes('sparks/effort (per b)'));
    await page.click('.nav-btn[data-page="piggy"]');
    await page.selectOption('#piggyEventSelect','2026-10-11');
    assert((await page.locator('#piggyContent').innerText()).toLowerCase().includes('sparks/effort (per line)'));
    await page.click('.nav-btn[data-page="piggyFlashes"]');
    assert((await page.locator('#page-piggyFlashes').innerText()).toLowerCase().includes('sparks/effort (per line)'));
    await page.selectOption('#globalStatusFilter','active');
    await page.click('.nav-btn[data-page="players"]');
    await page.fill('#playerSearch','HarryBallsagna');
    const link=page.locator('#page-players [data-player="AV-HarryBallsagna"]').first();
    assert(await link.count(),'profile link exists');await link.click();
    const checks=await page.evaluate(()=>{
      const D=window.AVENGERS_DATA,m=D.members.find(m=>m.name==='AV-HarryBallsagna');return{pb:m.spacePB,achievement:window.AVENGERS_COMMUNITY.achievementProfile(m.name).categories.find(c=>c.id==='space').value,
        expected:Math.max(...D.space.history[m.name].map(r=>r.yearsB)),roster:window.AVENGERS_ROSTER_EVENT_BREAKDOWN.forMember(m.name).eventLoggedSparks};
    });
    assert((await page.locator('#playerModalContent').innerText()).includes('Sparks/Effort'));
    assert.equal(checks.pb,549.9);assert.equal(checks.pb,checks.achievement);assert.equal(checks.pb,checks.expected);
    await page.keyboard.press('Escape');
    await page.click('.nav-btn[data-page="weeklyRecap"]');
    await page.selectOption('#recapWeek','2026-10-05');
    const download=page.waitForEvent('download');await page.click('#downloadWeeklyRecap');const image=await download;
    fs.mkdirSync(path.join(__dirname,'../reports'),{recursive:true});
    const artifact=path.join(__dirname,'../reports/site-browser-recap.png');await image.saveAs(artifact);assert(fs.statSync(artifact).size>1000,'recap PNG generated');
    await page.setViewportSize({width:390,height:844});
    await page.click('#menuBtn');await page.click('.nav-btn[data-page="rosters"]');
    assert(await page.locator('#page-rosters').isVisible());
    assert.deepEqual(errors,[]);
    fs.mkdirSync(path.join(__dirname,'../reports'),{recursive:true});
    await page.screenshot({path:path.join(__dirname,'../reports/site-browser-roster-mobile.png'),fullPage:false,animations:'disabled'});
    let fixtureCases=0;
    if(!process.env.AVENGERS_SMOKE_URL){
      const {UNITS}=require('./event-projection-core.cjs');
      const baseline=built.release,name='AV-HarryBallsagna';
      for(const kind of Object.keys(UNITS))for(const clan of ['AVENGERS','AV-2']){
        const event={id:kind+'|browser-fixture',kind,date:'2026-10-10',status:'final',unit:UNITS[kind],sources:['fixture:browser'],
          metadata:kind==='flash'?{flash:1}:kind==='kraken'?{monthKey:'browser-fixture',monthLabel:'Fixture'}:{},
          rows:[{player:name,clan,score:90000,sparks:50,stars:kind==='kraken'?null:500}]};
        const add={approved:true,expectedRevision:0,event};
        const lower={approved:true,expectedRevision:1,event:{...event,rows:[{...event.rows[0],score:1,sparks:7}]}};
        const revoke={approved:true,expectedRevision:2,event:{...lower.event,status:'revoked'}};
        for(const [updates,extra]of [[[add],50],[[add,lower],7],[[add,lower,revoke],0]]){
          const approved=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/approved-event-updates.json'))).updates;
          const fixture=build({destination:dir,updates:approved.concat(updates)});
          await page.setViewportSize({width:1440,height:1000});await page.goto(origin,{waitUntil:'networkidle'});
          await page.click('.nav-btn[data-page="rosters"]');
          const row=page.locator('#page-rosters tbody tr').filter({has:page.locator('[data-player="'+name+'"]')}).first();
          const got=await page.evaluate(({name,kind})=>({version:window.AVENGERS_EVENT_PROJECTION.version,
            sparks:window.AVENGERS_ROSTER_EVENT_BREAKDOWN.forMember(name)[kind+'Sparks'],
            pb:window.AVENGERS_DATA.members.find(m=>m.name===name)[kind+'PB']}),{name,kind});
          assert.equal(got.version,fixture.manifest.version);
          assert.equal(got.sparks,baseline.breakdowns[name][kind+'Sparks']+extra);
          if(kind!=='flash')assert.equal(got.pb,extra===50?90000:baseline.globals.AVENGERS_DATA.members.find(m=>m.name===name)[kind+'PB']);
          assert(await row.count(),'changed member has a rendered roster row');
          const expectedSparks=Math.round(fixture.release.breakdowns[name].eventLoggedSparks).toLocaleString('en-US');
          assert((await row.innerText()).includes(expectedSparks),'rendered roster includes rebuilt logged total');
          for(const section of ['players','ratings','records','eventTotals','achievements','weeklyRecap','piggyFlashes','trends']){
            await page.click('.nav-btn[data-page="'+section+'"]');assert((await page.locator('#page-'+section).innerText()).trim().length>20);
          }
          assert.deepEqual(errors,[],'fixture has no browser errors');
        }
        fixtureCases++;
      }
      build({destination:dir}); // keep final staged artifact free of synthetic results
    }
    console.log(JSON.stringify({version,pages:26,fixtureCases,profile:checks,recapPNG:true,mobile:true,browserErrors:errors,requestFailures:requests}));
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
