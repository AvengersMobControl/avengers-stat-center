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
    const achievements=page.locator('#rostersContent button[data-roster-group="piggyAchievements"]');
    assert.equal(await achievements.count(),1,'Piggy Achievements group available');
    assert.equal(await achievements.getAttribute('aria-expanded'),'false','Piggy Achievements defaults collapsed');
    assert.equal(await page.locator('#rostersContent button[data-roster-sort="piggyPBRank"]').count(),1,'PB Rank is collapsed summary');
    assert.equal(await page.locator('#rostersContent button[data-roster-sort="piggyWins"]').count(),0,'Wins hidden by default');
    assert.equal(await page.locator('#rostersContent [data-roster-group="effort"]').count(),0,'no roster efficiency group');
    await achievements.click();
    assert.equal(await page.locator('#rostersContent button[data-roster-group="piggyAchievements"]').getAttribute('aria-expanded'),'true');
    assert.equal(await page.locator('#rostersContent button[data-roster-sort="piggyWins"]').count(),1,'Wins shown on expand');
    assert.equal(await page.locator('#rostersContent button[data-roster-sort="piggyPodiums"]').count(),1,'Podiums shown on expand');
    assert.equal(await page.locator('#rostersContent button[data-roster-sort="piggyPBRank"]').count(),1,'PB Rank shown on expand');
    const topHeaders=await page.locator('#rostersContent .roster-group-head th').allTextContents();
    const achievementsColumn=topHeaders.findIndex(t=>t.includes('Piggy Achievements'));
    const eventsColumn=topHeaders.findIndex(t=>t.includes('Events'));
    assert(achievementsColumn>0&&eventsColumn>achievementsColumn,'grouped Piggy Achievements immediately precede Events');
    // Resizable roster columns keep their sizes when grouped headings re-render.
    const memberGrip=page.locator('#rostersContent button[data-roster-resize="name"]');
    assert.equal(await memberGrip.count(),1,'Member column offers an accessible resize handle');
    const memberWidth=await page.locator('#rostersContent col[data-roster-column="name"]').evaluate(el=>Number.parseFloat(el.style.width));
    await memberGrip.focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#rostersContent col[data-roster-column="name"]').evaluate(el=>Number.parseFloat(el.style.width)),memberWidth+16,'keyboard resize increases Member width');
    assert.equal(await page.locator('#rostersContent .roster-grouped-table').evaluate(el=>getComputedStyle(el).tableLayout),'fixed','roster columns follow explicit widths');
    await page.click('#rostersContent button[data-roster-group="piggyAchievements"]');
    assert.equal(await page.locator('#rostersContent col[data-roster-column="name"]').evaluate(el=>Number.parseFloat(el.style.width)),memberWidth+16,'roster layout persists across a group collapse');
    await page.click('#rostersContent button[data-roster-group="piggyAchievements"]');
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
    // A placement-only Piggy PB is visible in the historical PBs & New tab,
    // even when it is NOT a new high number of lines.
    await page.selectOption('#globalStatusFilter','active');
    await page.click('.nav-btn[data-page="piggy"]');
    await page.click('#piggyTabs [data-view="pbs"]');
    await page.selectOption('#piggyPBEventSelect','2026-10-11');
    assert((await page.locator('#piggyContent').innerText()).includes('Piggy Finishing-Place Personal Bests'));
    assert((await page.locator('#piggyContent').innerText()).toLowerCase().includes('previous best finish'));
    // Table headers are uppercase by CSS; browser innerText reflects that styling.
    assert((await page.locator('#piggyContent').innerText()).includes('30+ AVENGERS'));
    const placementExpected=await page.evaluate(()=>{
      const events=window.AVENGERS_EVENT_PROJECTION.events;
      return window.AVENGERS_ROSTER_PIGGY_PB_RANK.placementHistory(events).byEvent.get('piggy|2026-10-11')||[];
    });
    const placeCard=page.locator('#piggyContent .table-card').filter({hasText:'Piggy Finishing-Place Personal Bests'});
    const placeText=await placeCard.innerText();
    if(placementExpected.length){
      for(const pb of placementExpected)assert(placeText.includes(pb.player),pb.player+' has website placement PB');
    }else assert(placeText.includes('No new qualifying finish PBs'));
    // A transferred player's first AVENGERS Piggy is a new-member appearance,
    // even when their combined history already contains AV-2 races.
    await page.selectOption('#piggyPBEventSelect','2026-10-18');
    const firstClanCard=page.locator('#piggyContent .table-card').filter({hasText:'First Tracked Event'});
    assert((await firstClanCard.innerText()).includes('AV-Lin'),
      'Lin remains first AVENGERS Piggy participant after merging AV-2Lin history');
    assert((await page.locator('#piggyContent').innerText()).includes('event-time clan'),
      'PB tab explains new-member classification is per event-time clan');
    const benchmark=page.locator('#piggyContent .piggy-benchmark-card');
    assert.equal(await benchmark.count(),1,'one weekly benchmark panel in Piggy PB view');
    assert((await benchmark.innerText()).includes('Weekly Line Benchmark Achievements'));
    const headers=await benchmark.locator('thead th').allTextContents();
    for(const threshold of ['5K+','10K+','20K+','30K+','40K+','50K+','60K+','70K+'])
      assert(headers.some(h=>h.includes(threshold)),'benchmark header '+threshold);
    const oct18=benchmark.locator('tbody tr').filter({hasText:'Oct 18, 2026'});
    const oct18Values=(await oct18.locator('td').allTextContents()).map(t=>t.trim());
    assert.deepEqual(oct18Values,['Oct 18, 2026','50','48','38','23','11','3','—','—','—']);
    const octGold=await oct18.locator('td.piggy-record-tied').allTextContents();
    assert.deepEqual(octGold.map(t=>t.trim()),['48','23','11'],'only 5K tie and 20K/30K records are gold on Oct 18');
    const sept13=benchmark.locator('tbody tr').filter({hasText:'Sep 13, 2026'});
    const sept13Values=(await sept13.locator('td').allTextContents()).map(t=>t.trim());
    assert.deepEqual(sept13Values.slice(-4),['6','2','1','1'],'Sept 13 includes a 70K+ and a 60K+ racer');
    const currentRoster=await page.evaluate(()=>{
      const D=window.AVENGERS_DATA;
      return {names:D.members.map(m=>m.name),jeff:D.resolvePlayerName('AV-JeffKintz05'),
        lin:D.resolvePlayerName('AV-2Lin')};
    });
    assert.equal(currentRoster.jeff,'AV-JefhKintz05');
    assert.equal(currentRoster.lin,'AV-Lin');
    for(const old of ['LT','AV-2Lin','AV-JeffKintz05'])
      assert(!currentRoster.names.includes(old),'obsolete canonical roster shell: '+old);
    await page.click('.nav-btn[data-page="eventTotals"]');
    const leagueFooter=page.locator('#page-eventTotals .league-rewards-footnote');
    assert(await leagueFooter.count(),'historical league coverage summary is visible');
    assert((await leagueFooter.innerText()).includes('partial screenshot coverage'),
      'Incomplete historical event source coverage must be visible');
    assert((await leagueFooter.innerText()).includes('unknown event-time clan'),
      'Missing event-time clan attribution must not be hidden');
    assert.equal(await page.locator('#page-eventTotals .league-source-status').count(),1,
      'league known vs partial/estimated source scope must be prominent');
    const leagueText=await page.locator('#page-eventTotals').innerText();
    assert(leagueText.includes('Tracked results, not a certified complete pot.'),
      'league never claims missing source rows or unverified race pots');
    assert(leagueText.includes('Tracked Sparks*')&&leagueText.includes('Tracked Stars*'),
      'recorded sums are explicitly scoped');
    assert(!leagueText.toLowerCase().includes('sparks/effort'),
      'Sparks/Effort is allowed ONLY in individual Space Event, not Clan League pages');
    const leagueHeaders=await page.locator('#page-eventTotals .league-rewards-table thead th').allTextContents();
    assert.equal(leagueHeaders.length,9,'remove redundant efficiency columns from league leaderboard');
    assert.equal(await page.locator('#page-eventTotals .league-rewards-table tbody tr:first-child td').count(),9,
      'league data rows match header count');
    await page.locator('#page-eventTotals button.league-period').nth(1).click();
    assert((await page.locator('#page-eventTotals .league-source-status').innerText()).includes('estimated Kraken Sparks included'),
      'older clan league numbers must be transparently marked as estimates');
    assert.equal(await page.locator('#page-eventTotals .league-rewards-table thead th').count(),9,
      'all six historical league tables use the same concise layout');
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
    assert(!(await page.locator('#rostersContent').innerText()).includes('Sparks/Effort'),'roster entirely free of efficiency metric');
    await page.click('.nav-btn[data-page="space"]');
    await page.click('#spaceTabs [data-view="overall"]');
    assert(!(await page.locator('#spaceContent').innerText()).includes('Sparks/Effort'),'no efficiency in Space Overall');
    await page.click('#spaceTabs [data-view="last3"]');
    assert(!(await page.locator('#spaceContent').innerText()).includes('Sparks/Effort'),'no efficiency in Space Last 3');
    await page.click('#spaceTabs [data-view="pot"]');
    assert(!(await page.locator('#spaceContent').innerText()).includes('Sparks/Effort'),'no efficiency in Space Pot Totals');
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
    assert((await page.locator('#spaceContent').innerText()).toLowerCase().includes('sparks/effort (per b)'),'efficiency ONLY in Space Event');
    assert.equal(await page.locator('#spaceContent tbody tr').count(),44,'AV event-time rows include all approved racers');
    const rankHeaders=await page.locator('#spaceContent thead th').allTextContents();
    for(const title of ['List #','Lobby Finish','Recorded Clan #','Verified Clan #'])
      assert(rankHeaders.includes(title),'Space rank scope labeled: '+title);
    const zolikaSpace=page.locator('#spaceContent tbody tr').filter({has:page.locator('[data-player="AV-Zolika.x.TheBoss"]')});
    assert.equal(await zolikaSpace.count(),1,'Zolika canonical name is the source-ranked Oct 16 row');
    assert((await zolikaSpace.innerText()).includes('1st'),'original source lobby finish shown');
    assert((await zolikaSpace.innerText()).includes('—'),'Oct 16 has no verified full-clan placement');
    assert((await page.locator('#spaceContent .space-rank-provenance').innerText()).includes('not every contestant'),'partial rank key is explicit');
    await page.selectOption('#globalStatusFilter','av2');
    assert.equal(await page.locator('#spaceContent tbody tr').count(),22,'AV-2 event-time rows remain separate');
    await page.selectOption('#globalStatusFilter','active');
    await page.selectOption('#spaceEventSelect','2026-10-09');
    assert((await page.locator('#spaceContent').innerText()).toLowerCase().includes('sparks/effort (per b)'));
    await page.click('#spaceTabs [data-view="pbs"]');
    assert((await page.locator('#spaceContent').innerText()).includes('Space Lobby Finish PBs'),'historical rank PBs independently shown');
    const pbRankIntegrity=await page.evaluate(()=>{
      const source=window.AVENGERS_EVENT_PROJECTION.events;
      const all=window.AVENGERS_SPACE_RANKS.analyze(source,window.AVENGERS_DATA.aliasMap);
      const partial=all.byEvent.get('space|2026-10-16');
      return {partialAllUnverified:[...partial.values()].every(v=>v.verifiedClanFinish===null),
        firstLobby:partial.get('AVENGERS|AV-Zolika.x.TheBoss')?.lobbyFinish,
        profilePB:all.lobbyBestByPlayer.get('AV-Zolika.x.TheBoss')?.rank};
    });
    assert.equal(pbRankIntegrity.firstLobby,1);
    assert.equal(pbRankIntegrity.partialAllUnverified,true);
    assert(pbRankIntegrity.profilePB>=1,'rank PB sourced from real original lobby finish');
    await page.click('#spaceTabs [data-view="overall"]');
    assert((await page.locator('#spaceContent thead th').allTextContents()).some(t=>t.replace(/\s+/g,' ').includes('Best Lobby Finish')),'overall Space lobby PB integrated');
    await page.click('.nav-btn[data-page="piggy"]');
    await page.selectOption('#piggyEventSelect','2026-10-11');
    assert(!(await page.locator('#piggyContent').innerText()).toLowerCase().includes('sparks/effort (per line)'),'Piggy has no per-line rewards ratio');
    await page.click('.nav-btn[data-page="piggyFlashes"]');
    assert(!(await page.locator('#page-piggyFlashes').innerText()).toLowerCase().includes('sparks/effort (per line)'),'Flash has no per-line rewards ratio');
    // September 22 screenshot-backed Flash honors: PF4 belongs to the Sep22 set
    // despite its result being dated Sep23. Do not fabricate unranked podiums.
    await page.selectOption('#globalStatusFilter','active');
    await page.click('.nav-btn[data-page="piggyFlashes"]');
    await page.selectOption('#flashDaySelect','2026-09-22');
    assert.equal(await page.locator('#page-piggyFlashes .flash-podium-kpi').count(),5);
    let podiumCards=await page.locator('#page-piggyFlashes .flash-podium-kpi').allTextContents();
    assert(podiumCards[0].includes('1 wins')&&podiumCards[0].includes('3 podiums'),'AVENGERS PF1 source places');
    assert(podiumCards[3].includes('1 wins')&&podiumCards[3].includes('2 podiums'),'Sep23 PF4 ranks');
    assert(podiumCards[4].includes('4 wins')&&podiumCards[4].includes('11 podiums'),'AVENGERS PF1–PF4 rollup');

    // New AVENGERS-only historical Flash report, computed from the same live page source.
    const hist=page.locator('#flashHistoricalReporting');
    assert(await hist.isVisible(),'AVENGERS Flash historical report displayed');
    assert.equal(await hist.locator('.flash-history-card').count(),10,'4 header pot cards + 6 comparison metrics');
    const pctLabels=await hist.locator('.flash-history-grid .flash-history-card').allTextContents();
    assert(pctLabels[0].includes('77.4%')&&pctLabels[0].includes('1/38'),'Sep22 PF1 header estimated rake: '+JSON.stringify(pctLabels));
    assert(pctLabels[1].includes('93.5%')&&pctLabels[1].includes('3/50'),'Sep22 PF2 pot rank and rake');
    assert(pctLabels[3].includes('2.76M')&&pctLabels[3].includes('1/37'),'PF4 next-day header retained');
    assert((await hist.innerText()).includes('AV-ZolikaLoveKira'),'combined-day leader shown');
    assert((await hist.innerText()).includes('9,880'),'top recorded combined-day score');
    assert((await hist.innerText()).includes('4,936'),'top single-race score');
    assert((await hist.innerText()).includes('6/2,761'),'top single-race historical rank');
    const potDetail=hist.locator('details[data-hist-open="pots"]');
    await potDetail.locator('summary').click();
    assert.equal(await potDetail.locator('tbody tr[data-hist-row]').count(),165,'165 recorded main lobby header pots retained');
    await potDetail.locator('input[data-hist-search]').fill('2026-09-22');
    assert.equal(await potDetail.locator('tbody tr[data-hist-row]:visible').count(),3,
      'Sep22 has three flash pot headers; PF4 is on Sep23');
    await potDetail.locator('button[data-hist-sort][data-hist-key="potStars"]').click();
    assert((await hist.locator('details[data-hist-open="pots"] summary').innerText()).includes('165 tracked'),
      'sortable original archive persists');

    await page.selectOption('#globalStatusFilter','av2');
    await page.click('.nav-btn[data-page="piggyFlashes"]');
    podiumCards=await page.locator('#page-piggyFlashes .flash-podium-kpi').allTextContents();
    assert(podiumCards[0].includes('1 wins')&&podiumCards[0].includes('2 podiums'),'AV-2 PF1 distinct lobby');
    assert(podiumCards[4].includes('2 wins')&&podiumCards[4].includes('4 podiums'),'AV-2 separate PF1–PF4 totals');
    assert.equal(await page.locator('#flashHistoricalReporting').count(),0,'AV-2 view remains unchanged; AVENGERS-only report not mixed');
    assert(podiumCards[2].includes('No source rows')&&podiumCards[3].includes('No source rows'),
      'AV-2 unrecorded PF3/PF4 display missing coverage, not zero finishes');
    await page.selectOption('#globalStatusFilter','active');

    await page.selectOption('#globalStatusFilter','active');
    await page.click('.nav-btn[data-page="players"]');
    await page.fill('#playerSearch','HarryBallsagna');
    const link=page.locator('#page-players [data-player="AV-HarryBallsagna"]').first();
    assert(await link.count(),'profile link exists');await link.click();
    const checks=await page.evaluate(()=>{
      const D=window.AVENGERS_DATA,m=D.members.find(m=>m.name==='AV-HarryBallsagna');return{pb:m.spacePB,achievement:window.AVENGERS_COMMUNITY.achievementProfile(m.name).categories.find(c=>c.id==='space').value,
        expected:Math.max(...D.space.history[m.name].map(r=>r.yearsB)),roster:window.AVENGERS_ROSTER_EVENT_BREAKDOWN.forMember(m.name).eventLoggedSparks};
    });
    const profileText=await page.locator('#playerModalContent').textContent(); // wrapped UI labels can insert visual line breaks in innerText
    assert(profileText.includes('Space Event Results'),'Space event history is retained');
    const shareButton=page.locator('#playerModalContent [data-copy-profile-link]');
    assert.equal(await shareButton.count(),1,'canonical player share action is visible');
    const canonicalShare=await shareButton.getAttribute('data-profile-url');
    assert.equal(new URL(canonicalShare).searchParams.get('player'),'AV-HarryBallsagna');
    assert.equal(new URL(canonicalShare).searchParams.size,1,'copied link excludes unrelated auth/query data');
    assert.equal(new URL(page.url()).searchParams.get('player'),'AV-HarryBallsagna');

    assert(profileText.includes('This Clan League vs Career'),'current league comparison is prominent above event details');
    assert.equal(await page.locator('#playerModalContent .profile-league-kpi').count(),3,'event / earned Spark / earned Star comparison');
    assert.equal(await page.locator('#playerModalContent .profile-league-kind').count(),4,'all four categories have career comparisons');
    const harryLeague=await page.evaluate(()=>{
      const name='AV-HarryBallsagna',person=window.AVENGERS_EVENT_PROJECTION.people.find(p=>p.name===name);
      const el=document.querySelector('#playerModalContent .profile-league-overview');
      const model=window.AVENGERS_MEMBER_PROFILE_INSIGHTS.summarize(person.history,
        new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0')+'-'+String(new Date().getDate()).padStart(2,'0'));
      const actual=Number(el.querySelector('[data-league-stat="events"] strong').textContent.replaceAll(',',''));
      return {expected:model.league.events,actual,dated:el.dataset.leagueStart===model.period.start&&el.dataset.leagueEnd===model.period.end};
    });
    assert.equal(harryLeague.actual,harryLeague.expected,'rendered current league count from event-time source');
    assert(harryLeague.dated,'browser labels the correct 35-day Kraken cycle');
    assert(profileText.includes('not official counted-on-time clan Sparks'),'no implied certified clan score');
    assert(profileText.includes('Best Space Lobby Finish'),'player modal shows real Space lobby PB');
    assert(profileText.includes('Verified Space Clan PB Rank'),'player modal separates unverified full-clan finishes');
    assert((await page.locator('#playerModalContent table thead').allTextContents()).some(t=>t.includes('Recorded Clan #')),
      'Space profile history exposes captured rank scope');
    assert(!profileText.includes('Sparks/Effort'),'no efficiency in any player-profile event history');
    assert(profileText.includes('Piggy Event Results'),'Piggy event history');
    assert(profileText.includes('Piggy Flash Event Results'),'Flash event history');
    const profileColumnHeaders=await page.locator('#playerModalContent table thead th').allTextContents();
    assert(profileColumnHeaders.filter(t=>t.trim()==='Finish').length>=2,'Piggy and Flash event tables each have original finish column');
    const eventRankVerification=await page.evaluate(()=>{
      const name='AV-HarryBallsagna';
      const events=window.AVENGERS_EVENT_PROJECTION.events.filter(e=>e.kind==='piggy'||e.kind==='flash');
      const known=events.flatMap(e=>(e.rows||[]).filter(r=>r.player===name&&r.clan==='AVENGERS'&&r.metadata?.rank>0).map(r=>({date:e.date,rank:r.metadata.rank,kind:e.kind})));
      const ordinal=n=>window.AVENGERS_ROSTER_PIGGY_PB_RANK.formatFinish(n);
      const text=document.querySelector('#playerModalContent')?.textContent||'';
      return {known:known.length,matched:known.some(r=>text.includes(ordinal(r.rank)))};
    });
    assert(eventRankVerification.known>0&&eventRankVerification.matched,'recorded event placement is shown in profile');
    assert(!profileText.includes('Piggy Reward / Effort')&&!profileText.includes('Flash Reward / Effort'),'no Piggy/Flash ratios');
    assert.equal(checks.pb,549.9);assert.equal(checks.pb,checks.achievement);assert.equal(checks.pb,checks.expected);
    await page.keyboard.press('Escape');
    // Verified cross-clan account: source event dates are NOT fabricated roster transfer dates.
    await page.fill('#playerSearch','AV-Lin');
    const linProfile=page.locator('#page-players [data-player="AV-Lin"]').first();
    assert(await linProfile.count(),'Lin canonical profile is available after consolidation');
    await linProfile.click();
    const linCards=page.locator('#playerModalContent .profile-clan-entry');
    assert.equal(await linCards.count(),2,'Lin has distinct source-attributed AVENGERS and AV-2 histories');
    assert.equal(await page.locator('#playerModalContent [data-tracked-clan="AVENGERS"]').count(),1);
    assert.equal(await page.locator('#playerModalContent [data-tracked-clan="AV-2"]').count(),1);
    const linInfo=await page.locator('#playerModalContent .profile-clan-history').textContent();
    assert(linInfo.includes('NOT join, departure or transfer dates'), 'historical event dates must not imply official transfer dates');
    const sourceClans=await page.evaluate(()=>[...new Set((window.AVENGERS_EVENT_PROJECTION.people.find(p=>p.name==='AV-Lin')?.history||[]).map(r=>r.clan).filter(Boolean))]);
    assert(sourceClans.includes('AV-2')&&sourceClans.includes('AVENGERS'),'cross-clan timeline matches canonical source');
    assert.equal(await page.locator('#playerModalContent .profile-league-overview').count(),1,'cross-clan player receives one consolidated career view');
    const linScopes=await page.evaluate(()=>{
      const el=document.querySelector('#playerModalContent'),val=key=>el.querySelector('[data-league-stat="'+key+'"] strong').textContent;
      const person=window.AVENGERS_EVENT_PROJECTION.people.find(p=>p.name==='AV-Lin');
      const now=new Date(),iso=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
      const p=window.AVENGERS_MEMBER_PROFILE_INSIGHTS.summarize(person.history,iso);
      return {leagueEvents:p.league.events,careerEvents:p.career.events,rendered:val('events'),includesAv2:p.career.events>p.league.events};
    });
    assert(linScopes.includesAv2,'prior AV-2 history is counted in career, not miscredited to current league');
    assert.equal(Number(linScopes.rendered.replaceAll(',','')),linScopes.leagueEvents);

    assert(!linInfo.includes('Sparks/Effort'),'the scope-restricted ratio must never enter profiles');
    await page.keyboard.press('Escape');
    assert.equal(new URL(page.url()).searchParams.has('player'),false,'closing profile cleans share query');
    // #12: names and search controls across site sections resolve to the
    // same canonical modal, without inventing duplicate Explorer identities.
    await page.selectOption('#globalStatusFilter','all');
    await page.click('.nav-btn[data-page="achievements"]');
    await page.selectOption('#achievementMember','AV-Lin');
    assert.equal(await page.locator('#achievementsContent [data-community-profile="AV-Lin"]').count(),2,
      'selected badges and achievement-board name both link to canonical profile');
    await page.locator('#achievementsContent .community-toolbar [data-community-profile="AV-Lin"]').click();
    assert.equal(await page.locator('#playerModalContent .profile-name').innerText(),'AV-Lin');
    assert(await page.locator('#playerModalContent .ach-profile').count(),'badges live on unified canonical profile');
    await page.keyboard.press('Escape');
    await page.locator('#achievementsContent .community-table [data-achievement-select="AV-Lin"]').click();
    assert.equal(await page.locator('#achievementMember').inputValue(),'AV-Lin','badge preview stays independent');
    await page.locator('#achievementsContent .community-table [data-community-profile="AV-Lin"]').click();
    assert.equal(await page.locator('#playerModalContent .profile-name').innerText(),'AV-Lin');
    await page.keyboard.press('Escape');

    await page.click('.nav-btn[data-page="kraken"]');
    await page.locator('#krakenTabs [data-kview="event"]').click();
    const krakenLinked=await page.locator('#krakenContent [data-kr-player]').evaluateAll(btns=>{
      const D=window.AVENGERS_DATA;
      const known=new Set(D.members.map(m=>m.name));
      const hit=btns.find(b=>known.has(D.resolvePlayerName(b.dataset.krPlayer)));
      return hit?.dataset.krPlayer||null;
    });
    assert(krakenLinked,'Kraken result includes a mapped player with unified profile');
    await page.locator('#krakenContent [data-kr-player]').filter({hasText:krakenLinked}).first().click();
    const krakenCanonical=await page.evaluate(name=>window.AVENGERS_DATA.resolvePlayerName(name),krakenLinked);
    assert.equal(await page.locator('#playerModalContent .profile-name').innerText(),krakenCanonical,
      'Kraken result links open canonical player modal');
    assert.equal(new URL(page.url()).searchParams.get('player'),krakenCanonical);
    await page.keyboard.press('Escape');
    assert(await page.locator('#page-kraken').isVisible(),'Kraken click does not redirect to duplicate explorer');

    await page.click('.nav-btn[data-page="trends"]');
    const trendLinked=await page.locator('#trendsContent [data-p2-player]').first().getAttribute('data-p2-player');
    assert(trendLinked,'Trends comparison contains a member profile link');
    await page.locator('#trendsContent [data-p2-player]').first().click();
    assert.equal(await page.locator('#playerModalContent .profile-name').innerText(),trendLinked,
      'Trends row opens same player modal as roster and records');
    await page.keyboard.press('Escape');
    assert(await page.locator('#page-trends').isVisible(),'Trend click retains comparison context');

    await page.click('.nav-btn[data-page="overview"]');
    await page.fill('#p2QuickPlayer','AV-2Lin');
    await page.click('#p2QuickGo');
    assert.equal(await page.locator('#playerModalContent .profile-name').innerText(),'AV-Lin',
      'quick finder resolves historic alias and opens canonical profile');
    await page.keyboard.press('Escape');
    assert(await page.locator('#page-overview').isVisible(),'overview finder does not redirect');

    await page.click('.nav-btn[data-page="players"]');
    await page.fill('#p2ExplorerInput','AV-2Lin');
    await page.click('#p2ExplorerGo');
    assert((await page.locator('#p2ExplorerProfile').innerText()).includes('AV-Lin'),
      'legacy explorer previews canonical alias statistics');
    await page.click('#p2ExplorerOpenProfile');
    assert.equal(await page.locator('#playerModalContent .profile-name').innerText(),'AV-Lin',
      'explorer has explicit link to unified profile');
    await page.keyboard.press('Escape');
    // Deep-link / alias restore across clans never creates a phantom player.
    await page.goto(origin+'?player='+encodeURIComponent('AV-2Lin'),{waitUntil:'networkidle'});
    assert(await page.locator('#playerModal').isVisible(),'player deep link opens profile after page load');
    assert((await page.locator('#playerModalContent .profile-name').innerText()).includes('AV-Lin'),
      'historic AV-2Lin alias resolves to one canonical AV-Lin profile');
    assert.equal(new URL(await page.locator('[data-copy-profile-link]').getAttribute('data-profile-url')).searchParams.get('player'),'AV-Lin');
    await page.keyboard.press('Escape');
    assert(!new URL(page.url()).searchParams.has('player'),'closing deep-linked profile restores the clean URL');
    await page.goto(origin+'?player='+encodeURIComponent('not-a-real-member'),{waitUntil:'networkidle'});
    assert.equal(await page.locator('#playerModal').getAttribute('aria-hidden'),'true',
      'unrecognized deep link is rejected without injecting a profile');
    await page.goto(origin,{waitUntil:'networkidle'});
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
    await page.click('#menuBtn');await page.click('.nav-btn[data-page="players"]');
    await page.fill('#playerSearch','AV-Lin');
    await page.locator('#page-players [data-player="AV-Lin"]').first().click();
    const mobileLeague=page.locator('#playerModalContent .profile-league-overview');
    assert(await mobileLeague.isVisible(),'league profile is visible at 390px viewport');
    const mobileSize=await mobileLeague.evaluate(el=>({
      overflow:el.scrollWidth-el.clientWidth,
      columns:getComputedStyle(el.querySelector('.profile-league-kinds')).gridTemplateColumns.split(' ').length
    }));
    assert(mobileSize.overflow<=2,'no profile-league horizontal overflow on narrow mobile');
    assert.equal(mobileSize.columns,1,'category metrics stack for phone width');
    await page.keyboard.press('Escape');
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
