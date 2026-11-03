(function universalTableControls(){
  'use strict';
  const styleId='av-global-table-sort-style',done=new WeakSet(),collator=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
  const prefix='avengers-table-widths-v3:';
  const style=document.createElement('style');
  style.id=styleId;
  style.textContent=`
  table.av-universal-table{table-layout:fixed;width:max-content;min-width:100%}
  table.av-universal-table thead th.av-resizable-th{position:relative;white-space:normal;overflow-wrap:break-word;vertical-align:middle;padding-right:22px}
  table.av-universal-table thead th.global-sortable-th{cursor:pointer;user-select:none;-webkit-user-select:none;padding-right:42px}
  table.av-universal-table thead th.global-sortable-th:hover{color:#fff}
  table.av-universal-table thead th.global-sortable-th:focus-visible{outline:2px solid #79daff;outline-offset:-2px}
  table.av-universal-table thead th.global-sortable-th::after{content:'↕';position:absolute;right:22px;top:50%;transform:translateY(-50%);font-size:10px;opacity:.45;font-weight:900;pointer-events:none}
  table.av-universal-table thead th.global-sortable-th[aria-sort="ascending"]::after{content:'▲';opacity:1;color:var(--cyan,#43d7ff)}
  table.av-universal-table thead th.global-sortable-th[aria-sort="descending"]::after{content:'▼';opacity:1;color:var(--cyan,#43d7ff)}
  table.av-universal-table thead th .av-table-resize{position:absolute;right:0;top:0;bottom:0;width:17px;border:0;border-left:1px solid rgba(71,107,143,.6);background:rgba(44,80,110,.16);color:#a7cae1;cursor:col-resize;touch-action:none;user-select:none;z-index:5;padding:0;font:700 13px/1 sans-serif}
  table.av-universal-table thead th .av-table-resize:hover,table.av-universal-table thead th .av-table-resize:focus-visible{background:#346a8c;color:#fff;outline:2px solid #79daff;outline-offset:-2px}
  table.av-universal-table td{overflow:hidden;text-overflow:ellipsis}
  @media print{table.av-universal-table thead th .av-table-resize{display:none}table.av-universal-table thead th.global-sortable-th::after{display:none}}
  `;
  if(!document.getElementById(styleId))document.head.appendChild(style);
  function headers(table){
    if(!table.tHead)return {leaf:[],count:0};
    const grid=[],leaf=[];
    [...table.tHead.rows].forEach((row,r)=>{
      grid[r] ||= [];
      let x=0;
      for(const th of row.cells){
        while(grid[r][x])x++;
        const span=Math.max(1,th.colSpan||1),depth=Math.max(1,th.rowSpan||1);
        for(let ri=r;ri<r+depth;ri++){grid[ri] ||= [];for(let j=x;j<x+span;j++)grid[ri][j]=th;}
        if(span===1&&!th.classList.contains('roster-group-heading')&&th.scope!=='colgroup')leaf.push({th,index:x});
        x+=span;
      }
    });
    return {leaf,count:Math.max(0,...grid.map(r=>r.length))};
  }
  function label(th){
    const source=th.querySelector('[data-roster-sort],[data-hist-sort],[data-rating-sort]')||th;
    return String(source.textContent||'').replace(/[↕▲▼▾▸⋮]/g,'').replace(/\s+\d+\/\d+$/,'').trim();
  }
  function tableKey(table,leaf){
    const page=table.closest('.page,#playerModal')?.id||'shared';
    const title=table.closest('.table-card')?.querySelector('.table-titlebar h2')?.textContent||
      table.closest('.flash-history-panel')?.querySelector('h3')?.textContent||
      table.closest('details')?.querySelector(':scope > summary')?.textContent||'';
    const names=table.classList.contains('roster-grouped-table')?'grouped':leaf.map(({th})=>label(th)).join(',');
    const s=[page,table.className.replace('av-universal-table',''),title.replace(/\b\d{4}-\d{2}-\d{2}\b/g,'event'),names].join('|').toLowerCase();
    let n=2166136261;for(let i=0;i<s.length;i++){n^=s.charCodeAt(i);n=Math.imul(n,16777619);}
    return (n>>>0).toString(36);
  }
  function read(key){try{const x=JSON.parse(localStorage.getItem(prefix+key)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{};}catch{return {};}}
  function save(key,obj){try{localStorage.setItem(prefix+key,JSON.stringify(obj));}catch{}}
  function colId(th,i){return th.dataset.rosterColHead||th.dataset.ratingColHead||label(th).toLowerCase().replace(/\s+/g,'-').slice(0,64)||'col'+i;}
  function defaultWidth(th,i){
    const name=label(th).toLowerCase();
    if(i===0&&(name==='#'||name==='rank'||name==='place'))return 58;
    if(/^(member|player|username|name)$/.test(name))return 210;
    if(/status|event clan/.test(name))return 112;
    if(/total\s*\/\s*10|breakdown/.test(name))return 158;
    if(/date|event|achievement|metric|location|country|description/.test(name))return 145;
    return Math.max(90,Math.min(205,Math.round(name.length*5.6+75)));
  }
  function columns(table,count){
    let cg=table.querySelector(':scope > colgroup');
    if(!cg){cg=document.createElement('colgroup');table.insertBefore(cg,table.tHead);}
    while(cg.children.length<count)cg.appendChild(document.createElement('col'));
    return [...cg.children].slice(0,count);
  }
  function widthSet(table,cols,index,n){
    const min=index===0?52:72,px=Math.max(min,Math.min(440,Math.round(n)));
    if(!cols[index])return;
    cols[index].style.width=px+'px';
    table.style.width=cols.reduce((s,col)=>s+(parseFloat(col.style.width)||120),0)+'px';
    table.style.minWidth='100%';table.style.tableLayout='fixed';
  }
  function resizeGrip(table,th,index,cols,key,saved,id){
    if(th.querySelector('[data-roster-resize],[data-rating-resize],.av-table-resize'))return;
    const grip=document.createElement('button');
    grip.type='button';grip.className='av-table-resize';grip.dataset.avResize=String(index);
    grip.setAttribute('aria-label','Resize '+(label(th)||'column')+' column');
    grip.setAttribute('title','Drag to resize • arrow keys adjust width');grip.textContent='⋮';
    th.classList.add('av-resizable-th');th.appendChild(grip);
    const apply=n=>{widthSet(table,cols,index,n);saved[id]=parseFloat(cols[index].style.width);save(key,saved);};
    grip.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
      e.preventDefault();e.stopPropagation();
      apply((parseFloat(cols[index]?.style.width)||defaultWidth(th,index))+(e.key==='ArrowRight'?16:-16));
    });
    grip.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;
      e.preventDefault();e.stopPropagation();
      const x=e.clientX,w=parseFloat(cols[index]?.style.width)||defaultWidth(th,index),pid=e.pointerId;
      const move=ev=>{if(ev.pointerId===pid)apply(w+ev.clientX-x);};
      const finish=ev=>{
        if(ev.pointerId!==pid)return;
        document.removeEventListener('pointermove',move);
        document.removeEventListener('pointerup',finish);
        document.removeEventListener('pointercancel',finish);
      };
      document.addEventListener('pointermove',move);
      document.addEventListener('pointerup',finish);
      document.addEventListener('pointercancel',finish);
    });
    grip.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});
  }
  function decorate(table){
    if(!(table instanceof HTMLTableElement)||done.has(table)||table.dataset.globalSortable==='false')return;
    if(!table.tHead?.rows.length||!table.tBodies.length)return;
    const {leaf,count}=headers(table);if(!leaf.length||!count)return;
    const key=tableKey(table,leaf),saved=read(key),cols=columns(table,count);
    const customRoster=!!table.querySelector('thead [data-roster-sort]');
    const used=new Set();
    for(const {th,index} of leaf){
      let id=colId(th,index);
      if(used.has(id))id+=':'+index;
      used.add(id);
      const nativeGrip=!!th.querySelector('[data-roster-resize],[data-rating-resize]');
      const customSort=!!th.querySelector('button:not(.av-table-resize):not(.roster-column-grip),input,select,a');
      if(!customSort){
        th.classList.add('global-sortable-th');th.dataset.sortColumn=String(index);
        th.setAttribute('role','button');th.tabIndex=0;
        th.setAttribute('title','Sort by '+(label(th)||'column'));
        th.setAttribute('aria-sort','none');
      }
      const old=parseFloat(cols[index].style.width),stored=Number(saved[id]);
      if(!customRoster){
        cols[index].style.width=(stored>=52&&stored<=440?stored:Number.isFinite(old)?old:defaultWidth(th,index))+'px';
      }else if(!nativeGrip&&stored>=52&&stored<=440){
        cols[index].style.width=stored+'px';
      }
      if(!nativeGrip)resizeGrip(table,th,index,cols,key,saved,id);
    }
    if(!customRoster)table.style.width=cols.reduce((s,c)=>s+(parseFloat(c.style.width)||120),0)+'px';
    table.style.minWidth='100%';table.style.tableLayout='fixed';
    table.classList.add('av-universal-table');table.dataset.globalSortable='true';done.add(table);
  }
  function decorateAll(root=document){
    if(root instanceof HTMLTableElement)decorate(root);
    root.querySelectorAll?.('table').forEach(decorate);
  }
  function cellText(row,index){
    const cell=row.cells[index];if(!cell)return '';
    const sort=cell.dataset.sortValue||cell.dataset.ratingValue||cell.dataset.avSortValue;
    if(sort!=null&&sort!=='')return String(sort).trim();
    const name=cell.querySelector('[data-player],[data-p2-player],[data-community-profile]');
    return String(name?.textContent||cell.innerText||cell.textContent||'').replace(/\s+/g,' ').trim();
  }
  function numberValue(text){
    let s=text.trim().replace(/^[≈≥~]\s*/,'');
    if(!s||s==='—'||s==='-'||/^n\/?a$/i.test(s))return null;
    if(/^T-\d+$/i.test(s))return Number(s.slice(2));
    if(/^\d+(st|nd|rd|th)$/i.test(s))return parseInt(s,10);
    let sign=1;if(/^\(.*\)$/.test(s)){sign=-1;s=s.slice(1,-1);}
    const pair=s.match(/^(\d[\d,]*(?:\.\d+)?)\s*\/\s*(\d[\d,]*(?:\.\d+)?)$/);
    if(pair)return Number(pair[1].replace(/,/g,''))+Number(pair[2].replace(/,/g,''))*1e-7;
    const m=s.match(/^([+-]?(?:\d[\d,]*(?:\.\d+)?|\.\d+))\s*([KMBT])?\s*(%)?$/i);
    if(!m)return null;
    let n=Number(m[1].replace(/,/g,''));if(!Number.isFinite(n))return null;
    const suffix=(m[2]||'').toUpperCase();
    if(suffix==='K')n*=1e3;else if(suffix==='M')n*=1e6;else if(suffix==='B')n*=1e9;else if(suffix==='T')n*=1e12;
    return n*sign;
  }
  function dateValue(text){
    const s=text.trim().replace(/\s+\*$/,'');
    if(!/^\d{4}-\d\d-\d\d$/.test(s)&&!/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)&&
      !/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(,?\s+\d{4})?$/i.test(s)&&
      !/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{4}$/i.test(s))return null;
    const n=Date.parse(s.length===10&&s[4]==='-'?s+'T00:00:00':s);
    return Number.isFinite(n)?n:null;
  }
  function fixed(row){
    if(row.dataset.sortFixed==='true'||row.classList.contains('empty')||[...row.cells].some(c=>c.colSpan>1))return true;
    return [...row.cells].some(c=>/^total$/i.test((c.innerText||c.textContent||'').trim()));
  }
  function sort(th){
    const table=th.closest('table'),index=Number(th.dataset.sortColumn);
    if(!table||!Number.isInteger(index)||!table.tBodies[0])return;
    const tbody=table.tBodies[0],rows=[...tbody.rows],movable=rows.filter(r=>!fixed(r)),pinned=rows.filter(fixed);
    if(movable.length<2)return;
    const values=movable.map(r=>cellText(r,index)).filter(v=>v&&v!=='—'&&v!=='-');
    const num=values.length&&values.every(v=>numberValue(v)!==null);
    const date=!num&&values.length&&values.every(v=>dateValue(v)!==null);
    const current=th.getAttribute('aria-sort');
    const direction=current==='ascending'?'descending':current==='descending'?'ascending':num||date?'descending':'ascending';
    const factor=direction==='ascending'?1:-1;
    const comparator=(a,b)=>{
      const av=cellText(a,index),bv=cellText(b,index),ab=!av||av==='—'||av==='-',bb=!bv||bv==='—'||bv==='-';
      if(ab||bb)return ab===bb?0:ab?1:-1;
      return num?(numberValue(av)-numberValue(bv))*factor:date?(dateValue(av)-dateValue(bv))*factor:collator.compare(av,bv)*factor;
    };
    const ordered=movable.map((row,i)=>({row,i})).sort((a,b)=>comparator(a.row,b.row)||a.i-b.i).map(r=>r.row);
    table.querySelectorAll('thead th[aria-sort]').forEach(h=>h.setAttribute('aria-sort','none'));
    th.setAttribute('aria-sort',direction);
    ordered.forEach(row=>tbody.appendChild(row));
    pinned.forEach(row=>tbody.appendChild(row));
  }
  document.addEventListener('click',e=>{
    const th=e.target.closest?.('th.global-sortable-th');
    if(th&&!e.target.closest('button,input,select,a'))sort(th);
  });
  document.addEventListener('keydown',e=>{
    if(e.key!=='Enter'&&e.key!==' ')return;
    const th=e.target.closest?.('th.global-sortable-th');
    if(!th||e.target.closest('button,input,select,a'))return;
    e.preventDefault();sort(th);
  });
  decorateAll();
  const observer=new MutationObserver(mutations=>{
    for(const m of mutations)for(const node of m.addedNodes){
      if(node.nodeType!==1)continue;
      if(node.matches?.('table')||node.querySelector?.('table'))decorateAll(node);
    }
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();
