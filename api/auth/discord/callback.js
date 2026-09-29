const crypto = require('crypto');

function origin(req){
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  return `${proto}://${host}`;
}
function cookies(req){
  const out={};
  String(req.headers.cookie||'').split(';').forEach(part=>{
    const i=part.indexOf('=');
    if(i>0) out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim());
  });
  return out;
}
function signSession(payload,secret){
  const body=Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig=crypto.createHmac('sha256',secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}
function clearState(){
  return 'discord_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0';
}

module.exports = async function handler(req,res){
  if(req.method!=='GET'){
    res.status(405).send('GET required');
    return;
  }

  const clientId=process.env.DISCORD_CLIENT_ID;
  const clientSecret=process.env.DISCORD_CLIENT_SECRET;
  const guildId=process.env.DISCORD_GUILD_ID;
  const authSecret=process.env.AUTH_SECRET;
  if(!clientId||!clientSecret||!guildId||!authSecret){
    res.status(500).send('Discord authentication environment variables are incomplete.');
    return;
  }

  const code=String(req.query?.code||'');
  const state=String(req.query?.state||'');
  const c=cookies(req);
  let stored=null;
  try{
    stored=JSON.parse(Buffer.from(String(c.discord_oauth_state||''),'base64url').toString('utf8'));
  }catch{}

  if(!code || !state || !stored || stored.state!==state){
    res.setHeader('Set-Cookie',clearState());
    res.status(400).send('Discord sign-in could not be verified. Please try again.');
    return;
  }

  const redirectUri=`${origin(req)}/api/auth/discord/callback`;
  const tokenBody=new URLSearchParams({
    client_id:clientId,
    client_secret:clientSecret,
    grant_type:'authorization_code',
    code,
    redirect_uri:redirectUri
  });

  const tokenRes=await fetch('https://discord.com/api/v10/oauth2/token',{
    method:'POST',
    headers:{'content-type':'application/x-www-form-urlencoded'},
    body:tokenBody
  });
  if(!tokenRes.ok){
    res.setHeader('Set-Cookie',clearState());
    res.status(401).send('Discord authorization failed during token exchange.');
    return;
  }
  const token=await tokenRes.json();
  const headers={Authorization:`Bearer ${token.access_token}`};

  const [userRes,guildsRes]=await Promise.all([
    fetch('https://discord.com/api/v10/users/@me',{headers}),
    fetch('https://discord.com/api/v10/users/@me/guilds',{headers})
  ]);
  if(!userRes.ok || !guildsRes.ok){
    res.setHeader('Set-Cookie',clearState());
    res.status(401).send('Discord account information could not be verified.');
    return;
  }

  const user=await userRes.json();
  const guilds=await guildsRes.json();
  const isMember=Array.isArray(guilds) && guilds.some(g=>String(g.id)===String(guildId));
  if(!isMember){
    res.setHeader('Set-Cookie',clearState());
    res.status(403).send('Access is limited to members of the AVENGERS Discord server.');
    return;
  }

  const now=Math.floor(Date.now()/1000);
  const session=signSession({
    sub:String(user.id),
    username:user.global_name||user.username||'Discord member',
    avatar:user.avatar||null,
    iat:now,
    exp:now+(60*60*24*30)
  },authSecret);

  res.setHeader('Set-Cookie',[
    clearState(),
    `avengers_session=${session}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60*60*24*30}`
  ]);
  res.redirect(302,stored.returnTo&&stored.returnTo.startsWith('/')?stored.returnTo:'/');
};
