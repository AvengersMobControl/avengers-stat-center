module.exports=function handler(req,res){
  res.setHeader('Set-Cookie','avengers_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  res.redirect(302,'/');
};
