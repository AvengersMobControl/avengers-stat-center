(function(){
  'use strict';

  const DATA=window.AVENGERS_PIGGY_FLASH_DATA=window.AVENGERS_PIGGY_FLASH_DATA||{events:[]};
  const D=window.AVENGERS_DATA||{};
  const channelLabels={
    '1425021492629995560':'PF1',
    '1425021633009291396':'PF2',
    '1425021793835552868':'PF3',
    '1425021900463013919':'PF4'
  };
  const state={tab:'all'};
  const fmt=v=>(Number(v)||0).toLocaleString();
  const fmtCompact=v=>{
    const n=Number(v)||0;
    if(Math.abs(n)>=1000000)return (n/1000000).toFixed(n>=10000000?1:2).replace(/\.0+$/,'').replace(/(\.\d*[1-9])0+$/,'$1')+'M';
    if(Math.abs(n)>=1000)return (n/1000).toFixed(n>=100000?0:1).replace(/\.0$/,'')+'K';
    return fmt(n);
  };
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const pct=(a,b)=>b?Math.round(a/b*100):0;

  const resolveName=name=>{
    let x=String(name||'');
    const seen=new Set();
    while(D.aliasMap?.[x] && !seen.has(x)){seen.add(x);x=D.aliasMap[x];}
    return x;
  };

  function ensureStyles(){
    if(document.getElementById('flash-dashboard-styles'))return;
    const style=document.createElement('style');
    style.id='flash-dashboard-styles';
    style.textContent=`
      .flash-tabs{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:0 0 16px}
      .flash-tab{border:1px solid var(--border,#2a3345);background:var(--panel,#151b27);color:inherit;border-radius:10px;padding:11px 8px;font-weight:800;cursor:pointer;transition:.15s ease}
      .flash-tab:hover{transform:translateY(-1px);border-color:#69758a}
      .flash-tab.active{background:linear-gradient(135deg,rgba(201,32,48,.32),rgba(74,90,140,.25));border-color:#c94857;box-shadow:inset 0 0 0 1px rgba(255,255,255,.03)}
      .flash-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr);gap:16px;margin:16px 0}
      .flash-chart-card{background:var(--panel,#151b27);border:1px solid var(--border,#2a3345);border-radius:14px;overflow:hidden}
      .flash-chart-head{padding:15px 17px;border-bottom:1px solid var(--border,#2a3345)}
      .flash-chart-head h2{font-size:16px;margin:0 0 3px}
      .flash-chart-body{padding:14px 16px}
      .flash-pb-scroll{max-height:620px;overflow:auto;padding-right:5px}
      .flash-pb-row{display:grid;grid-template-columns:minmax(150px,1fr) minmax(160px,3fr) 72px 44px;gap:8px;align-items:center;min-height:28px;margin:3px 0}
      .flash-pb-name{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .flash-pb-track{height:18px;background:rgba(125,135,155,.14);border-radius:5px;overflow:hidden;position:relative}
      .flash-pb-bar{height:100%;border-radius:5px;background:linear-gradient(90deg,#8b1e2d,#d84957);min-width:2px}
      .flash-pb-value{text-align:right;font-weight:800;font-variant-numeric:tabular-nums;font-size:12px;white-space:nowrap}
      .flash-pb-flash{display:flex;justify-content:center;align-items:center;min-width:44px}
      .flash-chip{display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:2px 6px;font-size:10px;opacity:.8;min-width:34px;line-height:1.2}
      .flash-svg{width:100%;height:240px;display:block}
      .flash-svg text{fill:currentColor;font-size:10px;opacity:.72}
      .flash-svg .grid{stroke:currentColor;opacity:.10}
      .flash-svg .line{fill:none;stroke:#d84957;stroke-width:3}
      .flash-svg .dot{fill:#d84957}
      .flash-mini-bars{display:grid;gap:9px}
      .flash-mini-row{display:grid;grid-template-columns:68px 1fr 70px;gap:8px;align-items:center;font-size:12px}
      .flash-mini-track{height:12px;border-radius:99px;background:rgba(125,135,155,.14);overflow:hidden}
      .flash-mini-fill{height:100%;background:linear-gradient(90deg,#516a9d,#9fb0d3);border-radius:99px}
      .flash-metric-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:14px 0 16px}
      .flash-metric{background:var(--panel,#151b27);border:1px solid var(--border,#2a3345);border-radius:12px;padding:13px}
      .flash-metric span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.08em;opacity:.62;margin-bottom:6px}
      .flash-metric strong{font-size:22px;line-height:1}
      .flash-metric em{display:block;font-style:normal;font-size:10px;opacity:.55;margin-top:5px}
      .flash-note{font-size:11px;opacity:.68;margin-top:8px}
      @media(max-width:1000px){.flash-grid{grid-template-columns:1fr}.flash-metric-strip{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:720px){.flash-tabs{grid-template-columns:repeat(3,1fr)}.flash-pb-row{grid-template-columns:100px 1fr 58px 38px;gap:6px}.flash-pb-flash{min-width:38px}.flash-chip{min-width:30px;padding:2px 4px}.flash-metric-strip{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);
  }

  function ensureUI(){
    ensureStyles();
    const nav=document.querySelector('.nav');
    if(nav && !nav.querySelector('[data-page="piggyFlashes"]')){
      const piggy=nav.querySelector('[data-page="piggy"]');
      const btn=document.createElement('button');
      btn.className='nav-btn';
      btn.dataset.page='piggyFlashes';
      btn.innerHTML='<span>⚡</span> Piggy Flashes';
      if(piggy?.nextSibling) nav.insertBefore(btn,piggy.nextSibling); else nav.appendChild(btn);
      btn.addEventListener('click',()=>showPage(btn));
    }
    const main=document.querySelector('main.main');
    if(main && !document.getElementById('page-piggyFlashes')){
      const section=document.createElement('section');
      section.className='page';
      section.id='page-piggyFlashes';
      section.innerHTML='<div id="piggyFlashesContent"></div>';
      const space=document.getElementById('page-space');
      if(space) main.insertBefore(section,space); else main.appendChild(section);
    }
  }

  function clanMode(){
    const v=document.getElementById('globalStatusFilter')?.value||'active';
    return v==='active'?'AVENGERS':v==='av2'?'AV-2':'all';
  }

  function allEvents(){
    return (DATA.events||[]).map(ev=>({...ev,flash:Number(ev.flash)||Number(String(channelLabels[ev.channelId]||'').replace(/\D/g,''))||0}));
  }

  function rowsForEvents(events){
    const mode=clanMode();
    const out=[];
    events.forEach(ev=>{
      (ev.entries||[]).forEach(r=>{
        const clan=r.clan||ev.clan||ev.rosterScope||'AVENGERS';
        if(mode!=='all' && clan!==mode)return;
        out.push({
          ...r,
          name:resolveName(r.name),
          clan,
          eventDate:ev.date||'',
          setId:ev.setId||((ev.date||'')+'-A'),
          flash:Number(ev.flash)||0,
          complete:!!ev.complete,
          coverage:ev.coverage||'',
          channelId:ev.channelId||'',
          messageId:ev.messageId||'',
          potStars:ev.potStars
        });
      });
    });
    return out;
  }

  function selectedEvents(){
    const evs=allEvents();
    if(/^pf[1-4]$/.test(state.tab))return evs.filter(e=>e.flash===Number(state.tab.slice(2)));
    return evs;
  }

  function aggregateByPlayer(rows){
    const map=new Map();
    rows.forEach(r=>{
      if(!r.name)return;
      const x=map.get(r.name)||{name:r.name,flashes:0,lineResults:0,lines:0,stars:0,sparks:0,best:0,pbFlash:0,pbDate:'',wins:0};
      x.flashes++;
      const lineKnown=r.lines!==null && r.lines!==undefined && Number.isFinite(Number(r.lines));
      if(lineKnown){
        const lv=Number(r.lines);
        x.lineResults++;
        x.lines+=lv;
        if(lv>x.best){
          x.best=lv;
          x.pbFlash=Number(r.flash)||0;
          x.pbDate=r.eventDate||'';
        }
      }
      x.stars+=Number(r.stars)||0;
      x.sparks+=Number(r.sparks)||0;
      if(Number(r.rank)===1)x.wins++;
      map.set(r.name,x);
    });
    return [...map.values()].map(x=>({...x,avg:x.lineResults?x.lines/x.lineResults:0}));
  }

  function buildSetMap(rows){
    const map=new Map();
    rows.forEach(r=>{
      const key=r.setId||r.eventDate+'-A';
      const s=map.get(key)||{id:key,date:r.eventDate,flashes:new Set(),rows:[],players:new Map()};
      s.flashes.add(r.flash);
      s.rows.push(r);
      if(String(r.eventDate)<String(s.date))s.date=r.eventDate;
      const p=s.players.get(r.name)||{name:r.name,lines:0,stars:0,sparks:0,flashes:0,lineFlashes:0};
      const lineKnown=r.lines!==null && r.lines!==undefined && Number.isFinite(Number(r.lines));
      if(lineKnown){p.lines+=Number(r.lines);p.lineFlashes++;}
      p.stars+=Number(r.stars)||0;p.sparks+=Number(r.sparks)||0;p.flashes++;
      s.players.set(r.name,p);
      map.set(key,s);
    });
    return map;
  }

  function dailyPlayerPBs(setMap){
    const map=new Map();
    [...setMap.values()].forEach(s=>{
      s.players.forEach(p=>{
        const x=map.get(p.name)||{name:p.name,best:0,pbDate:'',pbFlashes:0,total:0,sets:0};
        if(p.lineFlashes>0){
          x.total+=p.lines;x.sets++;
          if(p.lines>x.best){x.best=p.lines;x.pbDate=s.id;x.pbFlashes=p.lineFlashes;}
        }
        map.set(p.name,x);
      });
    });
    return [...map.values()].map(x=>({...x,avg:x.sets?x.total/x.sets:0}));
  }

  function median(values){
    const a=values.filter(Number.isFinite).slice().sort((a,b)=>a-b);
    if(!a.length)return 0;
    const i=Math.floor(a.length/2);
    return a.length%2?a[i]:(a[i-1]+a[i])/2;
  }

  function pbChart(items,daily=false){
    const sorted=items.slice().filter(x=>x.best>0).sort((a,b)=>b.best-a.best||a.name.localeCompare(b.name));
    const max=Math.max(1,...sorted.map(x=>x.best));
    return `<div class="flash-pb-scroll">${sorted.map((r,i)=>`
      <div class="flash-pb-row">
        <div class="flash-pb-name" title="${esc(r.name)}">${i+1}. <strong>${esc(r.name)}</strong></div>
        <div class="flash-pb-track" title="${esc(r.name)} — ${fmt(r.best)} lines">
          <div class="flash-pb-bar" style="width:${Math.max(1.5,r.best/max*100)}%"></div>
        </div>
        <div class="flash-pb-value">${fmt(r.best)}</div>
        <div class="flash-pb-flash">${daily?'':'<span class="flash-chip">PF'+r.pbFlash+'</span>'}</div>
      </div>`).join('')}</div>`;
  }

  function trendSvg(points,titleValue='Pot stars'){
    if(!points.length)return '<div class="empty">No trend data yet.</div>';
    const W=720,H=240,padL=48,padR=15,padT=18,padB=34;
    const vals=points.map(x=>Number(x.value)||0);
    const max=Math.max(1,...vals);
    const min=0;
    const x=i=>points.length===1?(W/2):padL+i*(W-padL-padR)/(points.length-1);
    const y=v=>padT+(max-v)/(max-min||1)*(H-padT-padB);
    const path=points.map((p,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(p.value).toFixed(1)).join(' ');
    const grid=[0,.25,.5,.75,1].map(fr=>{
      const yy=padT+fr*(H-padT-padB), val=max*(1-fr);
      return '<line class="grid" x1="'+padL+'" x2="'+(W-padR)+'" y1="'+yy+'" y2="'+yy+'"></line><text x="2" y="'+(yy+3)+'">'+fmtCompact(val)+'</text>';
    }).join('');
    const labels=points.map((p,i)=>{
      if(points.length>10 && i%Math.ceil(points.length/7)!==0 && i!==points.length-1)return '';
      return '<text text-anchor="middle" x="'+x(i)+'" y="'+(H-9)+'">'+esc(String(p.label).replace(/^2026-/,'').replace('-','/'))+'</text>';
    }).join('');
    const dots=points.map((p,i)=>'<circle class="dot" cx="'+x(i)+'" cy="'+y(p.value)+'" r="4"><title>'+esc(p.label)+' — '+fmt(p.value)+' '+esc(titleValue)+'</title></circle>').join('');
    return '<svg class="flash-svg" viewBox="0 0 '+W+' '+H+'" role="img">'+grid+'<path class="line" d="'+path+'"></path>'+dots+labels+'</svg>';
  }

  function flashComparison(events){
    const groups=[1,2,3,4].map(f=>{
      const evs=events.filter(e=>e.flash===f);
      const rows=rowsForEvents(evs);
      const pots=evs.filter(e=>e.potStars!=null).map(e=>Number(e.potStars)||0);
      return {flash:f,events:evs.length,avgLines:rows.length?rows.reduce((s,r)=>s+(Number(r.lines)||0),0)/rows.length:0,avgPot:pots.length?pots.reduce((a,b)=>a+b,0)/pots.length:0};
    });
    const max=Math.max(1,...groups.map(x=>x.avgLines));
    return '<div class="flash-mini-bars">'+groups.map(x=>'<div class="flash-mini-row"><strong>PF'+x.flash+'</strong><div class="flash-mini-track"><div class="flash-mini-fill" style="width:'+Math.max(1,x.avgLines/max*100)+'%"></div></div><div style="text-align:right">'+fmt(Math.round(x.avgLines))+'</div></div>').join('')+'</div><div class="flash-note">Average player lines per recorded result.</div>';
  }

  function tabsHtml(){
    const tabs=[['all','All'],['pf1','PF1'],['pf2','PF2'],['pf3','PF3'],['pf4','PF4'],['daily','Daily Total']];
    return '<div class="flash-tabs">'+tabs.map(([id,label])=>'<button class="flash-tab '+(state.tab===id?'active':'')+'" data-flash-tab="'+id+'">'+label+'</button>').join('')+'</div>';
  }

  function render(){
    const root=document.getElementById('piggyFlashesContent');
    if(!root)return;

    const evs=selectedEvents();
    const rows=rowsForEvents(evs);
    const allEvs=allEvents();
    const allRows=rowsForEvents(allEvs);
    const setMap=buildSetMap(allRows);
    const isDaily=state.tab==='daily';
    const agg=isDaily?dailyPlayerPBs(setMap):aggregateByPlayer(rows);
    const sortedOverall=agg.slice().sort((a,b)=>(b.lines??b.total)-(a.lines??a.total)||(b.avg-a.avg));

    const uniqueEvents=new Set(evs.map(e=>e.id||e.date+'|'+e.flash)).size;
    const players=new Set((isDaily?allRows:rows).map(r=>r.name).filter(Boolean)).size;
    const totalLines=(isDaily?allRows:rows).reduce((s,r)=>s+(Number(r.lines)||0),0);
    const knownLineRows=rows.filter(r=>r.lines!==null && r.lines!==undefined && Number.isFinite(Number(r.lines)));
    const avgResult=knownLineRows.length?knownLineRows.reduce((s,r)=>s+Number(r.lines),0)/knownLineRows.length:0;
    const medResult=median(knownLineRows.map(r=>Number(r.lines)));
    const wins=rows.filter(r=>Number(r.rank)===1).length;
    const potEvents=evs.filter(e=>e.potStars!=null);
    const avgPot=potEvents.length?potEvents.reduce((s,e)=>s+(Number(e.potStars)||0),0)/potEvents.length:0;
    const completeSets=[...setMap.values()].filter(s=>s.flashes.size===4).length;

    const pbItems=isDaily?dailyPlayerPBs(setMap):aggregateByPlayer(rows);
    const chartTitle=isDaily?'Daily Total PB by Player':state.tab==='all'?'Single-Flash PB by Player':' '+state.tab.toUpperCase()+' PB by Player';
    const chartSub=isDaily?'Best combined PF1 + PF2 + PF3 + PF4 lines within one 24-hour Flash Set.':state.tab==='all'?'Each player’s best single Flash result, regardless of PF1/PF2/PF3/PF4.':'Personal best lines within this Flash channel.';

    const potTrend=allEvs.filter(e=>e.potStars!=null)
      .sort((a,b)=>String(a.date).localeCompare(String(b.date))||a.flash-b.flash)
      .map(e=>({label:e.date+' PF'+e.flash,value:Number(e.potStars)||0}));

    const dailyTrend=[...setMap.values()].sort((a,b)=>String(a.date).localeCompare(String(b.date))).map(s=>({
      label:s.id,
      value:[...s.players.values()].reduce((sum,p)=>sum+p.lines,0),
      flashes:s.flashes.size
    }));

    const trendPoints=isDaily?dailyTrend:(state.tab==='all'?potTrend:evs.filter(e=>e.potStars!=null).sort((a,b)=>String(a.date).localeCompare(String(b.date))).map(e=>({label:e.date,value:Number(e.potStars)||0})));

    const performanceBody=sortedOverall.map((r,i)=>{
      const total=isDaily?r.total:r.lines;
      const events=isDaily?r.sets:r.flashes;
      const best=r.best;
      return '<tr><td class="num">'+(i+1)+'</td><td><strong>'+esc(r.name)+'</strong></td><td class="num">'+fmt(events)+'</td><td class="num">'+fmt(total)+'</td><td class="num">'+fmt(Math.round(r.avg))+'</td><td class="num">'+fmt(best)+'</td>'+(isDaily?'':'<td class="num">'+fmt(r.stars)+'</td><td class="num">'+fmt(r.sparks)+'</td>')+'</tr>';
    }).join('');

    const resultBody=isDaily?'':rows.slice().sort((a,b)=>String(b.eventDate).localeCompare(String(a.eventDate))||(Number(a.rank)||999)-(Number(b.rank)||999)).map(r=>'<tr><td>'+esc(r.eventDate||'—')+'</td><td>PF'+r.flash+'</td><td class="num">'+(r.rank??'—')+'</td><td><strong>'+esc(r.name||'—')+'</strong></td><td class="num">'+fmt(r.lines)+'</td><td class="num">'+fmt(r.stars)+'</td><td class="num">'+fmt(r.sparks)+'</td></tr>').join('');

    const dailyRows=[];
    [...setMap.values()].sort((a,b)=>String(b.date).localeCompare(String(a.date))).forEach(s=>{
      [...s.players.values()].sort((a,b)=>b.lines-a.lines).forEach((p,i)=>{
        dailyRows.push('<tr><td>'+esc(s.id)+'</td><td class="num">'+s.flashes.size+'/4</td><td class="num">'+(i+1)+'</td><td><strong>'+esc(p.name)+'</strong></td><td class="num">'+fmt(p.lines)+'</td><td class="num">'+fmt(p.stars)+'</td><td class="num">'+fmt(p.sparks)+'</td></tr>');
      });
    });

    const potRows=potEvents.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))||a.flash-b.flash).map(e=>'<tr><td>'+esc(e.date)+'</td><td>PF'+e.flash+'</td><td>'+esc(e.setId||'—')+'</td><td class="num">'+esc(e.potStarsDisplay||fmt(e.potStars))+'</td></tr>').join('');

    root.innerHTML=`
      ${tabsHtml()}
      <div class="records-note"><strong>Flash Set:</strong> one PF1→PF4 cycle in roughly 24 hours. Eight-flash calendar weeks are split into two independent Flash Sets.</div>
      <div class="flash-metric-strip">
        <div class="flash-metric"><span>${isDaily?'Flash Sets':'Events'}</span><strong>${fmt(isDaily?setMap.size:uniqueEvents)}</strong><em>${isDaily?completeSets+' complete 4/4 sets':'recorded in this view'}</em></div>
        <div class="flash-metric"><span>Players</span><strong>${fmt(players)}</strong><em>unique players</em></div>
        <div class="flash-metric"><span>${isDaily?'Total lines':'Avg result'}</span><strong>${isDaily?fmtCompact(totalLines):fmt(Math.round(avgResult))}</strong><em>${isDaily?'all imported flashes':fmt(Math.round(medResult))+' median'}</em></div>
        ${isDaily?'<div class="flash-metric"><span>Best daily PB</span><strong>'+fmt(Math.max(0,...pbItems.map(x=>x.best)))+'</strong><em>combined flash lines</em></div>':''}
        <div class="flash-metric"><span>Avg pot</span><strong>${avgPot?fmtCompact(avgPot):'—'}</strong><em>AVENGERS-dominant lobbies</em></div>
      </div>

      <div class="flash-grid">
        <div class="flash-chart-card">
          <div class="flash-chart-head"><h2>${esc(chartTitle)}</h2><div class="small-muted">${esc(chartSub)}</div></div>
          <div class="flash-chart-body">${pbChart(pbItems,isDaily)}</div>
        </div>
        <div class="flash-chart-card">
          <div class="flash-chart-head"><h2>${isDaily?'Flash Set Line Trend':'Pot Stars Trend'}</h2><div class="small-muted">${isDaily?'Combined recorded player lines per Flash Set.':'AVENGERS-dominant lobby pot totals over time.'}</div></div>
          <div class="flash-chart-body">${trendSvg(trendPoints,isDaily?'lines':'pot stars')}${state.tab==='all'?'<hr style="border:0;border-top:1px solid rgba(255,255,255,.08);margin:12px 0 14px"><strong style="font-size:12px">PF comparison</strong><div style="margin-top:10px">'+flashComparison(allEvs)+'</div>':''}</div>
        </div>
      </div>

      <div class="table-card">
        <div class="table-titlebar"><div><h2>${isDaily?'Daily Total Leaderboard':'Performance Leaderboard'}</h2><div class="small-muted">${isDaily?'Combined result across each player’s recorded PF1-PF4 scores in a Flash Set.':'Totals, averages and PBs for the selected Flash view.'}</div></div></div>
        <div class="table-wrap"><table><thead><tr><th class="num">#</th><th>Member</th><th class="num">${isDaily?'Sets':'Flashes'}</th><th class="num">Total Lines</th><th class="num">Average</th><th class="num">PB</th>${isDaily?'':'<th class="num">Stars</th><th class="num">Sparks</th>'}</tr></thead><tbody>${performanceBody||'<tr><td colspan="9" class="empty">No flash data yet.</td></tr>'}</tbody></table></div>
      </div>

      ${isDaily?`
      <div class="table-card" style="margin-top:16px">
        <div class="table-titlebar"><div><h2>Flash Set Results</h2><div class="small-muted">Each player's combined PF1–PF4 result for every 24-hour set.</div></div></div>
        <div class="table-wrap"><table><thead><tr><th>Flash Set</th><th class="num">Flashes</th><th class="num">Rank</th><th>Member</th><th class="num">Total Lines</th><th class="num">Stars</th><th class="num">Sparks</th></tr></thead><tbody>${dailyRows.join('')||'<tr><td colspan="7" class="empty">No set totals yet.</td></tr>'}</tbody></table></div>
      </div>`:`
      <div class="table-card" style="margin-top:16px">
        <div class="table-titlebar"><div><h2>Pot Stars Log</h2><div class="small-muted">Only AVENGERS-dominant lobbies. Outside-lobby player scores are retained without using that lobby's pot.</div></div></div>
        <div class="table-wrap"><table><thead><tr><th>Event</th><th>Flash</th><th>Flash Set</th><th class="num">Pot Stars</th></tr></thead><tbody>${potRows||'<tr><td colspan="4" class="empty">No pot totals in this view.</td></tr>'}</tbody></table></div>
      </div>
      <div class="table-card" style="margin-top:16px">
        <div class="table-titlebar"><div><h2>Individual Results</h2><div class="small-muted">Recorded player-level Flash results.</div></div></div>
        <div class="table-wrap"><table><thead><tr><th>Event</th><th>Flash</th><th class="num">Rank</th><th>Member</th><th class="num">Lines</th><th class="num">Stars</th><th class="num">Sparks</th></tr></thead><tbody>${resultBody||'<tr><td colspan="7" class="empty">No results in this view.</td></tr>'}</tbody></table></div>
      </div>`}
    `;

    root.querySelectorAll('[data-flash-tab]').forEach(btn=>btn.addEventListener('click',()=>{
      state.tab=btn.dataset.flashTab;
      render();
    }));
  }

  function showPage(btn){
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    document.getElementById('page-piggyFlashes')?.classList.add('active');
    btn?.classList.add('active');
    const title=document.getElementById('pageTitle');
    const sub=document.getElementById('pageSubtitle');
    if(title)title.textContent='Piggy Flashes';
    if(sub)sub.textContent='PF1–PF4 performance, PBs, trends, and daily Flash Set totals';
    render();
    document.querySelector('.sidebar')?.classList.remove('open');
  }

  ensureUI();
  render();
  document.getElementById('globalStatusFilter')?.addEventListener('change',()=>{
    if(document.getElementById('page-piggyFlashes')?.classList.contains('active'))render();
  });
})();