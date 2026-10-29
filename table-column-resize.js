/* Site-wide adjustable table columns; widths persist per page/table. */
(()=>{
 const keyPrefix='avengers-column-widths-v1:';
 let scheduled=false;
 function enhance(){
  document.querySelectorAll('table').forEach((table)=>{
   if(table.dataset.resizable==='yes')return;
   const heads=[...table.querySelectorAll('thead tr:first-child > th')];
   if(heads.length<2)return;
   table.dataset.resizable='yes';
   table.classList.add('av-resizable-table');
   const page=table.closest('.page')?.id||'global';
   const tables=[...document.querySelectorAll('#'+CSS.escape(page)+' table')];
   const ordinal=Math.max(0,tables.indexOf(table));
   const key=keyPrefix+page+':'+ordinal;
   const saved=(()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}})();
   const cols=document.createElement('colgroup');
   heads.forEach((h,i)=>{
    const col=document.createElement('col');cols.append(col);
    if(Number(saved[i])>=48)col.style.width=saved[i]+'px';
    h.style.position='relative';
    const grip=document.createElement('span');
    grip.className='av-column-grip';grip.setAttribute('role','separator');
    grip.setAttribute('aria-label','Resize '+h.textContent.trim()+' column');
    grip.setAttribute('tabindex','0');grip.setAttribute('aria-orientation','vertical');
    grip.title='Drag to resize · double tap to reset · arrow keys to adjust';
    const setWidth=(v)=>{const w=Math.max(48,Math.round(v));col.style.width=w+'px';table.style.width='max-content';saved[i]=w;try{localStorage.setItem(key,JSON.stringify(saved))}catch{}};
    grip.addEventListener('pointerdown',e=>{
     e.preventDefault();e.stopPropagation();grip.setPointerCapture(e.pointerId);
     const start=e.clientX, width=h.getBoundingClientRect().width;
     const move=ev=>setWidth(width+ev.clientX-start);
     const stop=()=>{grip.removeEventListener('pointermove',move);grip.removeEventListener('pointerup',stop);grip.removeEventListener('pointercancel',stop)};
     grip.addEventListener('pointermove',move);grip.addEventListener('pointerup',stop);grip.addEventListener('pointercancel',stop);
    });
    grip.addEventListener('dblclick',e=>{e.stopPropagation();delete saved[i];col.style.width='';try{localStorage.setItem(key,JSON.stringify(saved))}catch{}});
    grip.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();e.stopPropagation();setWidth(h.getBoundingClientRect().width+(e.key==='ArrowRight'?12:-12))}});
    grip.addEventListener('click',e=>e.stopPropagation());
    h.append(grip);
   });
   table.prepend(cols);
  });
 }
 const observer=new MutationObserver(()=>{if(!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;enhance()})}});
 observer.observe(document.body,{childList:true,subtree:true});enhance();
 document.addEventListener('click',e=>{
  const gauge=e.target.closest('.rating-command-score');
  if(!gauge)return;
  const nav=document.querySelector('.nav-btn[data-page="ratings"]');
  if(nav){nav.click();window.scrollTo({top:0,behavior:'smooth'})}
 });
 document.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&e.target.closest('.rating-command-score')){e.preventDefault();document.querySelector('.nav-btn[data-page="ratings"]')?.click()}
 });
})();
