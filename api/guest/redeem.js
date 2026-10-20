const crypto=require('crypto');

function sign(payload,secret){
  const body=Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig=crypto.createHmac('sha256',secret).update(body).digest('base64url');
  return body+'.'+sig;
}
function verify(token,secret){
  if(!token||!secret)return null;
  const [body,sig]=String(token).split('.');
  if(!body||!sig)return null;
  const expected=crypto.createHmac('sha256',secret).update(body).digest('base64url');
  const a=Buffer.from(sig),b=Buffer.from(expected);
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;
  try{
    const p=JSON.parse(Buffer.from(body,'base64url').toString('utf8'));
    if(p.typ!=='avengers-guest-invite')return null;
    if(p.permanent===true)return p;
    if(!p.exp||p.exp<=Math.floor(Date.now()/1000))return null;
    p.maxUses=Math.max(1,Math.min(Number(p.maxUses)||1,10));
    return p;
  }catch{return null;}
}
function clientFingerprint(req,secret){
  const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'').split(',')[0].trim();
  const ipHash=crypto.createHmac('sha256',secret).update(ip||'unknown').digest('hex').slice(0,12);
  const ua=String(req.headers['user-agent']||'unknown').replace(/[\r\n]+/g,' ').slice(0,180);
  return {ipHash,ua};
}
function safeDiscordText(s){
  return String(s||'').replace(/[\r\n]+/g,' ').replace(/[*_~`>|]/g,'').replace(/@/g,'@\u200b').trim().slice(0,60);
}
function inviteExpiry(invite){
  if(invite.permanent===true)return 'Never';
  return new Date(Number(invite.exp)*1000).toLocaleString('en-US',{
    timeZone:'America/Chicago',
    month:'short',day:'numeric',
    hour:'numeric',minute:'2-digit',timeZoneName:'short'
  });
}
async function discordApi(path,botToken,options={}){
  return fetch('https://discord.com/api/v10'+path,{
    ...options,
    headers:{
      Authorization:'Bot '+botToken,
      'content-type':'application/json',
      ...(options.headers||{})
    }
  });
}
async function openDm(userId,botToken){
  const r=await discordApi('/users/@me/channels',botToken,{
    method:'POST',
    body:JSON.stringify({recipient_id:String(userId)})
  });
  if(!r.ok)throw new Error('Could not open creator DM ('+r.status+')');
  return r.json();
}
// Discord returns only the most recent 100 messages per request. Count every
// use since issuance using pagination; never reset a guest's click limit just
// because newer alerts pushed earlier redemptions out of the first page.
// Exhausted or malformed history fails closed, NOT as a fresh zero count.
// NOTE: concurrent serverless redeems still need an atomic reservation store
// to provide a strict last-click guarantee; see issue #12.
async function countSuccessfulUses(channelId,botToken,useMarker,issuedAt){
  if(!Number.isSafeInteger(issuedAt)||issuedAt<=0)throw Error('Missing issuance time');
  let before=null,count=0;
  for(let page=0;page<30;page++){
    const suffix=before?'&before='+encodeURIComponent(before):'';
    const r=await discordApi('/channels/'+channelId+'/messages?limit=100'+suffix,botToken);
    if(!r.ok)throw new Error('Could not inspect guest-link log ('+r.status+')');
    const rows=await r.json();
    if(!Array.isArray(rows))throw Error('Malformed guest redemption log');
    let beforeIssue=false;
    for(const m of rows){
      const ts=Date.parse(m.timestamp);
      if(!Number.isFinite(ts)||!m.id)throw Error('Guest redemption history lacks timestamp or id');
      if(ts<issuedAt*1000){beforeIssue=true;continue;}
      // Match the complete token, not a prefix of another invite's marker.
      if(String(m.content||'').includes(useMarker+' '))count++;
    }
    if(rows.length<100||beforeIssue)return count;
    before=String(rows.at(-1).id);
  }
  throw Error('Guest redemption history exceeds safe scan limit');
}
async function sendDm(channelId,botToken,content){
  const r=await discordApi('/channels/'+channelId+'/messages',botToken,{
    method:'POST',
    body:JSON.stringify({content})
  });
  if(!r.ok)throw new Error('Could not send guest-link alert ('+r.status+')');
  return r.json();
}

module.exports=async function handler(req,res){
  if(req.method!=='GET'){
    res.status(405).send('GET required');
    return;
  }
  const secret=process.env.AUTH_SECRET;
  const botToken=process.env.DISCORD_BOT_TOKEN;
  const invite=verify(String(req.query?.t||''),secret);
  if(!invite){
    res.status(410).send('This guest link is invalid or has expired.');
    return;
  }
  if(!botToken){
    res.status(503).send('Guest access is temporarily unavailable.');
    return;
  }

  const marker='AV_GUEST_INVITE:'+invite.jti;
  const useMarker='AV_GUEST_USE:'+invite.jti;
  const passId=String(invite.jti||'').slice(0,8).toUpperCase();
  const passLabel=safeDiscordText(invite.label)||'Unlabeled pass';
  const fp=clientFingerprint(req,secret);
  const ua=String(req.headers['user-agent']||'');
  const isPreviewBot=/(Discordbot|Slackbot|Twitterbot|facebookexternalhit|LinkedInBot|WhatsApp|TelegramBot|Googlebot|bingbot)/i.test(ua);

  // Unfurl/link-preview bots must never consume a guest redemption.
  if(isPreviewBot){
    res.setHeader('Cache-Control','no-store');
    res.status(200).send('<!doctype html><html><head><meta charset="utf-8"><meta property="og:title" content="AVENGERS Stat Center"><meta property="og:description" content="AVENGERS guest access link"><meta name="viewport" content="width=device-width"></head><body style="font-family:system-ui;background:#081322;color:#eaf2ff;padding:32px">AVENGERS Stat Center temporary guest link.</body></html>');
    return;
  }

  try{
    const dm=await openDm(invite.creator,botToken);
    const permanent=invite.permanent===true;

    if(permanent){
      // Permanent links never block on redemption count, but every human redemption
      // is still recorded before access is granted.
      await sendDm(dm.id,botToken,
        '♾️ **AVENGERS guest pass opened**\n'+
        '**Pass:** '+passLabel+' · `'+passId+'`\n'+
        '**Access:** Permanent / unlimited\n'+
        'Client fingerprint: `'+fp.ipHash+'`\n'+
        'Browser: '+fp.ua+'\n'+
        '||'+useMarker+' '+marker+'||'
      );
    }else{
      const successfulUses=await countSuccessfulUses(dm.id,botToken,useMarker,Number(invite.iat));
      const maxUses=Number(invite.maxUses)||3;

      if(successfulUses>=maxUses){
        await sendDm(dm.id,botToken,
          '🚫 **AVENGERS guest pass blocked**\n'+
          '**Pass:** '+passLabel+' · `'+passId+'`\n'+
          '**Reason:** Already used '+maxUses+'/'+maxUses+' times\n'+
          'Client fingerprint: `'+fp.ipHash+'`\n'+
          'Browser: '+fp.ua+'\n'+
          '||'+marker+'||'
        );
        res.setHeader('Cache-Control','no-store');
        res.status(410).send('This temporary guest link has reached its allowed number of uses.');
        return;
      }

      if(Number(invite.exp)<=Math.floor(Date.now()/1000)){
        res.setHeader('Cache-Control','no-store');
        res.status(410).send('This guest link expired before it could be opened.');
        return;
      }
      const useNumber=successfulUses+1;
      // Record a successful use before issuing the session. Discord DM history acts
      // as the durable redemption ledger across serverless instances.
      await sendDm(dm.id,botToken,
        '✅ **AVENGERS guest pass opened**\n'+
        '**Pass:** '+passLabel+' · `'+passId+'`\n'+
        '**Use:** '+useNumber+'/'+maxUses+' · **Expires:** '+inviteExpiry(invite)+'\n'+
        'Client fingerprint: `'+fp.ipHash+'`\n'+
        'Browser: '+fp.ua+'\n'+
        '||'+useMarker+' '+marker+'||'
      );
    }

    const now=Math.floor(Date.now()/1000);
    const session=sign({
      sub:'guest:'+invite.jti,
      username:permanent?'Permanent guest':'Temporary guest',
      avatar:null,
      guest:true,
      permanentGuest:permanent,
      createdBy:String(invite.creator),
      iat:now,
      ...(permanent?{}:{exp:Number(invite.exp)})
    },secret);

    const cookie='avengers_session='+session+'; HttpOnly; Secure; SameSite=Lax; Path=/'+
      (permanent?'; Max-Age=315360000':'; Max-Age='+Math.max(1,Number(invite.exp)-now));
    res.setHeader('Set-Cookie',cookie);
    res.setHeader('Cache-Control','no-store');
    res.redirect(302,'/');
  }catch(err){
    console.error('guest-redeem failure',err);
    // Fail closed: without the durable Discord use marker we do not grant access.
    res.status(503).send('Guest link could not be activated safely. Ask the sender to create a new link.');
  }
};