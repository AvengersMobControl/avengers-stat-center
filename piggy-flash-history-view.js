/* AVENGERS-only Flash historical website panels; no result mutation. */
(function(root){
'use strict';
const state={sort:{pots:['date',-1],singles:['lines',-1],days:['lines',-1]},q:{},open:{}};
const fmt=n=>n==null?'—':Number(n).toLocaleString(undefined,{maximumFractionDigits:2});
const pct=n=>n==null?'—':Number(n).toFixed(1)+'%';
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\u0027':'&#39;'}[c]));
const sortBy=(items,kind)=>{const [col,dir]=state.sort[kind];return items.slice().sort((a,b)=>{
 const x=a[col],y=b[col],v=typeof x==='number'&&typeof y==='number'?x-y:String(x??'').localeCompare(String(y??''));
 return v*dir||String(a.date||a.setId||'').localeCompare(String(b.date||b.setId||''));});};
const hdr=(kind,key,label)=>'<th><button type="button" data-hist-sort="'+kind+'" data-hist-key="'+key+'">'+esc(label)+
 (state.sort[kind][0]===key?(state.sort[kind][1]===-1?' ▼':' ▲'):'')+'</button></th>';
function archive(kind,title,description,columns,body,count){
 return '<details class="flash-history-archive" data-hist-open="'+kind+'" '+(state.open[kind]?'open':'')+'>'+
 '<summary><strong>'+esc(title)+'</strong><span>'+fmt(count)+' tracked</span></summary>'+
 '<div class="flash-history-content"><p>'+esc(description)+'</p>'+
 '<label class="flash-history-search">Search <input type="search" data-hist-search="'+kind+'" value="'+esc(state.q[kind]||'')+'" placeholder="Name, date, PF..." /></label>'+
 '<div class="table-wrap"><table class="flash-history-table"><thead><tr>'+columns+'</tr></thead><tbody>'+body+
 '</tbody></table></div></div></details>';
}
function render(host,events,day,tab,resolve){
 if(!host||!root.AVENGERS_FLASH_HISTORY)return;
 const h=root.AVENGERS_FLASH_HISTORY.analyze(events,{resolveName:resolve});
 const selected=day&&day!=='all'?day:null;
 const pf=/^pf[1-4]$/.test(tab||'')?Number(tab.slice(2)):null;
 const chosen=x=>(!selected||x.setId?.slice(0,10)===selected)&&(!pf||x.flash===pf);
 const pots=h.pots.filter(chosen),singles=h.singles.filter(chosen).sort((a,b)=>b.lines-a.lines);
 const days=h.days.filter(x=>!selected||x.setId.slice(0,10)===selected).sort((a,b)=>b.lines-a.lines);
 const dayPodiums=h.podiums.filter(chosen).sort((a,b)=>a.flash-b.flash||a.finish-b.finish);
 const pb=h.pb.filter(chosen),base=pb.filter(x=>x.priorAverage!==null),above=base.filter(x=>x.abovePriorAverage);
 const comparable=h.dailyComparisons.filter(x=>(!selected||x.setId.slice(0,10)===selected)&&x.comparable);
 const aboveDays=comparable.filter(x=>x.abovePriorAverage),dayPB=comparable.filter(x=>x.combinedDayPB);
 const part=(heading,body,note)=>'<section class="flash-history-panel"><h3>'+heading+'</h3>'+(note?'<p class="flash-history-note">'+note+'</p>':'')+body+'</section>';
 const card=selected?part('Flash Pots & Estimated Rake',
   '<div class="flash-history-grid">'+pots.slice().sort((a,b)=>a.flash-b.flash).map(p=>'<div class="flash-history-card"><strong>PF'+p.flash+'</strong>'+
   '<span>'+esc(p.potStarsDisplay||fmt(p.potStars))+' pot Stars</span>'+
   '<span>'+pct(p.rakePercent)+' estimated rake</span>'+
   '<small>PF '+fmt(p.pfRank)+'/'+fmt(p.pfCount)+' · Overall '+fmt(p.overallRank)+'/'+fmt(p.overallCount)+'</small></div>').join('')+'</div>',
   'Estimated rake = recorded AVENGERS Stars earned ÷ source main-lobby pot Stars; additional lobbies and incomplete results can affect the estimate.'):'';
 const podium=selected?part('Recorded Podium Finishers — Historic Wins / Podiums',
   '<div class="table-wrap"><table class="flash-history-table"><thead><tr><th>Flash</th><th>Place</th><th>Player</th><th>Career wins</th><th>Career podiums</th></tr></thead><tbody>'+
   (dayPodiums.map(r=>'<tr><td>PF'+r.flash+'</td><td>'+(r.finish===1?'🥇':r.finish===2?'🥈':'🥉')+' '+r.finish+'</td><td>'+esc(r.player)+'</td><td>'+fmt(r.careerWins)+'</td><td>'+fmt(r.careerPodiums)+'</td></tr>').join('')||'<tr><td colspan="5">No verified podium placements.</td></tr>')+
   '</tbody></table></div>','Career statistics through the listed event, excluding future finishes. Only original game finishing places count.'):'';
 const contrib=selected?part('Top Five Combined Contributors',
   '<div class="table-wrap"><table class="flash-history-table"><thead><tr><th>#</th><th>Player</th><th>Combined lines</th><th>Recorded PFs</th><th>Historic day rank</th></tr></thead><tbody>'+
   days.slice(0,5).map((r,i)=>'<tr class="'+(i===0?'flash-history-highlight':'')+'"><td>'+(i+1)+'</td><td>'+esc(r.player)+'</td><td>'+fmt(r.lines)+'</td><td>'+fmt(r.flashCount)+'/4</td><td>'+fmt(r.allRank)+'/'+fmt(r.allCount)+'</td></tr>').join('')+
   '</tbody></table></div>','Day rankings include all recorded player-days. Coverage shows whether all four PF results are present.'):'';
 const top10=selected?part('Top Ten Single-Race Lines — Selected Flash Set',
   '<div class="table-wrap"><table class="flash-history-table"><thead><tr><th>#</th><th>Player</th><th>Flash</th><th>Lines</th><th>All-time single rank</th></tr></thead><tbody>'+
   singles.slice(0,10).map((r,i)=>'<tr class="'+(i===0?'flash-history-highlight':'')+'"><td>'+(i+1)+'</td><td>'+esc(r.player)+'</td><td>PF'+r.flash+'</td><td>'+fmt(r.lines)+'</td><td>'+fmt(r.allRank)+'/'+fmt(r.allCount)+'</td></tr>').join('')+
   '</tbody></table></div>','A player can appear multiple times. Ranks count '+fmt(h.coverage.singleResults)+' tracked AVENGERS single-Flash results.'):'';
 const metrics=[
  ['Above prior single-Flash average',fmt(above.length)+'/'+fmt(base.length),'Recorded finishes with a historical baseline'],
  ['Above prior Flash Set day-total average',fmt(aboveDays.length)+'/'+fmt(comparable.length),'Earlier recorded day totals; 1–4 PFs qualify'],
  ['New PF-specific line PBs',fmt(pb.filter(x=>x.pfPB).length),'Previous best within the same PF designation'],
  ['New all-PF single-race PBs',fmt(pb.filter(x=>x.singlePB).length),'Previous best across all PF1–PF4 races'],
  ['New Flash Set daily-total line PBs',fmt(dayPB.length),'Beat prior day total regardless of PF count'],
  ['First tracked Flash appearances',fmt(new Set(pb.filter(x=>x.firstTracked).map(x=>x.player)).size),'First recorded Flash results are not automatically PBs']
 ];
 const pbSection=selected?part('PBs & Prior-Average Comparisons','<div class="flash-history-metrics">'+metrics.map(x=>
  '<div class="flash-history-card"><b>'+esc(x[1])+'</b><strong>'+esc(x[0])+'</strong><small>'+esc(x[2])+'</small></div>').join('')+'</div>'):'';
 const milestones=selected?part('Combined-Line Milestones','<div class="flash-history-metrics">'+
   [1000,3000,5000,10000].map(t=>'<div class="flash-history-card"><b>'+
   fmt(days.filter(d=>d.lines>=t).length)+'</b><strong>'+fmt(t)+'+ lines</strong>'+
   '<small>Distinct AVENGERS players · recorded PF results summed for selected Flash Set</small></div>').join('')+
   '</div>'):'';
 const pbHighlights=selected?part('New Tracked PB Details','<details class="flash-history-archive"><summary>View PB improvements by player and Flash</summary>'+
   '<div class="table-wrap"><table class="flash-history-table"><thead><tr><th>Player</th><th>PF</th><th>Lines</th><th>PF record</th><th>All-PF record</th></tr></thead><tbody>'+
   (pb.filter(x=>x.pfPB||x.singlePB).sort((a,b)=>b.lines-a.lines).map(x=>'<tr><td>'+esc(x.player)+'</td><td>PF'+x.flash+'</td><td>'+fmt(x.lines)+'</td><td>'+
   (x.pfPB?fmt(x.oldPfBest)+' → '+fmt(x.lines):'—')+'</td><td>'+
   (x.singlePB?fmt(x.oldSingleBest)+' → '+fmt(x.lines):'—')+'</td></tr>').join('')||
   '<tr><td colspan="5">No prior tracked single-race records beaten in this selection.</td></tr>')+
   '</tbody></table></div></details>'+
   '<details class="flash-history-archive"><summary>View Flash Set daily-total PB improvements</summary>'+
   '<div class="table-wrap"><table class="flash-history-table"><thead><tr><th>Player</th><th>Prior daily PB</th><th>New daily PB</th></tr></thead><tbody>'+
   (dayPB.map(x=>'<tr><td>'+esc(x.player)+'</td><td>'+fmt(x.priorPB)+'</td><td>'+fmt(x.lines)+'</td></tr>').join('')||
   '<tr><td colspan="3">No previous recorded daily total was beaten.</td></tr>')+
   '</tbody></table></div></details>','First tracked appearances are excluded from new PB counts.'):'';

 const potsHeader=hdr('pots','date','Date')+hdr('pots','flash','PF')+hdr('pots','potStars','Pot Stars')+hdr('pots','awardedStars','AVENGERS Stars')+hdr('pots','rakePercent','Est. rake')+hdr('pots','pfRank','PF rank')+hdr('pots','overallRank','All PF rank')+'<th>Lobby</th>';
 const potRows=sortBy(h.pots,'pots').map(r=>'<tr data-hist-row data-hist-text="'+esc((r.date+' PF'+r.flash+' '+r.lobby).toLowerCase())+'"><td>'+esc(r.date)+'</td><td>PF'+r.flash+'</td><td>'+fmt(r.potStars)+'</td><td>'+fmt(r.awardedStars)+'</td><td>'+pct(r.rakePercent)+'</td><td>'+fmt(r.pfRank)+'/'+fmt(r.pfCount)+'</td><td>'+fmt(r.overallRank)+'/'+fmt(r.overallCount)+'</td><td>'+esc(r.lobby)+'</td></tr>').join('');
 const dayHeader=hdr('days','setId','Flash Set')+hdr('days','player','Player')+hdr('days','lines','Total lines')+hdr('days','flashCount','PF results')+hdr('days','allRank','All-time rank')+'<th>Coverage</th>';
 const dayRows=sortBy(h.days,'days').map(r=>'<tr data-hist-row data-hist-text="'+esc((r.setId+' '+r.player).toLowerCase())+'"><td>'+esc(r.setId.slice(0,10))+'</td><td>'+esc(r.player)+'</td><td>'+fmt(r.lines)+'</td><td>'+fmt(r.flashCount)+'/4</td><td>'+fmt(r.allRank)+'/'+fmt(r.allCount)+'</td><td>'+(r.complete?'Complete 4/4':'Partial / recorded only')+'</td></tr>').join('');
 const singleHeader=hdr('singles','date','Date')+hdr('singles','player','Player')+hdr('singles','flash','PF')+hdr('singles','lines','Lines')+hdr('singles','allRank','All-time rank')+'<th>Original rank</th>';
 const singleRows=sortBy(h.singles,'singles').map(r=>'<tr data-hist-row data-hist-text="'+esc((r.date+' '+r.player+' PF'+r.flash).toLowerCase())+'"><td>'+esc(r.date)+'</td><td>'+esc(r.player)+'</td><td>PF'+r.flash+'</td><td>'+fmt(r.lines)+'</td><td>'+fmt(r.allRank)+'/'+fmt(r.allCount)+'</td><td>'+fmt(r.finish)+'</td></tr>').join('');
 host.innerHTML='<div class="flash-history-scope"><strong>AVENGERS historical Flash statistics</strong> · PNG source metrics; AV-2 excluded.</div>'+
  card+podium+contrib+top10+pbSection+pbHighlights+milestones+part('Historical Ranking Tables',
  archive('pots','Lobby Pot History',fmt(h.coverage.potsRecorded)+' of '+fmt(h.coverage.sourceEvents)+' Flash source events have main-lobby pot headers. Rankings span all recorded PFs; secondary lobby pots can be backfilled.',potsHeader,potRows,h.pots.length)+
  archive('days','Historical Combined-Day Lines','Rank includes observed partial days; the PF results column identifies incomplete coverage.',dayHeader,dayRows,h.days.length)+
  archive('singles','Historical Single-Race Lines','Each player-race is ranked separately. Players may appear multiple times in a Flash Set.',singleHeader,singleRows,h.singles.length),
  'Recorded history only; rankings and denominators update as earlier source results are added.');
 host.querySelectorAll('details[data-hist-open]').forEach(d=>d.addEventListener('toggle',()=>state.open[d.dataset.histOpen]=d.open));
 host.querySelectorAll('[data-hist-sort]').forEach(btn=>btn.addEventListener('click',()=>{
  const kind=btn.dataset.histSort,col=btn.dataset.histKey,old=state.sort[kind];
  state.sort[kind]=[col,old[0]===col?-old[1]:-1];state.open[kind]=true;
  render(host,events,day,tab,resolve);
 }));
 host.querySelectorAll('input[data-hist-search]').forEach(input=>{
  const filter=()=>{const val=input.value.trim().toLowerCase();state.q[input.dataset.histSearch]=input.value;
   input.closest('details').querySelectorAll('tr[data-hist-row]').forEach(tr=>tr.hidden=!tr.dataset.histText.includes(val));};
  input.addEventListener('input',filter);filter();
 });
}
const api=Object.freeze({render});
if(root)root.AVENGERS_FLASH_HISTORY_VIEW=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?null:window);
