'use strict';
(async () => {
  const signedInOrigin='https://avengers-stat-center.vercel.app';
  const publicOrigin='https://avengersmobcontrol.github.io';
  const section=document.getElementById('page-rosters');
  if(!section)return;

  function addLink(label, href){
    const actions=document.createElement('div');
    actions.className='section-toolbar';
    const link=document.createElement('a');
    link.className='nav-btn';
    link.href=href;
    link.textContent=label;
    actions.append(link);
    section.prepend(actions);
  }

  if(location.origin===publicOrigin){
    const login=new URL('/api/auth/discord/login',signedInOrigin);
    login.searchParams.set('returnTo','/?page=rosters');
    addLink('Sign in with Discord',login.href);
    return;
  }
  if(location.origin!==signedInOrigin)return;

  if(new URLSearchParams(location.search).get('page')==='rosters')
    document.querySelector('[data-page="rosters"]')?.click();
  try{
    const response=await fetch('/api/roster-editor?view=capability',{cache:'no-store'});
    if(response.ok&&(await response.json()).allowed===true)
      addLink('Manage rosters','/api/roster-editor');
  }catch{
    // Keep private controls hidden when authorization cannot be verified.
  }
})();
