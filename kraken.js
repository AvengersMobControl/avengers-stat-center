(function(){
  'use strict';
  const K=window.AVENGERS_KRAKEN_DATA;
  const D=window.AVENGERS_DATA||{members:[]};
  const S=window.AVENGERS_SPARKS_SNAPSHOT||{currentAvengers:[]};
  if(!K) return;

  let view='overview';
  let eventKey=(K.months||[]).at(-1)?.key||'sept';
  let pbEventKey=eventKey;
  let pbSort='newpb';

  const fmt=(v,d=0)=>(Number(v)||0).toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d});
  const pct=v=>((Number(v)||0)*100).toFixed(1)+'%';
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const rosterMode=()=>document.getElementById('globalStatusFilter')?.value||'active';
  const memberMap=new Map((D.members||[]).map(m=>[m.name,m]));
  const currentAvengers=new Set((S.currentAvengers||[]).map(x=>x.name));

  const norm=s=>{
    const x=String(s||'').toLowerCase().replace(/[-\s]/g,'');
    if(x==='active') return 'active';
    if(x==='av2') return 'av2';
    return 'inactive';
  };
  const currentStatus=(name,fallback='')=>{
    if(currentAvengers.size && currentAvengers.has(name)) return 'Active';
    const stored=memberMap.get(name)?.status||fallback;
    if(currentAvengers.size && norm(stored)==='active') return 'Inactive';
    if(norm(stored)==='av2') return 'AV2';
    return stored||'Inactive';
  };
  const allowed=p=>{
    const m=rosterMode();
    const st=norm(currentStatus(p.name,p.status));
    if(m==='active') return st==='active';
    if(m==='av2') return st==='av2';
    return true;
  };
  const players=()=>K.players.filter(allowed);
  const avg=a=>a.length?a.reduce((s,x)=>s+(Number(x)||0),0)/a.length:0;
  const monthIndex=key=>(K.months||[]).findIndex(m=>m.key===key);
  const monthMeta=key=>(K.months||[]).find(m=>m.key===key)||{key,label:key};
  const monthLabel=key=>monthMeta(key).label+' 2026';
  const monthKeys=()=>(K.months||[]).map(m=>m.key);

  function statusBadge(s){
    const n=norm(s);
    const label=n==='active'?'Active':n==='av2'?'AV-2':'Inactive';
    return '<span class="status '+n+'">'+label+'</span>';
  }
  function playerButton(name){
    return '<button class="kr-player-link" data-kr-player="'+esc(name)+'">'+esc(name)+'</button>';
  }

  function scoreThrough(p,key){
    const idx=monthIndex(key);
    const keys=monthKeys().slice(0,idx+1);
    const vals=keys.map(k=>Number(p[k])||0).filter(v=>v>0);
    return {
      pb:vals.length?Math.max(...vals):0,
      avg:avg(vals),
      events:vals.length
    };
  }

  function eventPlayers(key, filtered=true){
    const src=filtered?players():K.players;
    return src.filter(p=>(Number(p[key])||0)>0)
      .slice()
      .sort((a,b)=>(Number(b[key])||0)-(Number(a[key])||0));
  }

  function eventSummary(key){
    const list=eventPlayers(key,true);
    const vals=list.map(p=>Number(p[key])||0);
    const idx=monthIndex(key);
    const prior=monthKeys().slice(0,Math.max(0,idx));
    const pbCount=list.filter(p=>{
      const old=prior.map(k=>Number(p[k])||0).filter(v=>v>0);
      return old.length && (Number(p[key])||0)>Math.max(...old);
    }).length;
    return {
      list,
      players:list.length,
      total:vals.reduce((s,v)=>s+v,0),
      avg:avg(vals),
      leader:list[0]||null,
      pbCount
    };
  }

  function monthlyTrend(){
    return (K.months||[]).map(m=>{
      const list=eventPlayers(m.key,true);
      const vals=list.map(p=>Number(p[m.key])||0);
      return {label:m.label,key:m.key,avg:avg(vals),players:vals.length,total:vals.reduce((s,v)=>s+v,0)};
    }).filter(x=>x.players>0);
  }

  function chart(data){
    if(!data.length)return '<div class="empty">No Kraken history for this roster filter.</div>';
    const w=700,h=230,padL=58,padR=18,padT=28,padB=32;
    const vals=data.map(x=>x.avg);
    const max=Math.max(...vals,1), min=0;
    const pw=w-padL-padR, ph=h-padT-padB;
    const pts=data.map((d,i)=>({
      x:padL+(i/(Math.max(data.length-1,1)))*pw,
      y:padT+(1-(d.avg-min)/(max-min||1))*ph,
      d
    }));
    const path=pts.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');
    const area=path+` L ${pts.at(-1).x},${h-padB} L ${pts[0].x},${h-padB} Z`;
    const grid=[1,.5,0].map(frac=>({y:padT+(1-frac)*ph,value:max*frac}));
    return `<div class="kr-chart"><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <defs><linearGradient id="krArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffb454" stop-opacity=".28"/><stop offset="100%" stop-color="#ff7a59" stop-opacity="0"/></linearGradient></defs>
      ${grid.map(g=>`<line x1="${padL}" y1="${g.y}" x2="${w-padR}" y2="${g.y}" class="kr-grid"/><text x="${padL-7}" y="${g.y+4}" text-anchor="end" class="kr-axis-value">${fmt(g.value,0)}</text>`).join('')}
      <path d="${area}" class="kr-area"/>
      <path d="${path}" class="kr-line"/>
      ${pts.map((p,i)=>`<circle cx="${p.x}" cy="${p.y}" r="4" class="kr-dot"><title>${esc(p.d.label)}: ${fmt(p.d.avg,1)} avg • ${p.d.players} players</title></circle><text x="${p.x}" y="${Math.max(12,p.y-(i%2?10:7))}" class="kr-value-label" text-anchor="middle">${fmt(p.d.avg,1)}</text>`).join('')}
      ${pts.map(p=>`<text x="${p.x}" y="${h-7}" class="kr-label" text-anchor="middle">${esc(p.d.label.slice(0,3))}</text>`).join('')}
    </svg></div>`;
  }

  function historicalPBs(key){
    const idx=monthIndex(key);
    const priorKeys=monthKeys().slice(0,Math.max(0,idx));
    const pbs=[],first=[];
    eventPlayers(key,true).forEach(p=>{
      const score=Number(p[key])||0;
      const prior=priorKeys.map(k=>Number(p[k])||0).filter(v=>v>0);
      if(!prior.length){
        first.push({name:p.name,score,status:currentStatus(p.name,p.status)});
        return;
      }
      const previous=Math.max(...prior);
      if(score>previous){
        pbs.push({
          name:p.name,score,previous,
          improvement:previous>0?(score-previous)/previous:null,
          status:currentStatus(p.name,p.status)
        });
      }
    });
    return {pbs,first};
  }

  function eventTable(key){
    const list=eventPlayers(key,true);
    const max=Math.max(...list.map(p=>Number(p[key])||0),1);
    const rows=list.map((p,i)=>{
      const score=Number(p[key])||0;
      const through=scoreThrough(p,key);
      const width=Math.max(2,score/max*100);
      return `<tr>
        <td class="num">${i+1}</td>
        <td>${playerButton(p.name)}</td>
        <td>${statusBadge(currentStatus(p.name,p.status))}</td>
        <td><div class="kr-bar" style="--w:${width}%"><span>${fmt(score,1)}</span></div></td>
        <td class="num">${fmt(through.pb,1)}</td>
        <td class="num">${fmt(through.avg,1)}</td>
        <td class="num">${through.events}</td>
        <td class="num">${key==='sept'&&p.septLoadout?esc(p.septLoadout):'—'}</td>
      </tr>`;
    }).join('');
    return `<div class="table-card">
      <div class="table-titlebar"><div><h2>Kraken — ${esc(monthLabel(key))}</h2><div class="small-muted">${list.length} players in the selected current-roster filter</div></div></div>
      <div class="table-wrap"><table><thead><tr>
        <th class="num">#</th><th>Member</th><th>Current Status</th><th>Damage</th><th class="num">PB Through Event</th><th class="num">Avg Through Event</th><th class="num">Events</th><th class="num">Loadout</th>
      </tr></thead><tbody>${rows||'<tr><td colspan="8" class="empty">No Kraken data for this selection.</td></tr>'}</tbody></table></div>
    </div>`;
  }

  function last3Table(){
    const ps=players().map(p=>{
      const vals=monthKeys().map(k=>Number(p[k])||0).filter(v=>v>0);
      const l3=vals.slice(-3);
      return {...p,calcLast3:avg(l3),calcAvg:avg(vals),calcPB:vals.length?Math.max(...vals):0,eventCount:vals.length};
    }).filter(p=>p.calcLast3>0).sort((a,b)=>b.calcLast3-a.calcLast3);
    const max=Math.max(...ps.map(p=>p.calcLast3),1);
    const rows=ps.map((p,i)=>{
      const delta=p.calcLast3-p.calcAvg;
      return `<tr>
        <td class="num">${i+1}</td>
        <td>${playerButton(p.name)}</td>
        <td>${statusBadge(currentStatus(p.name,p.status))}</td>
        <td><div class="kr-bar" style="--w:${Math.max(2,p.calcLast3/max*100)}%"><span>${fmt(p.calcLast3,1)}</span></div></td>
        <td class="num">${fmt(p.calcAvg,1)}</td>
        <td class="num ${delta>=0?'positive':'negative'}">${delta>=0?'+':''}${fmt(delta,1)}</td>
        <td class="num">${fmt(p.calcPB,1)}</td>
        <td class="num">${p.eventCount}</td>
      </tr>`;
    }).join('');
    return `<div class="table-card">
      <div class="table-titlebar"><div><h2>Kraken — Last 3 Average</h2><div class="small-muted">Average of each player's last three recorded Kraken events</div></div></div>
      <div class="table-wrap"><table><thead><tr>
        <th class="num">#</th><th>Member</th><th>Status</th><th>Last 3 Avg</th><th class="num">All Avg</th><th class="num">Vs Avg</th><th class="num">PB</th><th class="num">Events</th>
      </tr></thead><tbody>${rows}</tbody></table></div>
    </div>`;
  }

  function pbView(){
    const hist=historicalPBs(pbEventKey);
    const sorters={
      newpb:(a,b)=>b.score-a.score,
      previouspb:(a,b)=>b.previous-a.previous,
      pctincrease:(a,b)=>(b.improvement||0)-(a.improvement||0)
    };
    const pbs=[...hist.pbs].sort(sorters[pbSort]||sorters.newpb);
    const first=[...hist.first].sort((a,b)=>b.score-a.score);
    const pbRows=pbs.map((x,i)=>`<tr>
      <td class="num">${i+1}</td><td>${playerButton(x.name)}</td><td>${statusBadge(x.status)}</td>
      <td class="num">${fmt(x.previous,1)}</td><td class="num">${fmt(x.score,1)}</td>
      <td class="num positive">+${pct(x.improvement||0)}</td>
    </tr>`).join('')||'<tr><td colspan="6" class="empty">No returning-player PBs in this Kraken.</td></tr>';
    const firstRows=first.map((x,i)=>`<tr>
      <td class="num">${i+1}</td><td>${playerButton(x.name)}</td><td>${statusBadge(x.status)}</td><td class="num">${fmt(x.score,1)}</td>
    </tr>`).join('')||'<tr><td colspan="4" class="empty">No first-time tracked players in this Kraken.</td></tr>';

    return `
      <div class="space-pb-toolbar kr-history-toolbar">
        <div>
          <div class="space-pb-toolbar-title">Kraken PBs & New</div>
          <div class="small-muted">Choose any tracked Kraken to see PBs set in that event.</div>
        </div>
        <div class="pb-toolbar-controls">
          <label class="inline-control">Event
            <select id="krakenPBEventSelect">
              ${[...(K.months||[])].reverse().map(m=>`<option value="${m.key}" ${m.key===pbEventKey?'selected':''}>${esc(m.label)} 2026</option>`).join('')}
            </select>
          </label>
          <label class="inline-control">Sort PBs
            <select id="krakenPBSortSelect">
              <option value="newpb" ${pbSort==='newpb'?'selected':''}>New PB</option>
              <option value="previouspb" ${pbSort==='previouspb'?'selected':''}>Previous PB</option>
              <option value="pctincrease" ${pbSort==='pctincrease'?'selected':''}>% Increase</option>
            </select>
          </label>
        </div>
      </div>
      <div class="callout-grid tabular-grid">
        <div class="table-card"><div class="table-titlebar"><div><h2>Kraken Personal Bests</h2><div class="small-muted">${esc(monthLabel(pbEventKey))} • ${pbs.length} returning-player PB${pbs.length===1?'':'s'}</div></div></div>
          <div class="table-wrap"><table><thead><tr><th class="num">#</th><th>Member</th><th>Status</th><th class="num">Previous PB</th><th class="num">New PB</th><th class="num">% Increase</th></tr></thead><tbody>${pbRows}</tbody></table></div>
        </div>
        <div class="table-card"><div class="table-titlebar"><div><h2>First Tracked Kraken</h2><div class="small-muted">${first.length} player${first.length===1?'':'s'} with no earlier Kraken result</div></div></div>
          <div class="table-wrap"><table><thead><tr><th class="num">#</th><th>Member</th><th>Status</th><th class="num">Damage</th></tr></thead><tbody>${firstRows}</tbody></table></div>
        </div>
      </div>`;
  }

  function overview(){
    const t=monthlyTrend();
    const latestMeta=(K.months||[]).at(-1)||{key:'sept',label:'September'};
    const latest=eventSummary(latestMeta.key);
    const prevMeta=(K.months||[]).at(-2);
    const prev=prevMeta?eventSummary(prevMeta.key):null;
    const delta=prev&&prev.avg?((latest.avg-prev.avg)/prev.avg):0;
    const ps=players();
    const sparks=ps.reduce((s,p)=>s+(Number(p.totalSparks)||0),0);
    const latestPlayers=latest.list;
    return `
      <div class="kr-kpis">
        <div class="kr-kpi"><span>${esc(latestMeta.label)} Avg</span><strong>${fmt(latest.avg,1)}</strong><small>${latest.players} players with scores</small></div>
        <div class="kr-kpi"><span>Vs ${prevMeta?esc(prevMeta.label):'Prior'}</span><strong class="${delta>=0?'positive':'negative'}">${delta>=0?'+':''}${pct(delta)}</strong><small>participant average</small></div>
        <div class="kr-kpi"><span>${esc(latestMeta.label)} Leader</span><strong>${latest.leader?fmt(latest.leader[latestMeta.key],1):'—'}</strong><small>${latest.leader?esc(latest.leader.name):''}</small></div>
        <div class="kr-kpi"><span>${esc(latestMeta.label)} PBs</span><strong>${latest.pbCount}</strong><small>returning players</small></div>
        <div class="kr-kpi"><span>Tracked Kraken Sparks</span><strong>${fmt(sparks,0)}</strong><small>all recorded Kraken rewards</small></div>
      </div>

      <div class="kr-grid-two">
        <div class="card kr-trend-card">
          <div class="card-header"><div><div class="card-title">Clan Kraken Trend</div><div class="card-sub">Average damage per participant • current roster filter</div></div><span class="event-chip kr-chip">MILLION DAMAGE</span></div>
          <div class="card-body">${chart(t)}</div>
        </div>
        <div class="card">
          <div class="card-header"><div><div class="card-title">${esc(latestMeta.label)} Top 10</div><div class="card-sub">Current roster filter</div></div></div>
          <div class="card-body kr-top-table-wrap"><table class="kr-top-table"><thead><tr><th class="num">#</th><th>Member</th><th>Status</th><th class="num">PB</th><th class="num">${esc(latestMeta.label)}</th></tr></thead><tbody>
            ${latestPlayers.slice(0,10).map((p,i)=>`<tr><td class="num">${i+1}</td><td>${playerButton(p.name)}</td><td>${statusBadge(currentStatus(p.name,p.status))}</td><td class="num">${fmt(p.pb,1)}</td><td class="num"><strong>${fmt(p[latestMeta.key],1)}</strong></td></tr>`).join('')}
          </tbody></table></div>
        </div>
      </div>
      <div style="margin-top:16px">${eventTable(latestMeta.key)}</div>`;
  }

  function bindPlayers(root){
    root.querySelectorAll('[data-kr-player]').forEach(b=>b.onclick=()=>{
      const n=b.dataset.krPlayer;
      document.querySelector('.nav-btn[data-page="players"]')?.click();
      setTimeout(()=>{
        const input=document.getElementById('p2ExplorerInput');
        if(input){input.value=n;input.dispatchEvent(new Event('change',{bubbles:true}));}
      },50);
    });
  }

  function renderKrakenOverview(){
    const score=document.getElementById('overviewKrakenScore');
    const box=document.getElementById('overviewKrakenChart');
    if(!score||!box)return;
    const t=monthlyTrend();
    const now=t.at(-1),prev=t.length>1?t.at(-2):null;
    const d=now&&prev&&prev.avg?((now.avg-prev.avg)/prev.avg):0;
    score.innerHTML=`<strong>${now?fmt(now.avg,1):'—'}</strong><span class="${d>=0?'positive':'negative'}">${d>=0?'↑':'↓'} ${pct(Math.abs(d))}</span>`;
    box.innerHTML=chart(t);
  }

  window.renderKraken=function(){
    const root=document.getElementById('krakenContent');
    if(!root)return;

    let body='';
    if(view==='overview') body=overview();
    else if(view==='event'){
      const s=eventSummary(eventKey);
      body=`
        <div class="kr-kpis kr-event-kpis">
          <div class="kr-kpi"><span>Participants</span><strong>${s.players}</strong><small>${esc(monthLabel(eventKey))}</small></div>
          <div class="kr-kpi"><span>Average Damage</span><strong>${fmt(s.avg,1)}</strong><small>per participant</small></div>
          <div class="kr-kpi"><span>Total Damage</span><strong>${fmt(s.total,1)}</strong><small>sum of recorded scores</small></div>
          <div class="kr-kpi"><span>Leader</span><strong>${s.leader?fmt(s.leader[eventKey],1):'—'}</strong><small>${s.leader?esc(s.leader.name):''}</small></div>
          <div class="kr-kpi"><span>PBs</span><strong>${s.pbCount}</strong><small>returning-player PBs</small></div>
        </div>
        ${eventTable(eventKey)}`;
    } else if(view==='last3') body=last3Table();
    else body=pbView();

    root.innerHTML=`
      <div class="kr-toolbar">
        <div class="segmented" id="krakenTabs">
          <button data-kview="overview" class="${view==='overview'?'active':''}">Overview</button>
          <button data-kview="event" class="${view==='event'?'active':''}">Event</button>
          <button data-kview="last3" class="${view==='last3'?'active':''}">Last 3</button>
          <button data-kview="pbs" class="${view==='pbs'?'active':''}">PBs & New</button>
        </div>
        <div class="kr-history-controls">
          ${view==='event'?'<label class="inline-control">Event <select id="krakenEventSelect">'+[...(K.months||[])].reverse().map(m=>'<option value="'+esc(m.key)+'" '+(m.key===eventKey?'selected':'')+'>'+esc(m.label)+' 2026</option>').join('')+'</select></label>':''}
          <div class="small-muted">Tracked Kraken history: ${(K.months||[]).map(m=>esc(m.label.slice(0,3))).join(' • ')}</div>
        </div>
      </div>
      ${body}`;

    root.querySelectorAll('[data-kview]').forEach(b=>b.onclick=()=>{view=b.dataset.kview;window.renderKraken();});
    root.querySelector('#krakenEventSelect')?.addEventListener('change',e=>{eventKey=e.target.value;window.renderKraken();});
    root.querySelector('#krakenPBEventSelect')?.addEventListener('change',e=>{pbEventKey=e.target.value;window.renderKraken();});
    root.querySelector('#krakenPBSortSelect')?.addEventListener('change',e=>{pbSort=e.target.value;window.renderKraken();});
    bindPlayers(root);
  };

  document.getElementById('globalStatusFilter')?.addEventListener('change',()=>setTimeout(()=>{
    renderKrakenOverview();
    if(document.getElementById('page-kraken')?.classList.contains('active')) window.renderKraken();
  },0));
  document.querySelector('.nav-btn[data-page="overview"]')?.addEventListener('click',()=>setTimeout(renderKrakenOverview,0));
  document.querySelector('.nav-btn[data-page="kraken"]')?.addEventListener('click',()=>setTimeout(window.renderKraken,0));

  renderKrakenOverview();
})();