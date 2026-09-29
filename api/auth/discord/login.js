const crypto = require('crypto');

function origin(req){
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  return `${proto}://${host}`;
}

module.exports = async function handler(req,res){
  if(req.method!=='GET'){
    res.status(405).send('GET required');
    return;
  }

  const clientId=process.env.DISCORD_CLIENT_ID;
  if(!clientId){
    res.status(500).send('DISCORD_CLIENT_ID is not configured');
    return;
  }

  const returnTo = typeof req.query?.returnTo==='string' && req.query.returnTo.startsWith('/')
    ? req.query.returnTo
    : '/';
  const state=crypto.randomBytes(24).toString('base64url');
  const statePayload=Buffer.from(JSON.stringify({state,returnTo})).toString('base64url');

  res.setHeader('Set-Cookie',
    `discord_oauth_state=${statePayload}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
  );

  const redirectUri=`${origin(req)}/api/auth/discord/callback`;
  const params=new URLSearchParams({
    client_id:clientId,
    response_type:'code',
    redirect_uri:redirectUri,
    scope:'identify guilds',
    state
  });

  res.redirect(302,`https://discord.com/oauth2/authorize?${params.toString()}`);
};
