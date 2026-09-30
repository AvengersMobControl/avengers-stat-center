const crypto=require('crypto');

function cookies(req){
  const out={};
  String(req.headers.cookie||'').split(';').forEach(part=>{
    const i=part.indexOf('=');
    if(i>0){
      try{out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim());}
      catch{out[part.slice(0,i).trim()]=part.slice(i+1).trim();}
    }
  });
  return out;
}
function verifySession(token,secret){
  if(!token||!secret)return null;
  const [body,sig]=String(token).split('.');
  if(!body||!sig)return null;
  const expected=crypto.createHmac('sha256',secret).update(body).digest('base64url');
  const a=Buffer.from(sig),b=Buffer.from(expected);
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;
  try{
    const p=JSON.parse(Buffer.from(body,'base64url').toString('utf8'));
    if(!p.exp||p.exp<Math.floor(Date.now()/1000))return null;
    return p;
  }catch{return null;}
}
function sign(payload,secret){
  const body=Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig=crypto.createHmac('sha256',secret).update(body).digest('base64url');
  return body+'.'+sig;
}
function origin(req){
  const proto=String(req.headers['x-forwarded-proto']||'https').split(',')[0].trim();
  const host=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim();
  return proto+'://'+host;
}
function html(s){
  return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

module.exports=async function handler(req,res){
  if(req.method!=='GET'){
    res.status(405).send('GET required');
    return;
  }
  const secret=process.env.AUTH_SECRET;
  const session=verifySession(cookies(req).avengers_session,secret);
  if(!session || session.guest){
    res.status(401).send('Sign in as an AVENGERS Discord member first.');
    return;
  }
  const now=Math.floor(Date.now()/1000);
  const ttl=60*60;
  const maxUses=3;
  const payload={
    typ:'avengers-guest-invite',
    jti:crypto.randomBytes(18).toString('base64url'),
    creator:String(session.sub),
    creatorName:String(session.username||'AVENGERS member'),
    iat:now,
    exp:now+ttl,
    maxUses
  };
  const token=sign(payload,secret);
  const url=origin(req)+'/api/guest/redeem?t='+encodeURIComponent(token);
  const expires=new Date(payload.exp*1000).toLocaleString('en-US',{
    timeZone:'America/Chicago',
    month:'short',day:'numeric',year:'numeric',
    hour:'numeric',minute:'2-digit',timeZoneName:'short'
  });
  res.setHeader('Cache-Control','no-store');
  res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>AVENGERS Guest Link</title><style>
  body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#081322;color:#eaf2ff;margin:0;padding:32px}
  .card{max-width:760px;margin:6vh auto;background:#101d30;border:1px solid #263a55;border-radius:18px;padding:26px;box-shadow:0 18px 50px rgba(0,0,0,.3)}
  h1{margin:0 0 8px;font-size:26px}.muted{color:#9fb0c7}.link{word-break:break-all;background:#07111f;border:1px solid #29405f;border-radius:12px;padding:14px;margin:18px 0;font-family:ui-monospace,monospace}
  button{background:#cf3348;color:white;border:0;border-radius:10px;padding:11px 16px;font-weight:800;cursor:pointer}.ok{margin-left:10px;color:#9fe0b0;font-weight:700}
  .note{margin-top:18px;padding:12px;border-radius:10px;background:#17253a;color:#c9d6e8;font-size:14px;line-height:1.45}
  </style></head><body><div class="card"><h1>1-hour guest link</h1><div class="muted">Expires ${html(expires)}. The first redemption activates a guest session for the remaining time.</div><div id="guestLink" class="link">${html(url)}</div><button onclick="navigator.clipboard.writeText(document.getElementById('guestLink').textContent).then(()=>document.getElementById('copied').textContent='Copied')">Copy link</button><span id="copied" class="ok"></span><div class="note"><strong>3-use protection:</strong> Discord and other link-preview bots do not count. The first three successful guest opens are allowed; the fourth and later attempts are blocked. You receive a Discord DM for each successful redemption and for any blocked attempt.</div></div></body></html>`);
};