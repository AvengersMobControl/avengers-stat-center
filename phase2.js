
(function(){
  'use strict';
  var D = window.AVENGERS_DATA;
  if(!D) return;

  var arenaStart = (D.meta && D.meta.arenaStart) || '2026-08-01';
  var memberByName = {};
  (D.members || []).forEach(function(m){ memberByName[m.name] = m; });
  // Player search includes every tracked profile, including historical/inactive members.
  // Roster filters still control trend/roster calculations separately.
  var allNames = Array.from(new Set(
    (D.members || [])
      .map(function(m){ return m.name; })
      .filter(Boolean)
  )).sort(function(a,b){ return a.localeCompare(b); });

  var colors = ['#43d7ff','#a476ff','#5fe28b','#ffd35c','#ff9a55','#ff6b78'];
  var trendState = {
    kind:'piggy',
    metric:'primary',
    scope:'arena',
    roster:'active',
    selected:[]
  };
  var explorerPlayer = '';

  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch];
    });
  }
  function num(v,d){
    var n=Number(v)||0;
    return n.toLocaleString(undefined,{minimumFractionDigits:d||0,maximumFractionDigits:d||0});
  }
  function dateLabel(s){
    if(!s) return '';
    var p=s.split('-');
    return Number(p[1])+'/'+Number(p[2]);
  }
  function longDate(s){
    if(!s) return '';
    var x=new Date(s+'T12:00:00');
    return x.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
  }
  function statusFor(name){
    return memberByName[name] ? memberByName[name].status : '';
  }
  function rosterOK(name, roster){
    var st=statusFor(name);
    if(roster==='active') return st==='Active';
    if(roster==='av2') return st==='AV2';
    if(roster==='current') return st==='Active' || st==='AV2';
    return true;
  }
  function metricKey(){
    if(trendState.kind==='piggy') return trendState.metric==='stars' ? 'stars' : 'lines';
    return trendState.metric==='stars' ? 'stars' : 'yearsB';
  }
  function metricLabel(){
    if(trendState.kind==='piggy') return trendState.metric==='stars' ? 'Stars' : 'Lines';
    return trendState.metric==='stars' ? 'Stars' : 'Lightyears (B)';
  }
  function fmtMetric(v){
    if(trendState.kind==='space' && trendState.metric!=='stars') return num(v,1);
    return num(v,0);
  }
  function avg(a){
    if(!a.length) return 0;
    return a.reduce(function(s,x){return s+(Number(x)||0);},0)/a.length;
  }
  function std(a){
    if(a.length<2) return 0;
    var m=avg(a);
    return Math.sqrt(avg(a.map(function(x){ return Math.pow(x-m,2); })));
  }
  function changeText(v){
    if(v==null || !isFinite(v)) return '<span class="p2-change flat">—</span>';
    var cls=v>0.0005?'up':(v<-0.0005?'down':'flat');
    var sign=v>0?'+':'';
    return '<span class="p2-change '+cls+'">'+sign+(v*100).toFixed(1)+'%</span>';
  }
  function historyFor(kind,name){
    var h=((D[kind]||{}).history||{})[name] || [];
    return h.slice().sort(function(a,b){return a.date.localeCompare(b.date);});
  }
  function scopedHistory(kind,name){
    return historyFor(kind,name).filter(function(r){
      return trendState.scope==='all' || r.date>=arenaStart;
    });
  }
  function playerMetricHistory(name){
    var key=metricKey();
    return scopedHistory(trendState.kind,name).map(function(r){
      return {date:r.date,value:Number(r[key])||0,raw:r};
    }).filter(function(r){return r.value>0;});
  }
  function playerStats(name){
    var h=playerMetricHistory(name);
    var vals=h.map(function(r){return r.value;});
    var last3=vals.slice(-3);
    var prior3=vals.slice(-6,-3);
    var a3=avg(last3);
    var p3=avg(prior3);
    return {
      name:name,
      events:vals.length,
      average:avg(vals),
      last3:a3,
      prior3:p3,
      delta:p3>0?(a3-p3)/p3:null,
      pb:vals.length?Math.max.apply(null,vals):0,
      stdev:std(vals),
      cv:avg(vals)>0?std(vals)/avg(vals):0
    };
  }
  function eventSeries(){
    var events=((D[trendState.kind]||{}).events)||{};
    var key=metricKey();
    return Object.keys(events).sort().filter(function(date){
      return trendState.scope==='all' || date>=arenaStart;
    }).map(function(date){
      var rows=(events[date]||[]).filter(function(r){
        return r && r.name && r.name!=='Total' && r.name!=='#N/A' && rosterOK(r.name,trendState.roster) && (Number(r[key])||0)>0;
      });
      var vals=rows.map(function(r){return Number(r[key])||0;});
      return {date:date,average:avg(vals),total:vals.reduce(function(s,x){return s+x;},0),players:vals.length};
    }).filter(function(x){return x.players>0;});
  }
  function lineChart(series,height,formatter){
    height=height||260;
    formatter=formatter||fmtMetric;
    var width=760,padL=60,padR=20,padT=18,padB=35;
    var all=[];
    series.forEach(function(s){s.points.forEach(function(p){if(p.value>0)all.push(p);});});
    if(!all.length) return '<div class="p2-empty">No data for this selection.</div>';
    var dates=all.map(function(p){return p.date;}).sort();
    var minDate=dates[0],maxDate=dates[dates.length-1];
    var minT=new Date(minDate+'T12:00:00').getTime(), maxT=new Date(maxDate+'T12:00:00').getTime();
    if(maxT===minT) maxT=minT+86400000;
    var maxV=Math.max.apply(null,all.map(function(p){return p.value;}));
    var minV=0;
    if(maxV<=0)maxV=1;
    var plotW=width-padL-padR,plotH=height-padT-padB;
    function x(date){return padL+((new Date(date+'T12:00:00').getTime()-minT)/(maxT-minT))*plotW;}
    function y(v){return padT+(1-(v-minV)/(maxV-minV))*plotH;}
    var svg='<svg viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Trend chart">';
    for(var i=0;i<=4;i++){
      var yy=padT+(plotH*i/4);
      var val=maxV*(1-i/4);
      svg+='<line x1="'+padL+'" y1="'+yy+'" x2="'+(width-padR)+'" y2="'+yy+'" class="p2-gridline"/>';
      svg+='<text x="'+(padL-8)+'" y="'+(yy+4)+'" text-anchor="end" class="p2-axis-label">'+esc(formatter(val))+'</text>';
    }
    svg+='<line x1="'+padL+'" y1="'+(padT+plotH)+'" x2="'+(width-padR)+'" y2="'+(padT+plotH)+'" class="p2-axis"/>';
    var ticks=[minDate,dates[Math.floor((dates.length-1)/2)],maxDate];
    ticks.forEach(function(d,idx){
      var xx=x(d);
      var anchor=idx===0?'start':(idx===2?'end':'middle');
      svg+='<text x="'+xx+'" y="'+(height-8)+'" text-anchor="'+anchor+'" class="p2-axis-label">'+esc(dateLabel(d))+'</text>';
    });
    series.forEach(function(s,si){
      var pts=s.points.filter(function(p){return p.value>0;}).sort(function(a,b){return a.date.localeCompare(b.date);});
      if(!pts.length)return;
      var c=s.color||colors[si%colors.length];
      var d=pts.map(function(p,idx){return (idx?'L':'M')+x(p.date).toFixed(1)+','+y(p.value).toFixed(1);}).join(' ');
      svg+='<path d="'+d+'" class="p2-line" stroke="'+c+'"/>';
      pts.forEach(function(p,pi){
        var px=x(p.date),py=y(p.value);
        var labelY=Math.max(11,py-7-(si%3)*9);
        svg+='<circle cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="4" class="p2-dot" stroke="'+c+'"><title>'+esc(s.name)+' — '+esc(longDate(p.date))+': '+esc(formatter(p.value))+'</title></circle>';
        svg+='<text x="'+px.toFixed(1)+'" y="'+labelY.toFixed(1)+'" text-anchor="middle" class="p2-value-label">'+esc(formatter(p.value))+'</text>';
      });
    });
    svg+='</svg>';
    var legend='<div class="p2-legend">'+series.map(function(s,si){
      return '<span class="p2-legend-item"><span class="p2-swatch" style="background:'+(s.color||colors[si%colors.length])+'"></span>'+esc(s.name)+'</span>';
    }).join('')+'</div>';
    return '<div class="p2-chart">'+svg+'</div>'+legend;
  }

  function defaultPlayers(){
    var source=trendState.kind==='piggy'?(D.piggy.overall||[]):(D.space.overall||[]);
    var sorted=source.filter(function(x){return rosterOK(x.name,'current');}).slice().sort(function(a,b){
      var av=trendState.kind==='piggy'?(Number(a.avgArena)||0):(Number(a.avgYears)||0);
      var bv=trendState.kind==='piggy'?(Number(b.avgArena)||0):(Number(b.avgYears)||0);
      return bv-av;
    });
    return sorted.slice(0,3).map(function(x){return x.name;});
  }

  function renderTrends(){
    var root=document.getElementById('trendsContent');
    if(!root)return;
    if(!trendState.selected.length) trendState.selected=defaultPlayers();

    var es=eventSeries();
    var latest=es.length?es[es.length-1]:null;
    var prev=es.length>1?es[es.length-2]:null;
    var peak=es.length?Math.max.apply(null,es.map(function(x){return x.average;})):0;
    var ch=latest&&prev&&prev.average>0?(latest.average-prev.average)/prev.average:null;

    var playerRows=allNames.filter(function(n){return rosterOK(n,trendState.roster);}).map(playerStats)
      .filter(function(x){return x.events>0;})
      .sort(function(a,b){return b.last3-a.last3;});

    var clanSeries=[{name:'Clan average',color:'#43d7ff',points:es.map(function(x){return {date:x.date,value:x.average};})}];
    var playerSeries=trendState.selected.map(function(name,idx){
      return {name:name,color:colors[idx%colors.length],points:playerMetricHistory(name)};
    }).filter(function(s){return s.points.length;});

    var metricOptions = trendState.kind==='piggy'
      ? '<option value="primary" '+(trendState.metric==='primary'?'selected':'')+'>Lines</option><option value="stars" '+(trendState.metric==='stars'?'selected':'')+'>Stars</option>'
      : '<option value="primary" '+(trendState.metric==='primary'?'selected':'')+'>Lightyears (B)</option><option value="stars" '+(trendState.metric==='stars'?'selected':'')+'>Stars</option>';

    var nameOptions=allNames.map(function(n){return '<option value="'+esc(n)+'"></option>';}).join('');
    var chips=trendState.selected.map(function(n){
      return '<span class="p2-chip">'+esc(n)+'<button type="button" data-remove-trend="'+esc(n)+'" aria-label="Remove '+esc(n)+'">×</button></span>';
    }).join('');

    var rows=playerRows.slice(0,60).map(function(r,idx){
      return '<tr>'+
        '<td class="num">'+(idx+1)+'</td>'+
        '<td><button class="p2-player-link" data-p2-player="'+esc(r.name)+'">'+esc(r.name)+'</button></td>'+
        '<td class="num">'+fmtMetric(r.last3)+'</td>'+
        '<td class="num">'+fmtMetric(r.average)+'</td>'+
        '<td class="num">'+fmtMetric(r.pb)+'</td>'+
        '<td class="num">'+r.events+'</td>'+
        '<td class="num">'+changeText(r.delta)+'</td>'+
        '<td class="num">'+(r.cv*100).toFixed(1)+'%</td>'+
      '</tr>';
    }).join('');

    var recentEvents=es.slice(-12).reverse();
    var maxRecent=recentEvents.length?Math.max.apply(null,recentEvents.map(function(x){return x.average;})):1;
    var eventBars=recentEvents.map(function(x){
      var w=maxRecent?Math.max(2,x.average/maxRecent*100):0;
      return '<div class="p2-event-bar"><span>'+esc(dateLabel(x.date))+'</span><div class="p2-event-track"><div class="p2-event-fill" style="width:'+w.toFixed(1)+'%"></div></div><strong>'+esc(fmtMetric(x.average))+'</strong></div>';
    }).join('');

    root.innerHTML=
      '<div class="p2-toolbar">'+
        '<div class="p2-field"><label>Event</label><select id="p2TrendKind"><option value="piggy" '+(trendState.kind==='piggy'?'selected':'')+'>Piggy Race</option><option value="space" '+(trendState.kind==='space'?'selected':'')+'>Space Race</option></select></div>'+
        '<div class="p2-field"><label>Metric</label><select id="p2TrendMetric">'+metricOptions+'</select></div>'+
        '<div class="p2-field"><label>Time range</label><select id="p2TrendScope"><option value="arena" '+(trendState.scope==='arena'?'selected':'')+'>Arena era</option><option value="all" '+(trendState.scope==='all'?'selected':'')+'>All 2026 history</option></select></div>'+
        '<div class="p2-field"><label>Roster</label><select id="p2TrendRoster"><option value="active" '+(trendState.roster==='active'?'selected':'')+'>AVENGERS</option><option value="av2" '+(trendState.roster==='av2'?'selected':'')+'>AV-2</option><option value="all" '+(trendState.roster==='all'?'selected':'')+'>All tracked</option></select></div>'+
      '</div>'+
      '<div class="p2-kpis">'+
        '<div class="p2-kpi"><div class="label">Latest clan avg</div><div class="value">'+(latest?fmtMetric(latest.average):'—')+'</div><div class="note">'+(latest?longDate(latest.date):'No event')+' · '+esc(metricLabel())+'</div></div>'+
        '<div class="p2-kpi"><div class="label">Peak event avg</div><div class="value">'+fmtMetric(peak)+'</div><div class="note">'+(trendState.scope==='arena'?'Since '+longDate(arenaStart):'All available events')+'</div></div>'+
        '<div class="p2-kpi"><div class="label">Change vs prior event</div><div class="value">'+changeText(ch)+'</div><div class="note">Clan average</div></div>'+
        '<div class="p2-kpi"><div class="label">Latest participants</div><div class="value">'+(latest?latest.players:0)+'</div><div class="note">'+esc(trendState.roster==='active'?'AVENGERS':(trendState.roster==='av2'?'AV-2':'All tracked'))+'</div></div>'+
      '</div>'+
      '<div class="p2-grid">'+
        '<div class="card"><div class="card-header"><div><div class="p2-section-title">Clan Trend</div><div class="p2-section-sub">Average '+esc(metricLabel())+' by event</div></div></div><div class="card-body">'+lineChart(clanSeries,280)+'</div></div>'+
        '<div class="card"><div class="card-header"><div><div class="p2-section-title">Recent Events</div><div class="p2-section-sub">Event average · '+esc(metricLabel())+'</div></div></div><div class="card-body"><div class="p2-event-bars">'+eventBars+'</div></div></div>'+
      '</div>'+
      '<div class="card p2-full">'+
        '<div class="card-header"><div><div class="p2-section-title">Player Comparison</div><div class="p2-section-sub">Add up to 6 players to compare event-by-event</div></div></div>'+
        '<div class="card-body">'+
          '<div class="p2-add-row"><input id="p2TrendPlayerInput" list="p2TrendPlayerList" placeholder="Search a player…"><datalist id="p2TrendPlayerList">'+nameOptions+'</datalist><button class="p2-primary-btn" id="p2AddTrendPlayer">Add player</button></div>'+
          '<div class="p2-chip-row">'+chips+'</div>'+
          lineChart(playerSeries,300)+
        '</div>'+
      '</div>'+
      '<div class="table-card">'+
        '<div class="table-titlebar"><div><h2>Recent Form Rankings</h2><div class="small-muted">Sorted by last 3 average · change compares last 3 with the previous 3 · CV is standard deviation ÷ average</div></div></div>'+
        '<div class="p2-table-scroll"><table><thead><tr><th>#</th><th>Player</th><th class="num">Last 3</th><th class="num">Avg</th><th class="num">PB</th><th class="num">Events</th><th class="num">L3 vs prior 3</th><th class="num">CV</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
      '</div>';

    bindTrendControls();
  }

  function bindTrendControls(){
    var kind=document.getElementById('p2TrendKind');
    var metric=document.getElementById('p2TrendMetric');
    var scope=document.getElementById('p2TrendScope');
    var roster=document.getElementById('p2TrendRoster');
    if(kind)kind.onchange=function(){
      trendState.kind=this.value;
      trendState.metric='primary';
      trendState.selected=[];
      renderTrends();
    };
    if(metric)metric.onchange=function(){trendState.metric=this.value;renderTrends();};
    if(scope)scope.onchange=function(){trendState.scope=this.value;renderTrends();};
    if(roster)roster.onchange=function(){trendState.roster=this.value;trendState.selected=trendState.selected.filter(function(n){return rosterOK(n,trendState.roster);});renderTrends();};
    var add=document.getElementById('p2AddTrendPlayer');
    var input=document.getElementById('p2TrendPlayerInput');
    function addPlayer(){
      if(!input)return;
      var raw=input.value.trim();
      var name=allNames.find(function(n){return n.toLowerCase()===raw.toLowerCase();});
      if(!name)return;
      if(trendState.selected.indexOf(name)<0 && trendState.selected.length<6) trendState.selected.push(name);
      input.value='';
      renderTrends();
    }
    if(add)add.onclick=addPlayer;
    if(input)input.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();addPlayer();}};
    document.querySelectorAll('[data-remove-trend]').forEach(function(b){
      b.onclick=function(){var n=this.getAttribute('data-remove-trend');trendState.selected=trendState.selected.filter(function(x){return x!==n;});renderTrends();};
    });
    document.querySelectorAll('#trendsContent [data-p2-player]').forEach(function(b){
      b.onclick=function(){openExplorer(this.getAttribute('data-p2-player'));};
    });
  }

  function playerHeaderStats(name){
    var m=memberByName[name] || {name:name,status:''};
    var ph=historyFor('piggy',name);
    var pah=ph.filter(function(x){return x.date>=arenaStart;});
    var sh=historyFor('space',name);
    var pvals=pah.map(function(x){return Number(x.lines)||0;}).filter(Boolean);
    var svals=sh.map(function(x){return Number(x.yearsB)||0;}).filter(Boolean);
    var l3=avg(pvals.slice(-3));
    var p3=avg(pvals.slice(-6,-3));
    return {
      member:m,
      piggyArena:pvals,
      space:svals,
      piggyL3:l3,
      piggyPrior3:p3,
      piggyDelta:p3>0?(l3-p3)/p3:null
    };
  }
  function simpleChart(kind,name,key,label,color){
    var pts=historyFor(kind,name).map(function(r){return {date:r.date,value:Number(r[key])||0};}).filter(function(r){return r.value>0;});
    return lineChart([{name:label,color:color,points:pts}],230);
  }
  function historyTable(kind,name){
    var key=kind==='piggy'?'lines':'yearsB';
    var h=historyFor(kind,name).slice().reverse().slice(0,14);
    if(!h.length)return '<div class="p2-empty">No '+(kind==='piggy'?'Piggy':'Space')+' history.</div>';
    return '<div class="p2-history"><table><thead><tr><th>Date</th><th class="num">'+(kind==='piggy'?'Lines':'Lightyears (B)')+'</th><th class="num">Stars</th></tr></thead><tbody>'+
      h.map(function(r){return '<tr><td>'+esc(longDate(r.date))+'</td><td class="num">'+(kind==='piggy'?num(r[key],0):num(r[key],1))+'</td><td class="num">'+num(r.stars,0)+'</td></tr>';}).join('')+
      '</tbody></table></div>';
  }

  function krakenPlayerFor(name){
    var K=window.AVENGERS_KRAKEN_DATA||{players:[],months:[]};
    var aliases=D.aliasMap||{};
    return (K.players||[]).find(function(p){
      return p.name===name || aliases[p.name]===name || aliases[name]===p.name;
    }) || null;
  }
  function krakenHistoryFor(name){
    var K=window.AVENGERS_KRAKEN_DATA||{players:[],months:[]};
    var p=krakenPlayerFor(name);
    if(!p)return [];
    var monthNo={jan:'01',january:'01',feb:'02',february:'02',mar:'03',march:'03',apr:'04',april:'04',may:'05',jun:'06',june:'06',jul:'07',july:'07',aug:'08',august:'08',sep:'09',sept:'09',september:'09',oct:'10',october:'10',nov:'11',november:'11',dec:'12',december:'12'};
    return (K.months||[]).map(function(m){
      var v=Number(p[m.key])||0;
      var key=String(m.key||m.label||'').toLowerCase();
      return {
        key:m.key,
        label:m.label||m.key,
        date:'2026-'+(monthNo[key]||'01')+'-01',
        value:v
      };
    }).filter(function(x){return x.value>0;});
  }
  function krakenChart(name){
    var h=krakenHistoryFor(name);
    if(!h.length)return '<div class="p2-empty">No Kraken history.</div>';
    return lineChart([{name:'Kraken score',color:'#ffb454',points:h.map(function(r){return {date:r.date,value:r.value};})}],230,function(v){return num(v,0);});
  }
  function krakenHistoryTable(name){
    var h=krakenHistoryFor(name).slice().reverse();
    if(!h.length)return '<div class="p2-empty">No Kraken event history.</div>';
    var pb=Math.max.apply(null,h.map(function(r){return r.value;}));
    return '<div class="p2-history"><table><thead><tr><th>Event</th><th class="num">Score</th><th class="num">% of PB</th></tr></thead><tbody>'+
      h.map(function(r){return '<tr><td>'+esc(r.label)+' 2026</td><td class="num">'+num(r.value,0)+'</td><td class="num">'+(pb?((r.value/pb)*100).toFixed(1)+'%':'—')+'</td></tr>';}).join('')+
      '</tbody></table></div>';
  }

  function profileMetricValue(name,key){
    var m=memberByName[name]||{};
    var s=playerHeaderStats(name);
    var kp=krakenPlayerFor(name);
    if(key==='piggyPB') return Number(m.piggyPB)||0;
    if(key==='piggyAvg') return Number(m.piggyAvg)||0;
    if(key==='piggyL3') return Number(s.piggyL3)||0;
    if(key==='piggyDelta') return s.piggyDelta;
    if(key==='spacePB') return Number(m.spacePB)||0;
    if(key==='spaceAvg') return Number(m.spaceAvg)||0;
    if(key==='krakenPB') return kp?(Number(kp.pb)||0):(Number(m.krakenPB)||0);
    if(key==='krakenL3') return kp?(Number(kp.last3)||0):(Number(m.krakenAvgL3)||0);
    if(key==='rating') return Number(m.ratingTotal)||0;
    if(key==='events') return Number(m.eventsPlayed)||0;
    if(key==='sparks') return Number(m.totalSparks)||0;
    return null;
  }

  function profileMetricHasValue(key,value){
    if(value==null || !isFinite(Number(value))) return false;
    if(key==='piggyDelta') return true;
    return Number(value)>0;
  }

  function profileMetricRank(name,key){
    var value=profileMetricValue(name,key);
    if(!profileMetricHasValue(key,value)) return null;

    var allValues=allNames.map(function(n){return profileMetricValue(n,key);})
      .filter(function(v){return profileMetricHasValue(key,v);});
    var activeNames=allNames.filter(function(n){return statusFor(n)==='Active';});
    var activeValues=activeNames.map(function(n){return profileMetricValue(n,key);})
      .filter(function(v){return profileMetricHasValue(key,v);});

    function rankIn(values){
      return 1+values.filter(function(v){return Number(v)>Number(value);}).length;
    }

    return {
      allRank:rankIn(allValues),
      allCount:allValues.length,
      activeRank:statusFor(name)==='Active'?rankIn(activeValues):null,
      activeCount:activeValues.length
    };
  }

  function profileRankNote(name,key){
    var r=profileMetricRank(name,key);
    if(!r) return '<div class="p2-rank-note"><span>Active —</span><span>All-time —</span></div>';
    var active=r.activeRank!=null?'Active #'+r.activeRank+'/'+r.activeCount:'Active n/a';
    return '<div class="p2-rank-note"><span class="p2-rank-active">'+active+'</span><span class="p2-rank-all">All-time #'+r.allRank+'/'+r.allCount+'</span></div>';
  }

  function renderExplorer(name){
    var root=document.getElementById('p2ExplorerProfile');
    if(!root)return;
    if(!name || allNames.indexOf(name)<0){
      root.innerHTML='<div class="p2-empty">Choose a player to view their complete profile.</div>';
      return;
    }
    explorerPlayer=name;
    var s=playerHeaderStats(name),m=s.member;
    var kp=krakenPlayerFor(name);
    var piggyPB=Number(m.piggyPB)||0,spacePB=Number(m.spacePB)||0,krakenPB=kp?(Number(kp.pb)||0):(Number(m.krakenPB)||0);
    var piggyAvg=Number(m.piggyAvg)||0,spaceAvg=Number(m.spaceAvg)||0,krakenL3=kp?(Number(kp.last3)||0):(Number(m.krakenAvgL3)||0);
    var rating=Number(m.ratingTotal)||0;
    root.innerHTML=
      '<div class="p2-profile">'+
        '<div class="p2-profile-head"><div class="p2-avatar">'+esc(name.replace(/^AV[-.#<]*/i,'').slice(0,2).toUpperCase())+'</div><div><div class="p2-profile-name">'+esc(name)+'</div><div class="profile-status"><span class="status '+(String(m.status||'inactive').toLowerCase()==='active'?'active':(String(m.status||'').toLowerCase()==='av2'?'av2':'inactive'))+'">'+esc(m.status||'Historical')+'</span></div></div><div class="p2-profile-actions"><button class="p2-secondary-btn" id="p2ComparePlayer">Compare in Trends</button></div></div>'+
        '<div class="p2-profile-kpis">'+
          '<div class="p2-profile-kpi"><span>Piggy PB</span><strong>'+num(piggyPB,0)+'</strong>'+profileRankNote(name,'piggyPB')+'</div>'+
          '<div class="p2-profile-kpi"><span>Piggy Arena Avg</span><strong>'+num(piggyAvg,0)+'</strong>'+profileRankNote(name,'piggyAvg')+'</div>'+
          '<div class="p2-profile-kpi"><span>Piggy Last 3</span><strong>'+num(s.piggyL3,0)+'</strong>'+profileRankNote(name,'piggyL3')+'</div>'+
          '<div class="p2-profile-kpi"><span>L3 vs Prior 3</span><strong>'+changeText(s.piggyDelta)+'</strong>'+profileRankNote(name,'piggyDelta')+'</div>'+
          '<div class="p2-profile-kpi"><span>Space PB</span><strong>'+num(spacePB,1)+'</strong>'+profileRankNote(name,'spacePB')+'</div>'+
          '<div class="p2-profile-kpi"><span>Space Avg</span><strong>'+num(spaceAvg,1)+'</strong>'+profileRankNote(name,'spaceAvg')+'</div>'+
          '<div class="p2-profile-kpi"><span>Kraken PB</span><strong>'+num(krakenPB,0)+'</strong>'+profileRankNote(name,'krakenPB')+'</div>'+
          '<div class="p2-profile-kpi"><span>Kraken Avg L3</span><strong>'+num(krakenL3,0)+'</strong>'+profileRankNote(name,'krakenL3')+'</div>'+
          '<div class="p2-profile-kpi"><span>Player Rating</span><strong>'+num(rating,2)+'</strong>'+profileRankNote(name,'rating')+'</div>'+
          '<div class="p2-profile-kpi"><span>Events Logged</span><strong>'+num(m.eventsPlayed||0,0)+'</strong>'+profileRankNote(name,'events')+'</div>'+
          '<div class="p2-profile-kpi"><span>Total Sparks</span><strong>'+num(m.totalSparks||0,0)+'</strong>'+profileRankNote(name,'sparks')+'</div>'+
        '</div>'+
        '<div class="p2-profile-grid">'+
          '<div class="p2-mini-card"><h3>Piggy Race History</h3>'+simpleChart('piggy',name,'lines','Lines','#43d7ff')+'</div>'+
          '<div class="p2-mini-card"><h3>Space Race History</h3>'+simpleChart('space',name,'yearsB','Lightyears (B)','#a476ff')+'</div>'+
          '<div class="p2-mini-card"><h3>Kraken Score History</h3>'+krakenChart(name)+'</div>'+
          '<div class="p2-mini-card"><h3>Recent Piggy Events</h3>'+historyTable('piggy',name)+'</div>'+
          '<div class="p2-mini-card"><h3>Recent Space Events</h3>'+historyTable('space',name)+'</div>'+
          '<div class="p2-mini-card"><h3>Kraken Event Log</h3>'+krakenHistoryTable(name)+'</div>'+
        '</div>'+
      '</div>';
    var cmp=document.getElementById('p2ComparePlayer');
    if(cmp)cmp.onclick=function(){
      trendState.kind='piggy';trendState.metric='primary';trendState.selected=[name];
      var nb=document.querySelector('.nav-btn[data-page="trends"]');
      if(nb)nb.click();
      setTimeout(renderTrends,0);
    };
  }

  function initExplorer(){
    var page=document.getElementById('page-players');
    if(!page || document.getElementById('p2Explorer'))return;
    var dl=allNames.map(function(n){return '<option value="'+esc(n)+'"></option>';}).join('');
    var panel=document.createElement('div');
    panel.id='p2Explorer';
    panel.className='p2-explorer';
    panel.innerHTML=
      '<div class="p2-explorer-head">'+
        '<div class="p2-field"><label>Individual Player Search</label><input id="p2ExplorerInput" list="p2ExplorerList" placeholder="Type a player name…"><datalist id="p2ExplorerList">'+dl+'</datalist></div>'+
        '<button class="p2-primary-btn" id="p2ExplorerGo">View player</button>'+
      '</div>'+
      '<div id="p2ExplorerProfile"></div>';
    var before=page.querySelector('.players-toolbar');
    if(before)page.insertBefore(panel,before); else page.insertBefore(panel,page.firstChild);

    var input=document.getElementById('p2ExplorerInput');
    var go=document.getElementById('p2ExplorerGo');
    function pick(){
      var raw=(input&&input.value||'').trim();
      var name=allNames.find(function(n){return n.toLowerCase()===raw.toLowerCase();});
      if(name){renderExplorer(name);input.value=name;}
    }
    if(go)go.onclick=pick;
    if(input){
      input.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();pick();}};
      input.onchange=pick;
    }
    var preferred=(D.members||[]).slice().sort(function(a,b){return (Number(b.ratingTotal)||0)-(Number(a.ratingTotal)||0);})[0];
    if(preferred){input.value=preferred.name;renderExplorer(preferred.name);}
  }

  function openExplorer(name){
    var nav=document.querySelector('.nav-btn[data-page="players"]');
    if(nav)nav.click();
    setTimeout(function(){
      var input=document.getElementById('p2ExplorerInput');
      if(input)input.value=name;
      renderExplorer(name);
      var el=document.getElementById('p2Explorer');
      if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
    },0);
  }

  function enhanceOverview(){
    var root=document.getElementById('overviewContent');
    if(!root || document.getElementById('p2QuickFind'))return;
    var box=document.createElement('div');
    box.id='p2QuickFind';
    box.className='card p2-full';
    box.innerHTML='<div class="card-body"><div class="p2-explorer-head"><div><div class="p2-section-title">Player Explorer</div><div class="p2-section-sub">Jump straight to any tracked player profile, including inactive members.</div></div><div class="p2-field grow"><input id="p2QuickPlayer" list="p2QuickPlayerList" placeholder="Search player…"><datalist id="p2QuickPlayerList">'+allNames.map(function(n){return '<option value="'+esc(n)+'"></option>';}).join('')+'</datalist></div><button class="p2-primary-btn" id="p2QuickGo">Open profile</button></div></div>';
    root.insertBefore(box,root.firstChild);
    function go(){
      var inp=document.getElementById('p2QuickPlayer');
      var raw=(inp&&inp.value||'').trim();
      var name=allNames.find(function(n){return n.toLowerCase()===raw.toLowerCase();});
      if(name)openExplorer(name);
    }
    document.getElementById('p2QuickGo').onclick=go;
    document.getElementById('p2QuickPlayer').onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();go();}};
  }

  function init(){
    initExplorer();
    renderTrends();
    enhanceOverview();
    var tnav=document.querySelector('.nav-btn[data-page="trends"]');
    if(tnav)tnav.addEventListener('click',function(){setTimeout(renderTrends,0);});
    var onav=document.querySelector('.nav-btn[data-page="overview"]');
    if(onav)onav.addEventListener('click',function(){setTimeout(enhanceOverview,0);});
    var pnav=document.querySelector('.nav-btn[data-page="players"]');
    if(pnav)pnav.addEventListener('click',function(){setTimeout(initExplorer,0);});
  }

  init();
})();
