(() => {
  const nav=document.querySelector('.nav');
  if(!nav || nav.querySelector('[data-discord-review-link]')) return;
  const btn=document.createElement('button');
  btn.className='nav-btn';
  btn.setAttribute('data-discord-review-link','');
  btn.innerHTML='<span>⌕</span> Discord Review';
  btn.addEventListener('click',()=>{window.location.href='/discord-review.html';});
  nav.appendChild(btn);
})();
