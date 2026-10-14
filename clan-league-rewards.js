/* Clan League Rewards: six complete five-week leagues ending with Kraken.
 * Direct rewards come from Flash, Piggy and Space final event rows.
 * October Kraken has recorded event Sparks; older Kraken Sparks are estimates
 * from historical damage and inferred event-time clan, explicitly marked.
 */
(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  if(!D)return;
  const K=window.AVENGERS_KRAKEN_DATA||{};
  const F=window.AVENGERS_PIGGY_FLASH_DATA||{events:[]};
  const LEAGUES=[
    {end:'2026-10-11',kraken:'oct'},
    {end:'2026-09-06',kraken:'sept'},
    {end:'2026-08-02',kraken:'aug'},
    {end:'2026-06-28',kraken:'june'},
    {end:'2026-05-24',kraken:'may'},
    {end:'2026-04-19',kraken:'april'}
  ].map(p=>{
    const d=new Date(p.end+'T00:00:00Z');
    d.setUTCDate(d.getUTCDate()-34);
    return {...p,start:d.toISOString().slice(0,10)};
  });
  const RATES={'AVENGERS':750,'AV-2':500}; // Sparks for 1M Kraken damage
  let selected=LEAGUES[0].end, clanFilter='AVENGERS', sortBy='sparks', search='';
  let cache=null,host=null;

  function canonical(name){
    let s=String(name||'').trim(),n=0;
    while(D.aliasMap && D.aliasMap[s] && D.aliasMap[s]!==s && ++n<12)s=D.aliasMap[s];
    return s;
  }
  function escape(s){
    return String(s==null?'':s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&#039;'}[x]));
  }
  function num(n){return (Number(n)||0).toLocaleString(undefined,{maximumFractionDigits:0});}
  function dateLabel(d){
    return new Date(d+'T00:00:00Z').toLocaleDateString(undefined,{timeZone:'UTC',month:'short',day:'numeric',year:'numeric'});
  }
  function shortDate(d){return new Date(d+'T00:00:00Z').toLocaleDateString(undefined,{timeZone:'UTC',month:'short',day:'numeric'});}
  function field(r,k){return r&&r[k]!=null&&r[k]!==''&&Number.isFinite(Number(r[k]))?Number(r[k]):null;}
  function eventClan(r,kind){
    const c=String(r.eventClan||r.raceClan||r.clan||'').toLowerCase().replace(/[^a-z0-9]/g,'');
    if(c==='avengers'||c==='av')return 'AVENGERS';
    if(c==='av2')return 'AV-2';
    if(kind==='piggy'){
      // Match existing Piggy event-roster membership semantics on the Stat Center.
      return ((Number(r.stars)||0)>0||(Number(r.sparks)||0)>0||(Number(r.share)||0)>0)?'AVENGERS':'AV-2';
    }
    return 'AVENGERS';
  }
  function within(date,p){return date>=p.start&&date<=p.end;}
  function add(p,kind,date,r,clan,estimated){
    const name=canonical(r.name);
    if(!name||name==='Total'||name==='#N/A')return;
    const id=clan+'|'+name;
    let rec=p.members.get(id);
    if(!rec){
      rec={name,clan,flashSparks:0,piggySparks:0,spaceSparks:0,krakenSparks:0,flashStars:0,piggyStars:0,spaceStars:0,
        sparkKnown:0,starKnown:0,missing:0,estimatedKraken:0,events:0};
      p.members.set(id,rec);
    }
    const stars=field(r,'stars'),sparks=field(r,'sparks');
    if(kind==='piggy'||kind==='space'||kind==='flash'){
      rec[kind+'Sparks']+=sparks||0;
      rec[kind+'Stars']+=stars||0;
      if(sparks!==null)rec.sparkKnown++;
      if(stars!==null)rec.starKnown++;
      if(stars===null||sparks===null)rec.missing++;
    }else{
      rec.krakenSparks+=sparks||0;
      rec.sparkKnown++;
      if(estimated)rec.estimatedKraken+=sparks||0;
    }
    rec.events++;
    p.events.add(kind+'|'+date+'|'+clan);
    p.eventMembers.add(kind+'|'+date+'|'+clan+'|'+name);
    if(kind!=='kraken'){
      const prev=p.lastKnownClan.get(name);
      if(!prev||date>prev.date)p.lastKnownClan.set(name,{date,clan});
      else if(date===prev.date&&clan!==prev.clan)p.lastKnownClan.set(name,{date,clan:null});
    }
  }
  function build(){
    const periods=LEAGUES.map(x=>({...x,members:new Map(),events:new Set(),eventMembers:new Set(),lastKnownClan:new Map(),gaps:0,estimates:0}));
    const which=date=>periods.find(p=>within(date,p));
    for(const kind of ['piggy','space']){
      const events=D[kind]&&D[kind].events||{};
      for(const [date,all] of Object.entries(events)){
        const p=which(date);
        if(!p)continue;
        const unique=new Map();
        (all||[]).forEach(r=>{
          if(!r||!r.name||r.name==='Total'||r.name==='#N/A')return;
          const activity=kind==='piggy'?'lines':'yearsB';
          if(!(Number(r[activity])>0))return;
          const clan=eventClan(r,kind),name=canonical(r.name),key=clan+'|'+name;
          const prev=unique.get(key);
          // Historical imports can append a duplicate. Keep the most informative
          // final-result record, never double-count the same player and race.
          const weight=x=>[x.stars,x.sparks,x.share].filter(v=>Number(v)>0).length*1e12+(Number(x[activity])||0);
          if(!prev||weight(r)>weight(prev))unique.set(key,{...r,clan});
        });
        unique.forEach(r=>add(p,kind,date,r,r.clan,false));
      }
    }
    // Flash rewards belong to each five-week league just like Piggy/Space.
    // Use the specific Flash event ID so multiple Flash sets aren't collapsed.
    const flashEvents=new Map();
    (F.events||[]).forEach(ev=>{
      if(!ev||!ev.date)return;
      const key=String(ev.id||[ev.setId||ev.date,ev.flash,ev.channelId||''].join('|'));
      const prev=flashEvents.get(key);
      if(!prev||(ev.entries||[]).length>(prev.entries||[]).length)flashEvents.set(key,ev);
    });
    flashEvents.forEach(ev=>{
      const date=String(ev.date).slice(0,10),p=which(date);
      if(!p)return;
      const unique=new Map();
      (ev.entries||[]).forEach(r=>{
        if(!r||!r.name||r.name==='Total'||r.name==='#N/A')return;
        const name=canonical(r.name);
        const clan=eventClan({...r,clan:r.clan||ev.clan||ev.rosterScope||'AVENGERS'},'flash');
        const key=clan+'|'+name;
        const prev=unique.get(key);
        // Screenshots sometimes have overlapping results; count each member
        // only once per Flash event, preferring the fuller reward record.
        const weight=x=>[x.stars,x.sparks].filter(v=>v!=null&&Number.isFinite(Number(v))).length*1e12+
          (Number(x.sparks)||0)*1e4+(Number(x.stars)||0);
        if(!prev||weight(r)>weight(prev))unique.set(key,{...r,name,clan});
      });
      unique.forEach(r=>add(p,'flash',date,r,r.clan,false));
    });
    // The October Kraken import stores explicit, event-clan Sparks.
    (K.octEventRows||[]).forEach(r=>{
      const p=which(String(r.eventDate||''));
      if(p&&Number(r.damage)>0&&Number(r.sparks)>=0)add(p,'kraken',r.eventDate,r,r.clan==='AVENGERS'?'AVENGERS':'AV-2',false);
    });
    // Earlier Kraken snapshots contain damage but not member reward records.
    // Reconstruct only when a historical event in that league identifies the clan.
    for(const p of periods){
      if(p.kraken==='oct')continue;
      for(const r of K.players||[]){
        const damage=Number(r[p.kraken])||0;
        if(!(damage>0))continue;
        const name=canonical(r.name),proof=p.lastKnownClan.get(name);
        if(!proof||!proof.clan)continue; // no guess from today's roster
        const sparkValue=damage*(RATES[proof.clan]||0);
        if(!(sparkValue>0))continue;
        add(p,'kraken',p.end,{name,sparks:sparkValue},proof.clan,true);
      }
    }
    periods.forEach(p=>{
      p.rows=[...p.members.values()].map(r=>({...r,
        sparks:r.flashSparks+r.piggySparks+r.spaceSparks+r.krakenSparks,
        stars:r.flashStars+r.piggyStars+r.spaceStars}));
    });
    return periods;
  }
  function chosenRows(p){
    return p.rows.filter(r=>clanFilter==='All'||r.clan===clanFilter);
  }
  function totals(rows){
    return rows.reduce((a,r)=>{
      a.sparks+=r.sparks;a.stars+=r.stars;a.flashSparks+=r.flashSparks;a.krakenEstimate+=r.estimatedKraken;
      a.missing+=r.missing;
      return a;
    },{sparks:0,stars:0,flashSparks:0,krakenEstimate:0,missing:0});
  }
  function tableRows(p){
    const q=search.trim().toLowerCase();
    return chosenRows(p)
      .sort((a,b)=>b[sortBy]-a[sortBy]||b.sparks-a.sparks||a.name.localeCompare(b.name))
      .map((r,i)=>({...r,leagueRank:i+1}))
      .filter(r=>!q||r.name.toLowerCase().includes(q));
  }
  function downloadCsv(rows,p){
    const cols=['Name','Clan','League start','Kraken end','Flash Sparks','Piggy Sparks','Space Sparks','Kraken Sparks','Kraken Sparks estimated','Total Sparks','Flash Stars','Piggy Stars','Space Stars','Total Stars','Events','Missing reward records'];
    const quote=x=>{const s=String(x==null?'':x);return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
    const body=rows.map(r=>[r.name,r.clan,p.start,p.end,r.flashSparks,r.piggySparks,r.spaceSparks,r.krakenSparks,r.estimatedKraken,r.sparks,r.flashStars,r.piggyStars,r.spaceStars,r.stars,r.events,r.missing].map(quote).join(','));
    const blob=new Blob([[cols.map(quote).join(','),...body].join('\r\n')],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='avengers-clan-league-rewards-'+p.end+'-'+clanFilter.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.csv';
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
  }
  function render(){
    if(!host)return;
    if(!cache)cache=build();
    const p=cache.find(x=>x.end===selected)||cache[0];
    const all=chosenRows(p),summary=totals(all);
    const summaryRows=cache.map(x=>{
      const rs=chosenRows(x),t=totals(rs);
      return '<button class="league-period'+(x.end===p.end?' active':'')+'" data-league="'+x.end+'" type="button">'+
        '<span>'+shortDate(x.start)+' – '+shortDate(x.end)+'</span>'+
        '<strong>'+num(t.sparks)+' Sparks</strong>'+
        '<small>'+num(t.stars)+' Stars · '+rs.length+' members</small></button>';
    }).join('');
    host.innerHTML=
      '<section class="league-rewards-panel">'+
      '<div class="league-rewards-heading"><div><h2>Clan League Rewards</h2><p>Member Sparks and Stars by five-week clan league · six completed leagues</p></div>'+
      '<div class="league-rewards-actions"><label>Clan <select data-league-clan><option value="AVENGERS">AVENGERS</option><option value="AV-2">AV-2</option><option value="All">Both clans</option></select></label>'+
      '<button type="button" data-league-export class="ghost-btn">Export CSV</button></div></div>'+
      '<div class="league-period-list">'+summaryRows+'</div>'+
      '<div class="league-rewards-kpis">'+
        '<div><small>Total Sparks</small><strong>'+num(summary.sparks)+'</strong></div>'+
        '<div><small>Total Stars</small><strong>'+num(summary.stars)+'</strong></div>'+
        '<div><small>Flash Sparks</small><strong>'+num(summary.flashSparks)+'</strong></div>'+
        '<div><small>Kraken Sparks estimated</small><strong>'+num(summary.krakenEstimate)+'</strong></div>'+
      '</div>'+
      '<div class="league-rewards-toolbar"><div><strong>'+escape(dateLabel(p.start))+' – '+escape(dateLabel(p.end))+'</strong>'+
        '<span>Kraken ends '+escape(dateLabel(p.end))+'</span></div>'+
      '<div class="league-rewards-controls"><input data-league-search type="search" autocomplete="off" placeholder="Find a member…" value="'+escape(search)+'" />'+
      '<label>Rank by <select data-league-sort><option value="sparks">Sparks</option><option value="stars">Stars</option></select></label></div></div>'+
      '<div class="league-rewards-scroll"><table class="league-rewards-table"><thead><tr>'+
      '<th>#</th><th>Member</th><th>Clan</th><th class="num">Flash Sparks</th><th class="num">Piggy Sparks</th><th class="num">Space Sparks</th>'+
      '<th class="num">Kraken Sparks</th><th class="num">Total Sparks</th><th class="num">Total Stars</th>'+
      '</tr></thead><tbody data-league-body></tbody></table></div>'+
      '<div class="league-rewards-footnote">Stars are member rewards (not total race pots). Flash, Piggy and Space Sparks/Stars come from recorded final results. '+
      'Older Kraken Sparks marked * are estimates (damage × 750 for AVENGERS or × 500 for AV-2); clan is inferred from that league’s most recent recorded Piggy/Space event. '+
      'Members without evidence of their historical Kraken clan are not assigned estimated Kraken Sparks. '+
      'October Kraken Sparks are from the recorded event import. Historical Flash rewards can be incomplete where screenshots are missing. '+
      (summary.missing?'<strong>'+num(summary.missing)+' event records have incomplete reward fields.</strong>':'')+
      '</div></section>';
    const select=host.querySelector('[data-league-clan]');
    select.value=clanFilter;
    host.querySelector('[data-league-sort]').value=sortBy;
    updateBody();
  }
  function updateBody(){
    const p=cache.find(x=>x.end===selected)||cache[0];
    const rows=tableRows(p),body=host.querySelector('[data-league-body]');
    if(!body)return;
    body.innerHTML=rows.length?rows.map((r,i)=>
      '<tr><td>'+r.leagueRank+'</td><td class="league-player">'+escape(r.name)+'</td><td>'+escape(r.clan)+'</td>'+
      '<td class="num">'+num(r.flashSparks)+'</td><td class="num">'+num(r.piggySparks)+'</td><td class="num">'+num(r.spaceSparks)+'</td>'+
      '<td class="num">'+num(r.krakenSparks)+(r.estimatedKraken?' <abbr title="Estimated from damage and inferred historical clan">*</abbr>':'')+'</td>'+
      '<td class="num league-strong">'+num(r.sparks)+'</td><td class="num league-strong">'+num(r.stars)+'</td></tr>').join(''):
      '<tr><td colspan="9" class="league-empty">No matching recorded members in this league.</td></tr>';
  }
  function setup(el){
    host=el;if(!host)return;
    cache=build();render();
    host.addEventListener('click',ev=>{
      const btn=ev.target.closest('[data-league],[data-league-export]');
      if(!btn)return;
      if(btn.hasAttribute('data-league')){selected=btn.getAttribute('data-league');search='';render();}
      else downloadCsv(tableRows(cache.find(x=>x.end===selected)||cache[0]),cache.find(x=>x.end===selected)||cache[0]);
    });
    host.addEventListener('change',ev=>{
      const target=ev.target;
      if(target.matches('[data-league-clan]')){clanFilter=target.value;search='';render();}
      if(target.matches('[data-league-sort]')){sortBy=target.value;render();}
    });
    host.addEventListener('input',ev=>{
      if(ev.target.matches('[data-league-search]')){search=ev.target.value;updateBody();}
    });
  }
  window.AVENGERS_CLAN_LEAGUE_REWARDS={render:setup,build};
})();