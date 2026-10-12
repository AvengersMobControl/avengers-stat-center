(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  if(!D?.space?.events || !D?.space?.history) return;

  // Five distinct AVENGERS final lobbies and two AV-2 final lobbies from
  // October 9 Discord CLAIM screenshots. Overlapping crops/reposts excluded.
  // Non-clan competitor rows and preliminary screenshots were excluded.
  const date='2026-10-09', code='261009', RATING_START='2026-08-01';
  const raw={
  "AVENGERS|BigPapi": "AV-SB|125.0|141062|1.41M;AV-BigPapi|110.4|112850|1.13M;AV-UANGELES|104.0|101565|1.01M;AV-SMILINGBANDIT|101.4|67710|676,192;AV#Rafa#Tun|89.6|56425|563,493;AV-Adigarian|85.3|45140|450,794;AV-DaG|70.6|22570|225,397;AV<STAR-LORD>|58.3|11285|112,699;AV-Frenchie(-4)|45.1|5642|56,349",
  "AVENGERS|EventHorizon": "AV-neez|204.2|171850|1.72M;AV-MotherboardBeans|156.4|137480|1.37M;AV-HN|143.3|123732|1.24M;AV-Deviantdan|113.5|82488|823,972;AV-EventHorizon|80.3|68740|686,643;AV-Finnie|73.2|54992|549,314;AV-ColdCreeps|71.5|27496|274,657;AV-Mr.Mar.Berry|57.0|13748|137,329;AV-TheOli|54.5|6874|68,664",
  "AVENGERS|Mendoria": "AV-Mendoria|316.6|219362|2.19M;AV-Hoops|176.8|175490|1.75M;AV-Supreeth|175.6|157941|1.58M;AV-I.S.O|168.3|105294|1.05M;AV-Vadik-UA|112.7|87745|876,693;AV-KitKat|78.1|70196|701,354;AV-no|71.7|35098|350,677;AV-J1M|56.2|17549|175,339;AV-J|51.3|8774|87,669",
  "AVENGERS|Abu": "AV-Zolika.x.Kira|501.0|516437|5.16M;AV-7-STAR|459.2|413150|4.13M;AV-JAMO|439.3|371835|3.72M;AV-8!l...Bil|326.0|247890|2.48M;AV-Abu//npjp|300.0|206575|2.06M;AV-Addicted|223.7|165260|1.65M;AV-Megalodon|208.1|82630|825,997;AV-Animosity|180.4|41315|412,999;AV-CHEN1972|154.0|20657|206,499",
  "AVENGERS|INTEN": "AV-INTEN|328.1|225475|2.25M;AV-HarryBallsagna|267.6|180380|1.80M;AV-Obajoba|206.9|162342|1.62M;AV-WolfLegend|128.0|108228|1.08M;AV.Saberkong|126.0|90190|901,143;AV-DrDetroit|62.1|72152|720,974;AV-Nicefellow|58.5|36076|360,457;AV-23|33.3|18038|180,229;AV-Bubba0816|29.4|9019|90,114",
  "AV2|EXCALIBUR": "AV-EXCALIBUR|66.1|14490|144,107;AV-KO|9.2|11592|115,285;AV-braa|8.3|10433|103,757;AV-HECKTO|3.9|6955|69,171;uLTRaSLaN|0.9571|4637|46,114",
  "AV2|SiFra": "AV-Pablin|255.7|166569|1.66M;AV-SiFra|216.2|133255|1.33M;AV-2Lin|180.9|119930|1.2M;AV-JefhKintz05|135.0|79953|798,782;AV-CHUCK|93.3|66628|665,652;AV-Brisket|24.6|53302|532,522;Basecreature|8.1|26651|266,261;AV-Fahad|4.7|13326|133,130;TheHemperor|1.3|6663|66,565"
};
  const msgIds={
    BigPapi:['1558068742703939674'],
    EventHorizon:['1558053967139840051'],
    Mendoria:['1558027855563071500','1558025936467918888','1558012762032971907'],
    Abu:['1558021356094881842'],
    INTEN:['1558012302987632670'],
    EXCALIBUR:['1558086759328387163'],
    SiFra:['1558014658911272990']
  };
  const resolve=(name)=>{
    let n=String(name||'');
    const seen=new Set();
    while(D.aliasMap?.[n]&&!seen.has(n)){
      seen.add(n);n=D.aliasMap[n];
    }
    return n;
  };
  const parseStars=s=>{
    s=String(s).replaceAll(',','').trim();
    return Math.round(Number(s.endsWith('M')?Number(s.slice(0,-1))*1e6:s));
  };
  const shares={1:.25,2:.20,3:.18,4:.12,5:.10,6:.08,7:.04,8:.02,9:.01};
  const rows=[];
  Object.entries(raw).forEach(([key,values],index)=>{
    const [clan,lobby]=key.split('|');
    const group=clan==='AV2'?'AV2-'+lobby:index+1;
    values.split(';').forEach((value,i)=>{
      const [username,b,sp,displayStars]=value.split('|');
      const yearsB=Number(b),stars=parseStars(displayStars),sparks=Number(sp);
      if(!username || !(yearsB>0) || !(sparks>0) || !(stars>0))throw Error('Invalid Oct 9 Space row: '+value);
      rows.push({
        group,rank:i+1,name:resolve(username),username,yearsB,years:Math.round(yearsB*1e9),
        stars,sparks,share:shares[i+1],clan,status:clan==='AV2'?'AV2':'Active',
        lobby,starsAsDisplayed:displayStars,starsApproximate:/M$/i.test(displayStars),
        discordMessageIds:msgIds[lobby]||[]
      });
    });
  });
  const avengers=rows.filter(x=>x.clan==='AVENGERS');
  const av2=rows.filter(x=>x.clan==='AV2');
  const bTotal=rs=>rs.reduce((sum,r)=>sum+r.yearsB,0);
  const spTotal=rs=>rs.reduce((sum,r)=>sum+r.sparks,0);
  if(rows.length!==59||avengers.length!==45||av2.length!==14 ||
     Math.abs(bTotal(avengers)-6982.5)>.00001 || 
     Math.abs(bTotal(av2)-1008.2571)>.00001 ||
     spTotal(avengers)!==5096747 || spTotal(av2)!==714384){
    throw Error('Oct 9 Space source validation failed; refusing to publish incomplete results');
  }

  // Idempotent by date: one history result per named player and clan/date.
  D.space.events[date]=rows;
  const memberBy=new Map((D.members||[]).map(m=>[m.name,m]));
  rows.forEach(r=>{
    const prior=D.space.history[r.name]||[];
    D.space.history[r.name]=prior.filter(h=>String(h.date)!==date).concat({
      date,code,yearsB:r.yearsB,stars:r.stars,sparks:r.sparks,
      clan:r.clan,group:r.group,rank:r.rank
    }).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    let m=memberBy.get(r.name);
    if(!m){
      m={name:r.name,status:r.clan==='AV2'?'AV2':'Inactive',piggyPB:0,spacePB:0,krakenPB:0,
         piggyAvg:0,spaceAvg:0,krakenAvgL3:0,krakenAvg:0,rankingScore:0,
         krakenPBMonth:'',ratingPB:0,ratingAvg:0,ratingTotal:0,eventsPlayed:0,totalSparks:0};
      D.members.push(m);memberBy.set(m.name,m);
    }
    m.totalSparks=(Number(m.totalSparks)||0)+r.sparks;
  });

  // All-time PB comparisons use every player's entire normalized history.
  // The 2026-10-02 event is already stored as actual 150%-adjusted lightyears.
  const overall=[],pbList=[],firstRace=[];
  Object.entries(D.space.history).forEach(([name,events])=>{
    const hist=(events||[]).filter(x=>(Number(x.yearsB)||0)>0)
      .sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
    if(!hist.length)return;
    const prior=hist.filter(x=>String(x.date||'')<date);
    const current=hist.find(x=>String(x.date||'')===date);
    const vals=hist.map(x=>Number(x.yearsB)||0);
    const stars=hist.map(x=>Number(x.stars)||0);
    const sparks=hist.map(x=>Number(x.sparks)||0);
    const previous=prior.length?Math.max(...prior.map(x=>Number(x.yearsB)||0)):0;
    const best=Math.max(...vals);
    const sum=a=>a.reduce((p,c)=>p+c,0);
    const m=memberBy.get(name);
    overall.push({
      name,status:m?.status||'Inactive',pb:best,oldPB:previous,
      improvement:previous>0?(best-previous)/previous:0,
      totalYears:sum(vals),totalStars:sum(stars),totalSparks:sum(sparks),
      eventsPlayed:hist.length,avgYears:sum(vals)/vals.length,
      avgStars:sum(stars)/stars.length,avgSparks:sum(sparks)/sparks.length,
      pbYears:best,avgLast3:sum(vals.slice(-3))/Math.min(vals.length,3),avgRank:0
    });
    if(current){
      if(!prior.length)firstRace.push({name,score:Number(current.yearsB),clan:current.clan,status:m?.status||''});
      else if((Number(current.yearsB)||0)>previous){
        pbList.push({
          name,score:Number(current.yearsB),previous,
          improvement:(Number(current.yearsB)-previous)/previous,
          clan:current.clan,status:m?.status||''
        });
      }
    }
    if(m){
      m.spacePB=Math.max(Number(m.spacePB)||0,best);
      const ratingHist=hist.filter(x=>String(x.date||'')>=RATING_START);
      m.spaceAvg=ratingHist.length?ratingHist.reduce((sum,x)=>sum+(Number(x.yearsB)||0),0)/ratingHist.length:0;
    }
  });
  overall.sort((a,b)=>b.avgYears-a.avgYears).forEach((r,i)=>{r.avgRank=i+1;});
  D.space.overall=overall;
  D.space.latestPBs=pbList.sort((a,b)=>b.improvement-a.improvement);
  D.space.latestNewMembers=firstRace.sort((a,b)=>b.score-a.score);

  const capped=(v,b)=>Math.min(1,Math.max(0,(Number(v)||0)/b));
  (D.members||[]).forEach(m=>{
    m.ratingPB=capped(m.piggyPB,35000)+capped(m.spacePB,350)+capped(m.krakenPB,3500);
    m.ratingAvg=capped(m.piggyAvg,25000)+capped(m.spaceAvg,200)+capped(m.krakenAvgL3,2800);
    m.ratingTotal=m.ratingPB+m.ratingAvg;
  });
  D.space.clanTrend=Object.keys(D.space.events).sort()
    .filter(d=>d>=(D.meta.arenaStart||'2026-08-01'))
    .map(d=>{
      const items=(D.space.events[d]||[]).filter(r=>r && r.name!=='Total'&&r.name!=='#N/A'
        &&(r.clan==='AVENGERS'||(!r.clan&&r.status==='Active'))&&(Number(r.yearsB)||0)>0);
      const vs=items.map(r=>Number(r.yearsB)||0);
      return{date:d,avg:vs.length?vs.reduce((s,n)=>s+n,0)/vs.length:0,
        total:vs.reduce((s,n)=>s+n,0),
        stars:items.reduce((s,r)=>s+(Number(r.stars)||0),0),
        sparks:items.reduce((s,r)=>s+(Number(r.sparks)||0),0),players:vs.length};
    }).filter(x=>x.players>0);
  D.space.av2PotTotals=Object.assign({},D.space.av2PotTotals||{},{[date]:7196670});
  D.space.av2Sources=Object.assign({},D.space.av2Sources||{},{[date]:{
    messageId:msgIds.SiFra[0],messageIds:msgIds.SiFra.concat(msgIds.EXCALIBUR),
    source:'AV-2 Discord final claim screenshots',lobbies:2
  }});
  D.space.historicalSourceNotes=Object.assign({},D.space.historicalSourceNotes||{},{
    [date]:'Five distinct AVENGERS final-result lobbies (45 results) and two AV-2 lobbies (14 results). Prize stars reported with M suffix remain screenshot-rounded estimates, exact spark amounts preserved.'
  });
  D.meta.latestSpace=date;
  D.meta.generated='2026-10-11T23:17:00-05:00';
})();