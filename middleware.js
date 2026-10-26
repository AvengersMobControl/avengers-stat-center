function b64urlToBytes(s){
  s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');
  while(s.length%4)s+='=';
  const raw=atob(s);
  return Uint8Array.from(raw,c=>c.charCodeAt(0));
}
function cookieValue(header,name){
  for(const part of String(header||'').split(';')){
    const i=part.indexOf('=');
    if(i>0 && part.slice(0,i).trim()===name) return decodeURIComponent(part.slice(i+1).trim());
  }
  return '';
}
async function validSession(token,secret){
  if(!token||!secret)return false;
  const [body,sig]=String(token).split('.');
  if(!body||!sig)return false;
  try{
    const key=await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      {name:'HMAC',hash:'SHA-256'},
      false,
      ['verify']
    );
    const ok=await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlToBytes(sig),
      new TextEncoder().encode(body)
    );
    if(!ok)return false;
    const payload=JSON.parse(new TextDecoder().decode(b64urlToBytes(body)));
    if(payload.guest===true && payload.permanentGuest===true)return true;
    return Number(payload.exp||0)>Math.floor(Date.now()/1000);
  }catch{
    return false;
  }
}

export default async function middleware(request){
  const url=new URL(request.url);
  const p=url.pathname;

  // These endpoints perform their own authentication/authorization.
  if(
    p.startsWith('/api/auth/') ||
    p.startsWith('/api/discord/') ||
    // Single-purpose CANARY endpoint enforces its own strong, expiring token,
    // verified restricted runtime role, channel allowlist and send-once ledger.
    // Do NOT use a generic /api/discord prefix: only the exact one-off path.
    p==='/api/discord-canary' ||
    p==='/api/discord-publish-av2' ||
    // Oct20 one-shot publisher performs its own expiring nonce + DB reservation checks.
    p==='/api/discord-publish-oct20' ||
    // Allow only the SHA-pinned approved Oct20 static PNG fetched by the publisher.
    p==='/assets/reports/AVENGERS_Piggy_Flashes_October_20_2026_FINAL.png' ||
    // Allow only the SHA-pinned approved Oct25 Space PNG fetched by its one-time publisher.
    p==='/assets/reports/AVENGERS_Space_Race_October_25_2026.png' ||
    p.startsWith('/api/guest/') ||
    p==='/mcp' ||
    p.startsWith('/.well-known/') ||
    p.startsWith('/oauth/')
  ) return;

  const session=cookieValue(request.headers.get('cookie'),'avengers_session');
  if(await validSession(session,process.env.AUTH_SECRET)) return;

  const login=new URL('/api/auth/discord/login',url.origin);
  login.searchParams.set('returnTo',p+url.search);
  return Response.redirect(login,302);
}
