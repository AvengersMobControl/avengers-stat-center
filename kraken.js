(function(){
  'use strict';
  const K=window.AVENGERS_KRAKEN_DATA;
  if(!K) return;

  let view='latest';
  const fmt=(v,d=0)=>(Number(v)||0).toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d});
  const pct=v=>((Number(v)||0)*100).toFixed(1)+'%';
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const rosterMode=()=>document.getElementById('globalStatusFilter')?.value||'current';
  const allowed=p=>{
    const m=rosterMode();
    if(m==='active') return p.status==='Active';
    if(m==='av2') return p.status==='AV2';
    return p.status==='Active'||p.status==='AV2';
  };
  const players=()=>K.players.filter(allowed);
  const avg=a=>a.length?a.reduce((s,x)=>s+(Number(x)||0),0)/a.length:0;

  function monthlyTrend(){
    const ps=players();
    return K.months.map(m=>{
      const vals=ps.map(p=>Number(p[m.key])||0).filter(v=>v>0);
      return {label:m.label,key:m.key,avg:avg(vals),players:vals.length,total:vals.reduce((s,v)=>s+v,0)};
    }).filter(x=>x.players>0);
  }

  function chart(data){
    if(!data.length)return '<div class="empty">No Kraken history for this roster filter.</div>';
    const w=700,h=220,padL=48,padR=18,padT=18,padB=32;
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
    return `<div class="kr-chart"><svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <defs><linearGradient id="krArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffb454" stop-opacity=".28"/><stop offset="100%" stop-color="#ff7a59" stop-opacity="0"/></linearGradient></defs>
      <line x1="${padL}" y1="${padT}" x2="${w-padR}" y2="${padT}" class="kr-grid"/>
      <line x1="${padL}" y1="${padT+ph/2}" x2="${w-padR}" y2="${padT+ph/2}" class="kr-grid"/>
      <line x1="${padL}" y1="${h-padB}" x2="${w-padR}" y2="${h-padB}" class="kr-grid"/>
      <path d="${area}" class="kr-area"/>
      <path d="${path}" class="kr-line"/>
      ${pts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="4" class="kr-dot"><title>${esc(p.d.label)}: ${fmt(p.d.avg,1)} avg • ${p.d.players} players</title></circle>`).join('')}
      ${pts.map(p=>`<text x="${p.x}" y="${h-7}" class="kr-label" text-anchor="middle">${esc(p.d.label.slice(0,3))}</text>`).join('')}
    </svg></div>`;
  }

  function statusBadge(s){
    return '<span class="status '+(s==='Active'?'active':'av2')+'">'+(s==='Active'?'Active':'AV-2')+'</span>';
  }
  function playerButton(name){
    return '<button class="kr-player-link" data-kr-player="'+esc(name)+'">'+esc(name)+'</button>';
  }
  function tableRows(list,metric){
    const max=Math.max(...list.map(p=>Number(p[metric])||0),1);
    return list.map((p,i)=>{
      const v=Number(p[metric])||0;
      const width=Math.max(2,v/max*100);
      const change=p.aug>0&&p.sept>0?(p.sept-p.aug)/p.aug:null;
      return `<tr>
        <td class="num">${i+1}</td>
        <td>${playerButton(p.name)}</td>
        <td>${statusBadge(p.status)}</td>
        <td><div class="kr-bar" style="--w:${width}%"><span>${fmt(v,1)}</span></div></td>
        <td class="num">${fmt(p.pb,1)}</td>
        <td class="num">${fmt(p.avg,1)}</td>
        <td class="num">${fmt(p.last3,1)}</td>
        <td class="num">${p.septLoadout?esc(p.septLoadout):'—'}</td>
        <td class="num ${change==null?'':' '+(change>=0?'positive':'negative')}">${change==null?'—':(change>=0?'+':'')+pct(change)}</td>
      </tr>`;
    }).join('');
  }

  function renderTable(){
    const ps=players();
    let metric='sept',title='September Kraken',sub='Current roster • damage score in millions';
    if(view==='last3'){metric='last3';title='Kraken — Last 3 Average';sub='Average of June, August and September where logged';}
    if(view==='pb'){metric='pb';title='Kraken Personal Bests';sub='Best recorded Kraken damage score';}
    const list=ps.filter(p=>(Number(p[metric])||0)>0).sort((a,b)=>(Number(b[metric])||0)-(Number(a[metric])||0));
    return `<div class="table-card">
      <div class="table-titlebar"><div><h2>${title}</h2><div class="small-muted">${sub}</div></div></div>
      <div class="table-wrap"><table><thead><tr>
        <th class="num">#</th><th>Member</th><th>Status</th><th>Score</th><th class="num">PB</th><th class="num">All Avg</th><th class="num">Last 3</th><th class="num">Sept Loadout</th><th class="num">Aug→Sept</th>
      </tr></thead><tbody>${tableRows(list,metric)}</tbody></table></div>
    </div>`;
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
    const t=monthlyTrend();
    const latest=t.at(-1),prev=t.length>1?t.at(-2):null;
    const d=latest&&prev&&prev.avg?((latest.avg-prev.avg)/prev.avg):0;
    const ps=players();
    const latestPlayers=ps.filter(p=>p.sept>0);
    const top=latestPlayers.slice().sort((a,b)=>b.sept-a.sept)[0];
    const pbCount=latestPlayers.filter(p=>p.pbCheck).length;
    const sparks=ps.reduce((s,p)=>s+(Number(p.totalSparks)||0),0);
    root.innerHTML=`
      <div class="kr-toolbar">
        <div class="segmented" id="krakenTabs">
          <button data-kview="latest" class="${view==='latest'?'active':''}">September</button>
          <button data-kview="last3" class="${view==='last3'?'active':''}">Last 3</button>
          <button data-kview="pb" class="${view==='pb'?'active':''}">PBs</button>
        </div>
        <div class="small-muted">Kraken data from the workbook KRMaster table • current AVENGERS / AV-2 roster</div>
      </div>

      <div class="kr-kpis">
        <div class="kr-kpi"><span>September Avg</span><strong>${latest?fmt(latest.avg,1):'—'}</strong><small>${latest?latest.players:0} players with scores</small></div>
        <div class="kr-kpi"><span>Vs August</span><strong class="${d>=0?'positive':'negative'}">${d>=0?'+':''}${pct(d)}</strong><small>participant average</small></div>
        <div class="kr-kpi"><span>September Leader</span><strong>${top?fmt(top.sept,1):'—'}</strong><small>${top?esc(top.name):''}</small></div>
        <div class="kr-kpi"><span>September PBs</span><strong>${pbCount}</strong><small>current roster</small></div>
        <div class="kr-kpi"><span>Tracked Kraken Sparks</span><strong>${fmt(sparks,0)}</strong><small>since February</small></div>
      </div>

      <div class="kr-grid-two">
        <div class="card kr-trend-card">
          <div class="card-header"><div><div class="card-title">Clan Kraken Trend</div><div class="card-sub">Average damage score per participant • current roster</div></div><span class="event-chip kr-chip">MILLION DAMAGE</span></div>
          <div class="card-body">${chart(t)}</div>
        </div>
        <div class="card">
          <div class="card-header"><div><div class="card-title">September Top 10</div><div class="card-sub">Current roster</div></div></div>
          <div class="card-body"><div class="mini-rank">${latestPlayers.slice().sort((a,b)=>b.sept-a.sept).slice(0,10).map((p,i)=>`
            <div class="rank-row"><div class="rank-num">${i+1}</div><div><div class="rank-name">${playerButton(p.name)}</div><div class="rank-meta">${p.septLoadout?esc(p.septLoadout)+' • ':''}PB ${fmt(p.pb,1)}</div></div><div class="rank-score">${fmt(p.sept,1)}</div></div>`).join('')}</div></div>
        </div>
      </div>

      <div style="margin-top:16px">${renderTable()}</div>`;

    root.querySelectorAll('[data-kview]').forEach(b=>b.onclick=()=>{view=b.dataset.kview;window.renderKraken();});
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