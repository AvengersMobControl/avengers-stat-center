'use strict';
(() => {
  if(location.origin!=='https://avengers-stat-center.vercel.app')return;
  const section=document.getElementById('page-rosters');
  if(!section)return;
  if(new URLSearchParams(location.search).get('page')==='rosters')
    document.querySelector('[data-page="rosters"]')?.click();
  fetch('/api/roster-editor?view=capability',{cache:'no-store'}).then(async response=>{
    if(!response.ok||!(await response.json()).allowed)return;
    const actions=document.createElement('div');
    actions.className='section-toolbar';
    const link=document.createElement('a');
    link.className='nav-btn';
    link.href='/api/roster-editor';
    link.textContent='Manage rosters';
    actions.append(link);
    section.prepend(actions);
  }).catch(()=>{});
})();
