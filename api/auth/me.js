const crypto=require('crypto');

function cookies(req){
  const out={};
  String(req.headers.cookie||'').split(';').forEach(part=>{
    const i=part.indexOf('=');
    if(i>0) out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim());
  });
  return out;
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
    if(!p.exp||p.exp<Math.floor(Date.now()/1000))return null;
    return p;
  }catch{return null;}
}

module.exports=function handler(req,res){
  const session=verify(cookies(req).avengers_session,process.env.AUTH_SECRET);
  res.setHeader('Cache-Control','no-store');
  if(!session){
    res.status(401).json({authenticated:false});
    return;
  }
  res.status(200).json({
    authenticated:true,
    user:{id:session.sub,username:session.username,avatar:session.avatar||null},
    guest:Boolean(session.guest),
    expires:session.exp
  });
};
