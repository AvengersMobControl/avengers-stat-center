(() => {
  'use strict';

  const STYLE_ID='av-global-table-sort-style';

  function addStyles(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      table[data-global-sortable="true"] thead th.global-sortable-th{
        cursor:pointer;
        user-select:none;
        -webkit-user-select:none;
        position:relative;
        padding-right:24px;
      }
      table[data-global-sortable="true"] thead th.global-sortable-th::after{
        content:'↕';
        position:absolute;
        right:8px;
        top:50%;
        transform:translateY(-50%);
        font-size:10px;
        opacity:.38;
        font-weight:900;
      }
      table[data-global-sortable="true"] thead th.global-sortable-th:hover{
        color:#fff;
      }
      table[data-global-sortable="true"] thead th.global-sortable-th[aria-sort="ascending"]::after{
        content:'▲';
        opacity:1;
        color:var(--cyan,#43d7ff);
      }
      table[data-global-sortable="true"] thead th.global-sortable-th[aria-sort="descending"]::after{
        content:'▼';
        opacity:1;
        color:var(--cyan,#43d7ff);
      }
    `;
    document.head.appendChild(style);
  }

  function isExistingCustomSort(table){
    return !!table.querySelector('thead [data-roster-sort]');
  }

  function decorateTable(table){
    if(!(table instanceof HTMLTableElement)) return;
    if(table.dataset.globalSortable==='false' || isExistingCustomSort(table)) return;
    const headerRow=table.tHead?.rows?.[0];
    if(!headerRow || !table.tBodies?.length) return;
    table.dataset.globalSortable='true';
    [...headerRow.cells].forEach((th,index)=>{
      if(th.hasAttribute('colspan') && Number(th.getAttribute('colspan'))>1) return;
      if(th.querySelector('button,input,select,a')) return;
      th.classList.add('global-sortable-th');
      th.dataset.sortColumn=String(index);
      th.setAttribute('role','button');
      th.setAttribute('tabindex','0');
      th.setAttribute('title',`Sort by ${th.textContent.trim() || 'this column'}`);
      if(!th.hasAttribute('aria-sort')) th.setAttribute('aria-sort','none');
    });
  }

  function decorateAll(root=document){
    if(root instanceof HTMLTableElement) decorateTable(root);
    root.querySelectorAll?.('table').forEach(decorateTable);
  }

  function cellText(row,index){
    const cell=row.cells[index];
    if(!cell) return '';
    return (cell.dataset.sortValue || cell.innerText || cell.textContent || '').trim();
  }

  function dateValue(text){
    const s=text.trim();
    if(/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)){
      const t=Date.parse(s+'T00:00:00');
      return Number.isFinite(t)?t:null;
    }
    if(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(,?\s+\d{4})?$/i.test(s) ||
       /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{4}$/i.test(s)){
      const t=Date.parse(s);
      return Number.isFinite(t)?t:null;
    }
    return null;
  }

  function numberValue(text){
    let s=text.trim();
    if(!s || s==='—' || s==='-' || /^n\/?a$/i.test(s)) return null;

    let sign=1;
    if(/^\(.*\)$/.test(s)){ sign=-1; s=s.slice(1,-1); }

    const suffixMatch=s.match(/^\s*([+-]?[\d,.]+(?:\.\d+)?)\s*([KMBT])?\s*(%|B)?\s*$/i);
    if(!suffixMatch) return null;

    let n=Number(suffixMatch[1].replace(/,/g,''));
    if(!Number.isFinite(n)) return null;

    const suffix=(suffixMatch[2]||'').toUpperCase();
    if(suffix==='K') n*=1e3;
    else if(suffix==='M') n*=1e6;
    else if(suffix==='B') n*=1e9;
    else if(suffix==='T') n*=1e12;

    return n*sign;
  }

  function classify(values){
    const nonBlank=values.filter(v=>v && v!=='—' && v!=='-');
    if(!nonBlank.length) return 'text';
    const nums=nonBlank.map(numberValue);
    if(nums.every(v=>v!==null)) return 'number';
    const dates=nonBlank.map(dateValue);
    if(dates.every(v=>v!==null)) return 'date';
    return 'text';
  }

  function fixedRow(row){
    if(row.dataset.sortFixed==='true' || row.classList.contains('empty')) return true;
    if([...row.cells].some(c=>c.colSpan>1)) return true;
    return [...row.cells].some(c=>/^total$/i.test((c.innerText||c.textContent||'').trim()));
  }

  function compareText(a,b){
    return a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'});
  }

  function sortTable(th){
    const table=th.closest('table');
    if(!table || isExistingCustomSort(table)) return;
    const index=Number(th.dataset.sortColumn);
    if(!Number.isInteger(index)) return;
    const tbody=table.tBodies[0];
    if(!tbody) return;

    const rows=[...tbody.rows];
    const sortable=rows.filter(r=>!fixedRow(r));
    const fixed=rows.filter(fixedRow);
    if(sortable.length<2) return;

    const type=classify(sortable.map(r=>cellText(r,index)));
    const current=th.getAttribute('aria-sort');
    const direction=current==='ascending'?'descending':current==='descending'?'ascending':(type==='text'?'ascending':'descending');
    const mult=direction==='ascending'?1:-1;

    sortable.sort((ra,rb)=>{
      const at=cellText(ra,index), bt=cellText(rb,index);
      const aBlank=!at || at==='—' || at==='-';
      const bBlank=!bt || bt==='—' || bt==='-';
      if(aBlank && bBlank) return 0;
      if(aBlank) return 1;
      if(bBlank) return -1;

      let cmp=0;
      if(type==='number') cmp=(numberValue(at)??0)-(numberValue(bt)??0);
      else if(type==='date') cmp=(dateValue(at)??0)-(dateValue(bt)??0);
      else cmp=compareText(at,bt);
      return cmp*mult;
    });

    table.querySelectorAll('thead th[aria-sort]').forEach(h=>h.setAttribute('aria-sort','none'));
    th.setAttribute('aria-sort',direction);
    sortable.forEach(r=>tbody.appendChild(r));
    fixed.forEach(r=>tbody.appendChild(r));
  }

  document.addEventListener('click',e=>{
    const th=e.target.closest?.('th.global-sortable-th');
    if(!th || e.target.closest('button,input,select,a')) return;
    sortTable(th);
  });

  document.addEventListener('keydown',e=>{
    if(e.key!=='Enter' && e.key!==' ') return;
    const th=e.target.closest?.('th.global-sortable-th');
    if(!th) return;
    e.preventDefault();
    sortTable(th);
  });

  addStyles();
  decorateAll();

  const observer=new MutationObserver(mutations=>{
    for(const m of mutations){
      for(const node of m.addedNodes){
        if(node.nodeType===1) decorateAll(node);
      }
    }
  });
  observer.observe(document.body,{childList:true,subtree:true});
})();
