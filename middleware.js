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
    return Number(payload.exp||0)>Math.floor(Date.now()/1000);
  }catch{
    return false;
  }
}

export default async function middleware(request){
  const url=new URL(request.url);
  const p=url.pathname;

  if(p.startsWith('/api/auth/') || p.startsWith('/api/discord/')) return;

  const session=cookieValue(request.headers.get('cookie'),'avengers_session');
  if(await validSession(session,process.env.AUTH_SECRET)) return;

  const login=new URL('/api/auth/discord/login',url.origin);
  login.searchParams.set('returnTo',p+url.search);
  return Response.redirect(login,302);
}
