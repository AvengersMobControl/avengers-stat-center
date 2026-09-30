(function(){
  'use strict';

  const DATA=window.AVENGERS_PIGGY_FLASH_DATA=window.AVENGERS_PIGGY_FLASH_DATA||{events:[]};
  const channelLabels={
    '1425021492629995560':'Flash 1',
    '1425021633009291396':'Flash 2',
    '1425021793835552868':'Flash 3',
    '1425021900463013919':'Flash 4'
  };
  const fmt=v=>(Number(v)||0).toLocaleString();
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const D=window.AVENGERS_DATA||{};
  const resolveName=name=>{
    let x=String(name||'');
    const seen=new Set();
    while(D.aliasMap?.[x] && !seen.has(x)){seen.add(x);x=D.aliasMap[x];}
    return x;
  };

  function ensureUI(){
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

    if(nav && !nav.querySelector('[data-discord-review-link]')){
      const review=document.createElement('button');
      review.className='nav-btn';
      review.setAttribute('data-discord-review-link','');
      review.innerHTML='<span>⌕</span> Discord Review';
      review.addEventListener('click',()=>{window.location.href='/discord-review.html';});
      nav.appendChild(review);
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

  function entries(){
    const mode=clanMode();
    const out=[];
    (DATA.events||[]).forEach(ev=>{
      (ev.entries||[]).forEach(r=>{
        const clan=r.clan||ev.clan||ev.rosterScope||'AVENGERS';
        if(mode!=='all' && clan!==mode) return;
        out.push({...r,name:resolveName(r.name),clan,eventDate:ev.date||'',setId:ev.setId||((ev.date||'')+'-A'),flash:Number(ev.flash)||Number(String(channelLabels[ev.channelId]||'').replace(/\D/g,''))||0,complete:!!ev.complete,coverage:ev.coverage||'',channelId:ev.channelId||'',messageId:ev.messageId||''});
      });
    });
    return out;
  }

  function render(){
    const root=document.getElementById('piggyFlashesContent');
    if(!root)return;
    const rows=entries();
    const events=new Set(rows.map(r=>r.messageId||r.eventDate+'|'+r.channelId)).size;
    const players=new Set(rows.map(r=>r.name).filter(Boolean)).size;
    const totalLines=rows.reduce((s,r)=>s+(Number(r.lines)||0),0);
    const totalSparks=rows.reduce((s,r)=>s+(Number(r.sparks)||0),0);

    const aggregateByPlayer=input=>{
      const map=new Map();
      input.forEach(r=>{
        const x=map.get(r.name)||{name:r.name,flashes:0,lines:0,stars:0,sparks:0,best:0};
        x.flashes++; x.lines+=Number(r.lines)||0; x.stars+=Number(r.stars)||0; x.sparks+=Number(r.sparks)||0; x.best=Math.max(x.best,Number(r.lines)||0);
        map.set(r.name,x);
      });
      return [...map.values()].map(x=>({...x,avg:x.flashes?x.lines/x.flashes:0}));
    };
    const overall=aggregateByPlayer(rows).sort((a,b)=>b.lines-a.lines||b.avg-a.avg);
    const overallBody=overall.map((r,i)=>'<tr><td class="num">'+(i+1)+'</td><td><strong>'+esc(r.name)+'</strong></td><td class="num">'+fmt(r.flashes)+'</td><td class="num">'+fmt(r.lines)+'</td><td class="num">'+fmt(Math.round(r.avg))+'</td><td class="num">'+fmt(r.best)+'</td><td class="num">'+fmt(r.stars)+'</td><td class="num">'+fmt(r.sparks)+'</td></tr>').join('');

    const setMap=new Map();
    rows.forEach(r=>{
      const key=r.setId||r.eventDate+'-A';
      const s=setMap.get(key)||{id:key,date:r.eventDate,flashes:new Set(),rows:[]};
      s.flashes.add(r.flash); s.rows.push(r); if(String(r.eventDate)<String(s.date))s.date=r.eventDate; setMap.set(key,s);
    });
    const setRows=[];
    [...setMap.values()].sort((a,b)=>String(b.date).localeCompare(String(a.date))).forEach(s=>{
      aggregateByPlayer(s.rows).sort((a,b)=>b.lines-a.lines).forEach((r,i)=>setRows.push('<tr><td>'+esc(s.id)+'</td><td class="num">'+s.flashes.size+'/4</td><td class="num">'+(i+1)+'</td><td><strong>'+esc(r.name)+'</strong></td><td class="num">'+fmt(r.lines)+'</td><td class="num">'+fmt(r.stars)+'</td><td class="num">'+fmt(r.sparks)+'</td></tr>'));
    });
    const partialEvents=(DATA.events||[]).filter(e=>!e.complete).length;

    const body=rows.slice().sort((a,b)=>String(b.eventDate).localeCompare(String(a.eventDate)) || (Number(a.rank)||999)-(Number(b.rank)||999)).map(r=>`
      <tr>
        <td>${esc(r.eventDate||'—')}</td>
        <td>${esc(channelLabels[r.channelId]||r.channelId||'—')}</td>
        <td class="num">${r.rank??'—'}</td>
        <td><strong>${esc(r.name||'—')}</strong></td>
        <td>${esc(r.clan||'—')}</td>
        <td class="num">${fmt(r.lines)}</td>
        <td class="num">${fmt(r.stars)}</td>
        <td class="num">${fmt(r.sparks)}</td>
      </tr>`).join('');

    root.innerHTML=`
      <div class="records-note">
        <strong>Manual Discord import.</strong>
        Piggy Flash screenshots are only added after an approved pull. Preliminary/progress screenshots are ignored, and only AVENGERS or AV-2 entries are retained.
      </div>
      <div class="records-note">
        <strong>Flash Set logic.</strong> Each Flash 1 starts a new 24-hour Flash 1-4 set. If a calendar week has eight flashes, the second Flash 1 starts a separate set rather than combining all eight.
      </div>
      ${partialEvents?'<div class="records-note"><strong>Source coverage:</strong> '+partialEvents+' imported event'+(partialEvents===1?'':'s')+' currently have partial screenshot coverage. Missing rank ranges are unknown, not zero.</div>':''}
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">Flash Results</div><div class="kpi-value">${fmt(events)}</div><div class="kpi-note">approved result posts</div></div>
        <div class="kpi"><div class="kpi-label">Players</div><div class="kpi-value">${fmt(players)}</div><div class="kpi-note">unique in current filter</div></div>
        <div class="kpi"><div class="kpi-label">Lines</div><div class="kpi-value">${fmt(totalLines)}</div><div class="kpi-note">current filter total</div></div>
        <div class="kpi"><div class="kpi-label">Sparks</div><div class="kpi-value">${fmt(totalSparks)}</div><div class="kpi-note">current filter total</div></div>
      </div>
      <div class="table-card">
        <div class="table-titlebar"><div><h2>Piggy Flash Results</h2><div class="small-muted">Four Discord flash channels • event clan preserved at time of result</div></div></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Event</th><th>Channel</th><th class="num">Rank</th><th>Member</th><th>Clan</th><th class="num">Lines</th><th class="num">Stars</th><th class="num">Sparks</th></tr></thead>
          <tbody>${body||'<tr><td colspan="8" class="empty">No Piggy Flash results imported yet.</td></tr>'}</tbody>
        </table></div>
      </div>
      <div class="table-card" style="margin-top:16px">
        <div class="table-titlebar"><div><h2>Overall Flash Performance</h2><div class="small-muted">All imported Flash 1-4 results combined by player</div></div></div>
        <div class="table-wrap"><table><thead><tr><th class="num">#</th><th>Member</th><th class="num">Flashes</th><th class="num">Total Lines</th><th class="num">Avg Lines</th><th class="num">Best</th><th class="num">Stars</th><th class="num">Sparks</th></tr></thead>
        <tbody>${overallBody||'<tr><td colspan="8" class="empty">No flash performance yet.</td></tr>'}</tbody></table></div>
      </div>
      <div class="table-card" style="margin-top:16px">
        <div class="table-titlebar"><div><h2>4-Flash Set Totals</h2><div class="small-muted">Per-player total across each 24-hour Flash 1-4 set; doubled-up weeks remain separate sets</div></div></div>
        <div class="table-wrap"><table><thead><tr><th>Flash Set</th><th class="num">Flashes</th><th class="num">#</th><th>Member</th><th class="num">Total Lines</th><th class="num">Total Stars</th><th class="num">Total Sparks</th></tr></thead>
        <tbody>${setRows.join('')||'<tr><td colspan="7" class="empty">No flash-set totals yet.</td></tr>'}</tbody></table></div>
      </div>`;
  }

  function showPage(btn){
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    document.getElementById('page-piggyFlashes')?.classList.add('active');
    btn?.classList.add('active');
    const title=document.getElementById('pageTitle');
    const sub=document.getElementById('pageSubtitle');
    if(title) title.textContent='Piggy Flashes';
    if(sub) sub.textContent='Flash 1-4 results, overall performance, and 24-hour set totals';
    render();
    document.querySelector('.sidebar')?.classList.remove('open');
  }

  ensureUI();
  render();
  document.getElementById('globalStatusFilter')?.addEventListener('change',()=>{
    if(document.getElementById('page-piggyFlashes')?.classList.contains('active')) render();
  });
})();
