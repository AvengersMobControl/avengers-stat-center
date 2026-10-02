(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  if(!D)return;
  const K=window.AVENGERS_KRAKEN_DATA||{players:[],months:[]};
  const F=window.AVENGERS_PIGGY_FLASH_DATA||{events:[]};
  const resolve=n=>D.resolvePlayerName?D.resolvePlayerName(n):n;
  const members=new Map(D.members.map(m=>[m.name,m]));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=(n,d=0)=>(Number(n)||0).toLocaleString('en-US',{maximumFractionDigits:d});
  const compact=n=>n>=1e6?num(n/1e6,2)+'M':n>=1e3?num(n/1e3,1)+'K':num(n);
  const dateLabel=date=>new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
  const addDays=(date,n)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  const weekStart=date=>{const d=new Date(date+'T12:00:00Z');return addDays(date,-((d.getUTCDay()+6)%7));};
  const rangeLabel=start=>dateLabel(start)+' – '+dateLabel(addDays(start,6));
  const statusNorm=s=>String(s||'').toLowerCase().replace(/[-\s]/g,'');
  const statusBadge=s=>'<span class="status '+(statusNorm(s)==='active'?'active':statusNorm(s)==='av2'?'av2':'inactive')+'">'+esc(s==='AV2'?'AV-2':s||'Inactive')+'</span>';
  const validDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(String(d||''));
  const clanName=s=>{const k=String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');return k==='av2'?'AV-2':k==='avengers'||k==='av'?'AVENGERS':null;};
  const scoreLabel=(kind,value)=>kind==='space'?num(value,1)+'B':kind==='kraken'?num(value,1):num(value);
  const kindLabel=kind=>({piggy:'Piggy Race',space:'Space Race',kraken:'Kraken'}[kind]||kind.replace(/^pf/,'Piggy Flash '));
  const icon=kind=>kind==='piggy'?'🐷':kind==='space'?'🚀':kind==='kraken'?'🐙':kind==='sparks'?'✨':kind==='streak'?'🔥':'⚡';
  const primary=(kind,r)=>kind==='piggy'?Number(r.lines)||0:kind==='space'?Number(r.yearsB)||0:Number(r.lines)||0;
  const pbScore=(kind,r)=>kind==='space'&&r.date==='2026-10-02'?r.value/0.6666:r.value;
  const excluded=new Set(D.excludedPlayers||[]);
  const rowMap=new Map();
  function addRow(row){
    if(!row.name||!validDate(row.date)||row.name==='Total'||row.name==='#N/A'||excluded.has(row.name))return;
    const key=[row.eventId,row.name,row.group??'',row.clan].join('|');
    const previous=rowMap.get(key);
    if(!previous||row.value>previous.value)rowMap.set(key,row);
  }
  ['piggy','space'].forEach(kind=>{
    Object.entries(D[kind]?.events||{}).forEach(([date,rows])=>(rows||[]).forEach(r=>{
      const name=resolve(r.name);
      let clan=clanName(r.eventClan||r.raceClan||r.clan);
      if(!clan){
        if(kind==='piggy')clan=(Number(r.stars)||Number(r.sparks)||Number(r.share))?'AVENGERS':'AV-2';
        else clan=statusNorm(r.status)==='av2'?'AV-2':'AVENGERS';
      }
      if(primary(kind,r)<=0 && !(Number(r.stars)>0||Number(r.sparks)>0))return;
      addRow({name,date,kind,clan,value:primary(kind,r),stars:Number(r.stars)||0,sparks:Number(r.sparks)||0,
        group:r.group,eventId:kind+'|'+date+'|'+clan,partial:false});
    }));
  });
  (F.events||[]).forEach(ev=>(ev.entries||[]).forEach(r=>{
    const clan=clanName(r.clan||ev.clan||ev.rosterScope)||'AVENGERS';
    addRow({name:resolve(r.name),date:ev.date,kind:'pf'+Number(ev.flash),clan,value:Number(r.lines)||0,
      stars:Number(r.stars)||0,sparks:Number(r.sparks)||0,eventId:'flash|'+ev.id,group:ev.setId,partial:ev.complete===false});
  }));
  const records=[...rowMap.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.eventId.localeCompare(b.eventId));
  const streams=new Map();
  function pushStream(name,kind,item){
    const key=name+'|'+kind,rows=streams.get(key)||[];
    // One personal result per dated event; several screenshots/lobbies never inflate a PB streak.
    const id=item.eventId||kind+'|'+item.date;
    const old=rows.find(r=>r.eventId===id);
    if(!old)rows.push({...item,eventId:id});
    else if(item.score>old.score)Object.assign(old,item,{eventId:id});
    streams.set(key,rows);
  }
  records.filter(r=>r.value>0).forEach(r=>pushStream(r.name,r.kind,{...r,score:pbScore(r.kind,r),eventId:r.kind.startsWith('pf')?r.eventId:r.kind+'|'+r.date}));
  // Histories can cover early events whose result tables have not been imported.
  ['piggy','space'].forEach(kind=>Object.entries(D[kind]?.history||{}).forEach(([name,rows])=>(rows||[]).forEach(r=>{
    const value=primary(kind,r);
    if(value>0&&validDate(r.date))pushStream(resolve(name),kind,{name:resolve(name),kind,date:r.date,value,score:pbScore(kind,{date:r.date,value}),clan:clanName(r.clan),eventId:kind+'|'+r.date});
  })));
  const krakenDates={feb02:'2026-02-02',feb23:'2026-02-23',march:'2026-03-01',april:'2026-04-01',may:'2026-05-01',june:'2026-06-01',aug:'2026-08-01',sept:'2026-09-01'};
  (K.players||[]).forEach(p=>(K.months||[]).forEach(month=>{
    const score=Number(p[month.key])||0;
    if(score>0)pushStream(resolve(p.name),'kraken',{name:resolve(p.name),kind:'kraken',score,value:score,date:month.date||krakenDates[month.key]||'',dateLabel:month.label+' 2026',coarse:!month.date,eventId:'kraken|'+month.key});
  }));
  streams.forEach(rows=>{
    rows.sort((a,b)=>a.date.localeCompare(b.date)||a.eventId.localeCompare(b.eventId));
    let previous=0,streak=0;
    rows.forEach((r,i)=>{
      r.previousPB=previous;r.newPB=previous>0&&r.score>previous;r.firstResult=previous===0;
      r.improvement=r.newPB?(r.score/previous-1):null;
      const prior=rows.slice(0,i).map(x=>x.score).filter(x=>x>0).slice(-3);
      r.priorAverage=prior.length===3?prior.reduce((s,v)=>s+v,0)/3:null;
      r.averageIncrease=r.priorAverage>0?(r.score/r.priorAverage-1):null;
      streak=r.newPB?streak+1:0;r.pbStreak=streak;previous=Math.max(previous,r.score);
    });
  });
  const definitions=[
    {id:'piggy',title:'Piggy powerhouse',icon:'🐷',tiers:[10000,25000,50000,75000,100000],unit:'lines',format:v=>num(v)},
    {id:'space',title:'Space explorer',icon:'🚀',tiers:[100,250,350,500,750],unit:'B lightyears',format:v=>num(v,1)+'B'},
    {id:'kraken',title:'Kraken conqueror',icon:'🐙',tiers:[1000,2000,3500,5000,6000],unit:'score',format:v=>num(v,1)},
    {id:'sparks',title:'Spark collector',icon:'✨',tiers:[1000000,5000000,10000000,25000000,50000000],unit:'logged sparks',format:compact},
    {id:'streak',title:'PB streak',icon:'🔥',tiers:[3,5],unit:'consecutive PBs',format:v=>num(v)}
  ];
  const profiles=new Map();
  function achievementProfile(name){
    name=resolve(name);if(profiles.has(name))return profiles.get(name);
    const m=members.get(name);if(!m)return null;
    const categories=definitions.map(def=>{
      const rows=streams.get(name+'|'+def.id)||[];
      const mainStreams=['piggy','space','kraken'].flatMap(kind=>streams.get(name+'|'+kind)||[]);
      let value=def.id==='sparks'?Math.max(0,Number(m.totalSparks)||0):def.id==='streak'?Math.max(0,...mainStreams.map(r=>r.pbStreak)):Math.max(Number(m[def.id+'PB'])||0,...rows.map(r=>r.score),0);
      const badges=def.tiers.map(target=>{
        const crossing=def.id==='streak'?mainStreams.filter(r=>r.pbStreak>=target).sort((a,b)=>a.date.localeCompare(b.date))[0]:rows.find(r=>r.score>=target);
        return {id:def.id+'-'+target,category:def.id,title:def.title,icon:def.icon,target,label:def.format(target)+(def.id==='space'?' lightyears':def.id==='sparks'?' logged sparks':def.id==='streak'?' consecutive PBs':def.id==='piggy'?' lines':' score'),earned:value>=target,date:crossing?.date||null,dateLabel:crossing?.dateLabel||null,coarse:!!crossing?.coarse,sourceKind:crossing?.kind||def.id,clan:crossing?.clan||null};
      });
      const next=badges.find(b=>!b.earned)||null;
      return {...def,value,badges,next,progress:next?Math.min(100,value/next.target*100):100};
    });
    const profile={name,status:m.status,categories,badges:categories.flatMap(c=>c.badges),earned:categories.flatMap(c=>c.badges).filter(b=>b.earned)};
    profiles.set(name,profile);return profile;
  }
  const weeks=[...new Set(records.map(r=>weekStart(r.date)))].sort().reverse();
  const recapState={week:weeks[0]||weekStart(new Date().toISOString().slice(0,10)),clan:'AVENGERS'};
  const achievementState={name:null};
  let openProfile=()=>{};
  function weeklyRecap(start,clan){
    const end=addDays(start,6),rows=records.filter(r=>r.date>=start&&r.date<=end&&r.clan===clan);
    const events=new Map(),contributors=new Map();
    rows.forEach(r=>{
      const ev=events.get(r.eventId)||{id:r.eventId,date:r.date,kind:r.kind,stars:0,sparks:0,players:new Set(),partial:false};
      ev.stars+=r.stars;ev.sparks+=r.sparks;ev.players.add(r.name);ev.partial ||= r.partial;events.set(r.eventId,ev);
      const p=contributors.get(r.name)||{name:r.name,sparks:0,stars:0,events:new Set()};p.sparks+=r.sparks;p.stars+=r.stars;p.events.add(r.eventId);contributors.set(r.name,p);
    });
    const pbs=[],improvements=[];
    const seen=new Set();
    rows.filter(r=>r.value>0).forEach(r=>{
      const personal=(streams.get(r.name+'|'+r.kind)||[]).find(p=>p.eventId===(r.kind.startsWith('pf')?r.eventId:r.kind+'|'+r.date));
      const key=r.name+'|'+r.kind+'|'+r.date;
      if(!personal||seen.has(key)||pbScore(r.kind,r)!==personal.score)return;seen.add(key);
      if(personal.newPB)pbs.push({...personal,clan:r.clan});
      if(personal.averageIncrease>0)improvements.push({...personal,clan:r.clan});
    });
    const milestones=[];
    members.forEach(m=>achievementProfile(m.name).earned.forEach(b=>{
      if(!b.date||b.coarse||b.date<start||b.date>end)return;
      if(rows.some(r=>r.name===m.name&&r.date===b.date&&r.kind===b.sourceKind))milestones.push({...b,name:m.name});
    }));
    // Compare with the same event and clan's earlier dated results, not today's roster.
    const daily=new Map();
    records.filter(r=>r.clan===clan&&r.value>0).forEach(r=>{
      const key=r.date+'|'+r.kind,group=daily.get(key)||[];group.push({...r,score:pbScore(r.kind,r)});daily.set(key,group);
    });
    const clanPB=new Map(),clanRecords=[];
    [...daily.values()].sort((a,b)=>a[0].date.localeCompare(b[0].date)).forEach(group=>{
      const kind=group[0].kind,previous=clanPB.get(kind)||0,best=Math.max(...group.map(r=>r.score));
      if(previous>0&&best>previous&&group[0].date>=start&&group[0].date<=end)group.filter(r=>r.score===best).forEach(r=>clanRecords.push({...r,previousPB:previous}));
      clanPB.set(kind,Math.max(previous,best));
    });
    const totals=rows.reduce((s,r)=>({stars:s.stars+r.stars,sparks:s.sparks+r.sparks}),{stars:0,sparks:0});
    const partial=[...events.values()].filter(e=>e.partial).length;
    return {start,end,clan,rows,events:[...events.values()].sort((a,b)=>b.date.localeCompare(a.date)||a.kind.localeCompare(b.kind)),contributors:[...contributors.values()].sort((a,b)=>b.sparks-a.sparks||a.name.localeCompare(b.name)),totals,partial,pbs:pbs.sort((a,b)=>b.improvement-a.improvement),improvements:improvements.sort((a,b)=>b.averageIncrease-a.averageIncrease),milestones,clanRecords};
  }
  const playerButton=name=>members.has(name)?'<button class="linkish" data-community-profile="'+esc(name)+'">'+esc(name)+'</button>':'<strong>'+esc(name)+'</strong>';
  function categoryHtml(c){
    const earned=c.badges.filter(b=>b.earned);
    return '<article class="ach-card ach-'+c.id+'"><div class="ach-card-head"><span class="ach-icon" aria-hidden="true">'+c.icon+'</span><div><h3>'+c.title+'</h3><div class="community-muted">'+num(earned.length)+' / '+c.tiers.length+' badges</div></div></div><strong class="ach-value">'+c.format(c.value)+'</strong><span class="community-muted">'+(c.id==='sparks'?'Logged Sparks from the roster ledger':c.id==='streak'?'Best streak in one main event type':'Personal best')+'</span><div class="ach-badges">'+(earned.length?earned.map(b=>'<span class="ach-badge" title="'+esc(b.dateLabel|| (b.date?dateLabel(b.date):'Earned from logged totals'))+'">'+c.icon+' '+esc(c.format(b.target))+'</span>').join(''):'<span class="community-muted">First badge still ahead</span>')+'</div><div class="ach-next">'+(c.next?'Next: <strong>'+esc(c.next.label)+'</strong>':'🏅 Every milestone earned')+'</div><progress class="ach-progress" max="100" value="'+c.progress+'" aria-label="'+esc(c.title)+' progress"></progress><div class="community-muted">'+(c.next?c.format(Math.max(0,c.next.target-c.value))+' to go':'Milestone collection complete')+'</div></article>';
  }
  function profileHtml(name){
    const p=achievementProfile(name);if(!p)return '';
    return '<section class="ach-profile" aria-label="Player achievements"><div class="community-heading"><h2>🏅 Achievements</h2><span>'+p.earned.length+' badges earned</span></div><div class="ach-grid">'+p.categories.map(categoryHtml).join('')+'</div><p class="community-footnote">Space milestones use the same adjusted PB as this profile. PB streaks require consecutive improvements in Piggy, Space, or Kraken; a first result establishes the baseline. Sparks badges follow Logged Sparks and exclude unlogged estimates.</p></section>';
  }
  function renderAchievements(status='active'){
    if(typeof document==='undefined')return;
    const root=document.getElementById('achievementsContent');if(!root)return;
    const list=D.members.filter(m=>status==='all'||(status==='current'?['active','av2'].includes(statusNorm(m.status)):statusNorm(m.status)===status)).map(m=>achievementProfile(m.name)).sort((a,b)=>b.earned.length-a.earned.length||a.name.localeCompare(b.name));
    if(!list.some(p=>p.name===achievementState.name))achievementState.name=list[0]?.name||null;
    const selected=achievementProfile(achievementState.name);
    root.innerHTML='<div class="community-toolbar"><label>Member <select id="achievementMember">'+list.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(p=>'<option value="'+esc(p.name)+'" '+(p.name===achievementState.name?'selected':'')+'>'+esc(p.name)+'</option>').join('')+'</select></label><span class="community-muted">Badges are earned from logged results and stay on your profile.</span></div>'+(selected?profileHtml(selected.name):'<div class="empty">No players in this roster filter.</div>')+'<div class="table-card community-table"><div class="table-titlebar"><div><h2>Achievement board</h2><div class="small-muted">'+list.length+' players · select a member to see their next milestones</div></div></div><div class="table-wrap"><table><thead><tr><th>Member</th><th>Status</th><th class="num">Badges</th><th>Latest dated milestone</th><th>Next milestone</th></tr></thead><tbody>'+list.map(p=>{
      const latest=p.earned.filter(b=>b.date).sort((a,b)=>b.date.localeCompare(a.date))[0];
      const next=p.categories.filter(c=>c.next).sort((a,b)=>b.progress-a.progress)[0];
      return '<tr><td><button class="linkish" data-achievement-select="'+esc(p.name)+'">'+esc(p.name)+'</button></td><td>'+statusBadge(p.status)+'</td><td class="num">'+p.earned.length+'</td><td>'+(latest?latest.icon+' '+esc(latest.label)+' <span class="community-muted">'+esc(latest.dateLabel||dateLabel(latest.date))+'</span>':'—')+'</td><td>'+(next?next.icon+' '+esc(next.next.label)+' · '+Math.floor(next.progress)+'%':'All earned')+'</td></tr>';
    }).join('')+'</tbody></table></div></div>';
    root.querySelector('#achievementMember')?.addEventListener('change',e=>{achievementState.name=e.target.value;renderAchievements(status);});
    root.querySelectorAll('[data-achievement-select]').forEach(button=>button.addEventListener('click',()=>{achievementState.name=button.dataset.achievementSelect;renderAchievements(status);root.scrollIntoView({block:'start',behavior:'smooth'});}));
  }
  function table(title,headers,rows,empty){
    return '<div class="table-card community-table"><div class="table-titlebar"><h2>'+title+'</h2></div><div class="table-wrap"><table><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+(rows.join('')||'<tr><td colspan="'+headers.length+'" class="empty">'+empty+'</td></tr>')+'</tbody></table></div></div>';
  }
  const ongoing=start=>{const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/Chicago'});return today>=start&&today<=addDays(start,6);};
  function recapText(recap){
    const lines=['🛡️ '+recap.clan+' WEEKLY RECAP',rangeLabel(recap.start),'',recap.events.length+' logged events • '+recap.contributors.length+' contributors',num(recap.totals.stars)+' logged stars • '+num(recap.totals.sparks)+' logged sparks'];
    if(recap.clanRecords.length)lines.push('','🏆 CLAN RECORDS',...recap.clanRecords.slice(0,5).map(r=>r.name+' · '+kindLabel(r.kind)+' · '+scoreLabel(r.kind,r.score)));
    if(recap.pbs.length)lines.push('','🚀 PERSONAL BESTS',...recap.pbs.slice(0,5).map(r=>r.name+' · '+kindLabel(r.kind)+' · '+scoreLabel(r.kind,r.score)+' (+'+num(r.improvement*100,1)+'%)'));
    if(recap.improvements.length)lines.push('','📈 IMPROVING',...recap.improvements.slice(0,5).map(r=>r.name+' · '+kindLabel(r.kind)+' · +'+num(r.averageIncrease*100,1)+'% vs prior 3 events'));
    if(recap.milestones.length)lines.push('','🏅 MILESTONES',...recap.milestones.slice(0,5).map(b=>b.name+' · '+b.icon+' '+b.label));
    lines.push('',(ongoing(recap.start)?'Week in progress. ':'')+'Based on logged Piggy, Space, and Flash results.'+(recap.partial?' '+recap.partial+' partial leaderboards; totals can grow as results are added.':''));
    return lines.join('\n');
  }
  function downloadRecap(recap){
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
    if(!ctx)throw Error('Image export is unavailable in this browser.');
    const blocks=[{title:'🏆 CLAN RECORDS',items:recap.clanRecords.slice(0,3).map(r=>r.name+'  ·  '+kindLabel(r.kind)+'  ·  '+scoreLabel(r.kind,r.score))},{title:'🚀 PERSONAL BESTS',items:recap.pbs.slice(0,5).map(r=>r.name+'  ·  '+kindLabel(r.kind)+'  ·  '+scoreLabel(r.kind,r.score)+'  (+'+num(r.improvement*100,1)+'%)')},{title:'📈 BIGGEST IMPROVEMENTS',items:recap.improvements.slice(0,3).map(r=>r.name+'  ·  '+kindLabel(r.kind)+'  ·  +'+num(r.averageIncrease*100,1)+'% vs prior 3')},{title:'🏅 MILESTONES EARNED',items:recap.milestones.slice(0,5).map(b=>b.name+'  ·  '+b.label)}].filter(b=>b.items.length);
    const height=440+blocks.reduce((s,b)=>s+90+b.items.length*46,0);
    canvas.width=1200;canvas.height=height;ctx.fillStyle='#081322';ctx.fillRect(0,0,1200,height);ctx.fillStyle='#c92b43';ctx.fillRect(0,0,1200,12);
    ctx.fillStyle='#f4f7ff';ctx.font='bold 44px system-ui, sans-serif';ctx.fillText(recap.clan+' WEEKLY RECAP',60,86);ctx.fillStyle='#9cb2cf';ctx.font='24px system-ui, sans-serif';ctx.fillText(rangeLabel(recap.start)+(ongoing(recap.start)?' · Week in progress':''),60,130);
    const metrics=[[recap.events.length,'LOGGED EVENTS'],[recap.contributors.length,'CONTRIBUTORS'],[compact(recap.totals.stars),'LOGGED STARS'],[compact(recap.totals.sparks),'LOGGED SPARKS']];
    metrics.forEach(([value,label],i)=>{const x=60+i*275;ctx.fillStyle='#13263e';ctx.fillRect(x,166,250,115);ctx.fillStyle='#f4f7ff';ctx.font='bold 38px system-ui, sans-serif';ctx.fillText(String(value),x+18,217);ctx.fillStyle='#9cb2cf';ctx.font='15px system-ui, sans-serif';ctx.fillText(label,x+18,251);});
    let y=330;blocks.forEach(block=>{ctx.fillStyle='#f5c860';ctx.font='bold 26px system-ui, sans-serif';ctx.fillText(block.title,60,y);y+=46;block.items.forEach(line=>{ctx.fillStyle='#e5edf9';ctx.font='23px system-ui, sans-serif';let text=line;while(ctx.measureText(text).width>1080&&text.length)text=text.slice(0,-1);if(text!==line)text=text.slice(0,-1)+'…';ctx.fillText(text,60,y);y+=46;});y+=44;});
    ctx.fillStyle='#9cb2cf';ctx.font='18px system-ui, sans-serif';ctx.fillText('Based on logged Piggy, Space, and Flash results.',60,height-64);ctx.fillText(recap.partial?recap.partial+' partial leaderboards • Results update as more data is logged.':'AVENGERS Stat Center • Personal bests exclude first-time results.',60,height-34);
    canvas.toBlob(blob=>{if(!blob)return;const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=recap.clan.toLowerCase().replace(/[^a-z0-9]/g,'')+'-weekly-recap-'+recap.start+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'image/png');
  }
  function renderWeekly(){
    if(typeof document==='undefined')return;
    const root=document.getElementById('weeklyRecapContent');if(!root)return;
    const recap=weeklyRecap(recapState.week,recapState.clan);
    const metric=(value,label)=>'<div class="community-kpi"><strong>'+esc(value)+'</strong><span>'+label+'</span></div>';
    root.innerHTML='<div class="community-toolbar"><label>Week <select id="recapWeek">'+weeks.map(w=>'<option value="'+w+'" '+(w===recapState.week?'selected':'')+'>'+rangeLabel(w)+'</option>').join('')+'</select></label><label>Clan <select id="recapClan"><option '+(recapState.clan==='AVENGERS'?'selected':'')+'>AVENGERS</option><option '+(recapState.clan==='AV-2'?'selected':'')+'>AV-2</option></select></label><div class="community-actions"><button class="ghost-btn" id="downloadWeeklyRecap" '+(!recap.rows.length?'disabled':'')+'>Download recap image</button><button class="ghost-btn" id="copyWeeklyRecap" '+(!recap.rows.length?'disabled':'')+'>Copy for Discord</button></div></div><div id="recapExportStatus" role="status" class="community-muted"></div><section class="recap-card"><div class="recap-head"><div><span class="community-eyebrow">'+esc(recap.clan)+'</span><h2>Weekly recap</h2><p>'+rangeLabel(recap.start)+'</p></div><span class="recap-period">'+(ongoing(recap.start)?'Week in progress':'Logged results')+'</span></div><div class="community-kpis">'+metric(recap.events.length,'Events logged')+metric(recap.contributors.length,'Contributors')+metric(compact(recap.totals.stars),'Logged stars')+metric(compact(recap.totals.sparks),'Logged sparks')+'</div><div class="recap-spotlights">'+metric(recap.pbs.length,'Personal bests')+metric(recap.milestones.length,'Milestones earned')+metric(recap.clanRecords.length,'Clan record breakers')+'</div><p class="community-footnote">'+(recap.partial?recap.partial+' imported leaderboards are partial. ':'')+'These are logged rewards, not full clan pots. Clan assignments follow the saved event results. Monthly Kraken scores appear in achievements; they are not assigned to a week without dated results.</p></section>';
    if(!recap.rows.length)root.innerHTML+='<div class="empty">No '+esc(recap.clan)+' results logged for this week. Choose another week or clan.</div>';
    if(recap.clanRecords.length)root.innerHTML+='<div class="community-heading"><h2>🏆 Clan records broken</h2></div><div class="recap-records">'+recap.clanRecords.map(r=>'<article class="recap-record"><span>'+icon(r.kind)+' '+kindLabel(r.kind)+'</span><strong>'+scoreLabel(r.kind,r.score)+'</strong>'+playerButton(r.name)+'<small class="community-muted">Previous clan high: '+scoreLabel(r.kind,r.previousPB)+'</small></article>').join('')+'</div>';
    root.innerHTML+=table('🚀 Personal bests',['Member','Event','New PB','Previous PB','Increase','Date'],recap.pbs.map(r=>'<tr><td>'+playerButton(r.name)+'</td><td>'+icon(r.kind)+' '+kindLabel(r.kind)+'</td><td class="num">'+scoreLabel(r.kind,r.score)+'</td><td class="num">'+scoreLabel(r.kind,r.previousPB)+'</td><td class="num community-positive">+'+num(r.improvement*100,1)+'%</td><td>'+dateLabel(r.date)+'</td></tr>'),'No new personal bests in the logged results. First-ever results establish a baseline.');
    root.innerHTML+=table('📈 Beating your recent average',['Member','Event','Result','Prior 3 average','Improvement'],recap.improvements.map(r=>'<tr><td>'+playerButton(r.name)+'</td><td>'+icon(r.kind)+' '+kindLabel(r.kind)+'</td><td class="num">'+scoreLabel(r.kind,r.score)+'</td><td class="num">'+scoreLabel(r.kind,r.priorAverage)+'</td><td class="num community-positive">+'+num(r.averageIncrease*100,1)+'%</td></tr>'),'No improvements with three earlier results to compare.');
    root.innerHTML+=table('🏅 Milestones earned',['Member','Achievement','Milestone','Date'],recap.milestones.map(b=>'<tr><td>'+playerButton(b.name)+'</td><td>'+b.icon+' '+esc(b.title)+'</td><td>'+esc(b.label)+'</td><td>'+dateLabel(b.date)+'</td></tr>'),'No newly crossed milestones with a dated result this week.');
    root.innerHTML+=table('✨ Weekly contributions',['Member','Events','Logged stars','Logged sparks'],recap.contributors.map(p=>'<tr><td>'+playerButton(p.name)+'</td><td class="num">'+p.events.size+'</td><td class="num">'+num(p.stars)+'</td><td class="num">'+num(p.sparks)+'</td></tr>'),'No contributions logged.');
    root.innerHTML+=table('📋 Results included',['Date','Event','Contributors','Logged stars','Logged sparks','Coverage'],recap.events.map(ev=>'<tr><td>'+dateLabel(ev.date)+'</td><td>'+icon(ev.kind)+' '+kindLabel(ev.kind)+'</td><td class="num">'+ev.players.size+'</td><td class="num">'+num(ev.stars)+'</td><td class="num">'+num(ev.sparks)+'</td><td>'+(ev.partial?'Partial leaderboard':'Logged results')+'</td></tr>'),'No dated events logged.');
    root.querySelector('#recapWeek').addEventListener('change',e=>{recapState.week=e.target.value;renderWeekly();});
    root.querySelector('#recapClan').addEventListener('change',e=>{recapState.clan=e.target.value;renderWeekly();});
    root.querySelector('#downloadWeeklyRecap').addEventListener('click',()=>{try{downloadRecap(recap);}catch(e){root.querySelector('#recapExportStatus').textContent=e.message;}});
    root.querySelector('#copyWeeklyRecap').addEventListener('click',async()=>{
      const text=recapText(recap),status=root.querySelector('#recapExportStatus');
      try{await navigator.clipboard.writeText(text);status.textContent='Recap copied. Ready to paste into Discord.';}catch{const area=document.createElement('textarea');area.className='recap-copy-fallback';area.value=text;area.setAttribute('aria-label','Weekly recap text to copy');status.replaceChildren(area);area.select();status.append('Select and copy the recap text above.');}
    });
  }
  if(typeof document!=='undefined')document.addEventListener('click',e=>{const button=e.target.closest('[data-community-profile]');if(button)openProfile(button.dataset.communityProfile);});
  window.AVENGERS_COMMUNITY={records,streams,weeks,definitions,achievementProfile,weeklyRecap,profileHtml,recapText,renderAchievements,renderWeekly,configure(options){if(options.openProfile)openProfile=options.openProfile;}};
})();
