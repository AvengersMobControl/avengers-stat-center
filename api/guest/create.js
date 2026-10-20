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
  if(!session){
    const returnTo='/api/guest/create'+(req.url&&req.url.includes('?')?'?'+req.url.split('?').slice(1).join('?'):'');
    res.redirect(302,'/api/auth/discord/login?returnTo='+encodeURIComponent(returnTo));
    return;
  }
  if(session.guest){
    res.status(403).send('Guest accounts cannot create guest links. Sign in with an AVENGERS Discord member account.');
    return;
  }

  const builder=String(req.query?.builder||'')==='1';
  if(builder){
    res.setHeader('Cache-Control','no-store');
    res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>AVENGERS Guest Pass Builder</title><style>
    body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#081322;color:#eaf2ff;margin:0;padding:24px}
    .card{max-width:760px;margin:5vh auto;background:#101d30;border:1px solid #263a55;border-radius:18px;padding:28px;box-shadow:0 18px 50px rgba(0,0,0,.3)}
    h1{margin:0 0 8px;font-size:28px}.muted{color:#9fb0c7;line-height:1.45}
    label{display:block;margin:24px 0 8px;font-weight:800}
    input{width:100%;box-sizing:border-box;background:#07111f;color:#eaf2ff;border:1px solid #365275;border-radius:12px;padding:14px 15px;font-size:17px;outline:none}
    input:focus{border-color:#7aa7e8}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px}
    button{border:0;border-radius:12px;padding:17px 14px;font-weight:900;font-size:16px;cursor:pointer;color:white;background:#cf3348}
    button:hover{filter:brightness(1.08)}button.secondary{background:#375b8f}button.unlimited{background:#6f4aa3}
    .small{font-size:13px;color:#8fa4bf;margin-top:16px;line-height:1.4}
    #err{color:#ff9fa9;font-weight:700;margin-top:10px;min-height:20px}
    @media(max-width:620px){.grid{grid-template-columns:1fr}.card{padding:22px;margin-top:2vh}}
    </style></head><body><div class="card">
      <h1>AVENGERS Guest Pass Builder</h1>
      <div class="muted">Enter a tag so your Discord redemption alerts tell you which guest pass was opened, then choose the pass type.</div>
      <label for="tag">Guest tag</label>
      <input id="tag" maxlength="60" placeholder="Example: Jake, Recruit #3, Kraken tester" autocomplete="off">
      <div id="err"></div>
      <div class="grid">
        <button onclick="makePass(1,3)">1 hour · 3 clicks</button>
        <button class="secondary" onclick="makePass(3,5)">3 hours · 5 clicks</button>
        <button class="secondary" onclick="makePass(24,10)">24 hours · 10 clicks</button>
        <button class="unlimited" onclick="makePass(null,null,true)">Unlimited</button>
      </div>
      <div class="small">Discord and other link-preview bots do not consume a click. The tag is included in your private redemption alerts.</div>
    </div><script>
      function makePass(hours,uses,permanent){
        const tag=document.getElementById('tag').value.trim();
        const err=document.getElementById('err');
        if(!tag){err.textContent='Enter a tag before creating the pass.';document.getElementById('tag').focus();return;}
        err.textContent='';
        const p=new URLSearchParams();
        p.set('label',tag);
        if(permanent)p.set('mode','permanent');
        else{p.set('hours',String(hours));p.set('uses',String(uses));}
        location.href='/api/guest/create?'+p.toString();
      }
      document.getElementById('tag').addEventListener('keydown',e=>{if(e.key==='Enter')makePass(1,3);});
    </script></body></html>`);
    return;
  }

  const now=Math.floor(Date.now()/1000);
  const permanent=String(req.query?.mode||'').toLowerCase()==='permanent';
  const requestedHours=Math.floor(Number(req.query?.hours));
  const requestedUses=Math.floor(Number(req.query?.uses));
  const hours=Number.isFinite(requestedHours)?Math.max(1,Math.min(requestedHours,168)):1;
  const ttl=60*60*hours;
  const maxUses=Number.isFinite(requestedUses)?Math.max(1,Math.min(requestedUses,10)):3;
  const rawLabel=String(req.query?.label||req.query?.tag||req.query?.for||'').trim();
  const label=rawLabel.replace(/[\r\n<>]/g,' ').replace(/\s+/g,' ').slice(0,60);
  const payload={
    typ:'avengers-guest-invite',
    jti:crypto.randomBytes(18).toString('base64url'),
    creator:String(session.sub),
    creatorName:String(session.username||'AVENGERS member'),
    iat:now,
    ...(label?{label}:{}),
    ...(permanent?{permanent:true}:{exp:now+ttl,maxUses,counterVersion:2})
  };
  // All newly issued *temporary* invites are registered before a link is
  // displayed. Existing v1 links remain on legacy DM counting until expiry.
  // Unavailable database fails closed; never hand out an unmetered v2 token.
  if(!permanent){
    try{
      await require('./atomic-counter').productionStore().register(payload);
    }catch(e){
      console.error('guest-create private counter registration failed',e.message);
      res.setHeader('Cache-Control','no-store');
      res.status(503).send('Guest passes are temporarily unavailable. No link was issued.');
      return;
    }
  }
  const token=sign(payload,secret);
  const url=origin(req)+'/api/guest/redeem?t='+encodeURIComponent(token);
  const expires=permanent?'Never':new Date(payload.exp*1000).toLocaleString('en-US',{
    timeZone:'America/Chicago',
    month:'short',day:'numeric',year:'numeric',
    hour:'numeric',minute:'2-digit',timeZoneName:'short'
  });
  res.setHeader('Cache-Control','no-store');
  const durationLabel=hours===1?'1-hour':hours+'-hour';
  const heading=permanent?'Permanent guest link':durationLabel+' guest link';
  const shortId=String(payload.jti).slice(0,8).toUpperCase();
  const passName=label||'Unlabeled pass';
  const sub=(label?'Pass: '+passName+' · ':'')+'ID '+shortId+' · '+(permanent?'Never expires. Unlimited human redemptions; every redemption is still logged to you.':'Expires '+expires+'. The first redemption activates a guest session for the remaining time.');
  const note=permanent
    ?'<strong>Permanent / unlimited:</strong> Discord and other link-preview bots do not count. Human opens are never blocked for age or use count, and each successful redemption is logged to you by Discord DM.'
    :'<strong>'+maxUses+'-use protection:</strong> Discord and other link-preview bots do not count. The first '+maxUses+' successful guest opens are allowed; later attempts are blocked. You receive a Discord DM for each successful redemption and for any blocked attempt. Add <code>&label=Name</code> when creating separate passes so alerts identify the intended recipient.';
  const switchLink='<a href="/api/guest/create?builder=1" style="color:#9fc5ff">Create another guest pass</a>';
  res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>AVENGERS Guest Link</title><style>
  body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#081322;color:#eaf2ff;margin:0;padding:32px}
  .card{max-width:760px;margin:6vh auto;background:#101d30;border:1px solid #263a55;border-radius:18px;padding:26px;box-shadow:0 18px 50px rgba(0,0,0,.3)}
  h1{margin:0 0 8px;font-size:26px}.muted{color:#9fb0c7}.link{word-break:break-all;background:#07111f;border:1px solid #29405f;border-radius:12px;padding:14px;margin:18px 0;font-family:ui-monospace,monospace}
  button{background:#cf3348;color:white;border:0;border-radius:10px;padding:11px 16px;font-weight:800;cursor:pointer}.ok{margin-left:10px;color:#9fe0b0;font-weight:700}
  .note{margin-top:18px;padding:12px;border-radius:10px;background:#17253a;color:#c9d6e8;font-size:14px;line-height:1.45}
  </style></head><body><div class="card"><h1>${html(heading)}</h1><div class="muted">${html(sub)}</div><div id="guestLink" class="link">${html(url)}</div><button onclick="navigator.clipboard.writeText(document.getElementById('guestLink').textContent).then(()=>document.getElementById('copied').textContent='Copied')">Copy link</button><span id="copied" class="ok"></span><div class="note">${note}</div><div style="margin-top:16px">${switchLink}</div></div></body></html>`);
};