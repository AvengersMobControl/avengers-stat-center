'use strict';
// Server-rendered, member-only guide. No strategy included in public dist.
const {signedMember,discordGet}=require('../../server/discord-guide-research.cjs');
function htmlEscape(v){return String(v==null?'':v).replace(/[&<>"']/g,
 c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function deny(res,status,message){
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.setHeader('Cache-Control','private, no-store, max-age=0');
 res.setHeader('X-Robots-Tag','noindex, nofollow');
 res.status(status).send('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>AVENGERS Strategy Guide</title><body style="font:16px system-ui;background:#09111d;color:#dbe6fb;padding:40px;max-width:700px;margin:auto"><h1>AVENGERS Strategy Guide</h1><p>'+htmlEscape(message)+'</p><a style="color:#79b8ff" href="/">Return to Stat Center</a></body></html>');
}
module.exports=async function handler(req,res){
 if(req.method!=='GET')return deny(res,405,'GET required');
 const env=process.env;
 const user=signedMember(req,env.AUTH_SECRET);
 if(!user)return deny(res,401,'Sign in with your AVENGERS Discord account to view the guide. Guest passes do not include clan strategy.');
 if(!env.DISCORD_BOT_TOKEN||!env.DISCORD_GUILD_ID)return deny(res,503,'The strategy guide is temporarily unavailable.');
 const m=await discordGet('/guilds/'+env.DISCORD_GUILD_ID+'/members/'+user.sub,env.DISCORD_BOT_TOKEN);
 if(!m.data||!Array.isArray(m.data.roles))return deny(res,403,'A current AVENGERS Discord membership is required.');
 if(!env.AVENGERS_GUIDE_DATABASE_URL)return deny(res,503,'The guide archive is not configured.');
 try{
  const {neon}=require('@neondatabase/serverless');
  const sql=neon(env.AVENGERS_GUIDE_DATABASE_URL);
  const items=await sql.query(`SELECT t.tip_id,t.topic,t.statement,t.conditions,t.review_state,
    (SELECT coalesce(jsonb_agg(jsonb_build_object('url',s.source_url,'date',s.source_timestamp)
      ORDER BY s.source_timestamp DESC),'[]'::jsonb)
     FROM avengers_guide_private.source_messages s WHERE s.message_id=ANY(t.source_message_ids)) sources
     FROM avengers_guide_private.reviewed_tips t
     ORDER BY t.topic,t.tip_id`);
  if(!Array.isArray(items))throw Error('Invalid guide query');
  const topics=[...new Set(items.map(x=>String(x.topic)))].sort();
  const topicButtons=topics.map(t=>'<button class="filter" type="button" data-topic="'+htmlEscape(t)+'">'+htmlEscape(t)+'</button>').join('');
  const cards=items.map((x,i)=>'<article class="tip" data-topic="'+htmlEscape(x.topic)+'" data-search="'+htmlEscape([x.statement,x.conditions,x.topic].join(' ').toLowerCase())+'">'+
    '<div class="meta"><span class="topic">'+htmlEscape(x.topic)+'</span><span class="state">'+htmlEscape(x.review_state)+'</span></div>'+
    '<h2>'+htmlEscape(x.statement)+'</h2><p>'+htmlEscape(x.conditions||'')+'</p>'+
    '<div class="sources">Source: '+(Array.isArray(x.sources)?x.sources:[]).map((s,n)=>'<a href="'+htmlEscape(s.url)+'" target="_blank" rel="noopener noreferrer">Discord '+(n+1)+'</a>').join(' · ')+
    '</div></article>').join('');
  const css=`
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 20% 0%,#152a48,#08111e 55%);font:15px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;color:#e2ebfa}main{max-width:1160px;margin:auto;padding:34px 24px 90px}header{border-bottom:1px solid #34445a;padding:0 0 24px;margin-bottom:28px}h1{font-size:clamp(28px,5vw,48px);line-height:1.13;margin:8px 0 16px;letter-spacing:-.03em}header p{max-width:760px;color:#abbbd3;font-size:16px}a{color:#8cc1ff;text-decoration:none}a:hover{text-decoration:underline}.back{font-size:13px}.eyebrow{color:#70aae8;text-transform:uppercase;font-size:12px;letter-spacing:.16em;font-weight:750}.controls{display:grid;gap:14px;position:sticky;top:0;background:#09111de8;backdrop-filter:blur(12px);z-index:3;padding:14px 0;border-bottom:1px solid #27384d}.search{background:#132034;color:#fff;border:1px solid #445b78;border-radius:12px;padding:12px 14px;width:100%;font:inherit}.filters{display:flex;gap:8px;flex-wrap:wrap}.filter{background:#172338;color:#b8c8dc;border:1px solid #34455f;padding:6px 12px;border-radius:999px;font:inherit;font-size:13px;cursor:pointer}.filter.active{background:#2663ad;color:#fff;border-color:#5fafff}.count{font-size:13px;color:#aab8ce}section{margin:30px 0}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,345px),1fr));gap:16px}.tip{border:1px solid #30445b;background:#101d2edb;padding:21px;border-radius:16px;display:flex;flex-direction:column;min-height:190px}.tip h2{font-size:17px;line-height:1.35;font-weight:675;margin:14px 0 8px}.tip p{color:#aabed4;margin:0 0 17px}.meta{display:flex;align-items:center;justify-content:space-between;gap:12px}.topic{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#8ac8ff;font-weight:700}.state{font-size:11px;color:#c6d4e6;border:1px solid #405572;border-radius:20px;padding:2px 9px;text-transform:uppercase}.sources{margin-top:auto;font-size:12px;color:#9db0c7}.tip[hidden]{display:none}.fine{font-size:12px;color:#8ca0b7}`;
  const script=`(()=>{const input=document.getElementById('q'),cards=[...document.querySelectorAll('.tip')],buttons=[...document.querySelectorAll('.filter')],count=document.getElementById('count');let topic='';function render(){const q=input.value.trim().toLowerCase();let shown=0;for(const c of cards){const ok=(!topic||c.dataset.topic===topic)&&(!q||c.dataset.search.includes(q));c.hidden=!ok;if(ok)shown++;}count.textContent=shown+' of '+cards.length+' reported tips';buttons.forEach(b=>b.classList.toggle('active',b.dataset.topic===topic));}buttons.forEach(b=>b.addEventListener('click',()=>{topic=topic===b.dataset.topic?'':b.dataset.topic;render();}));input.addEventListener('input',render);render();})();`;
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'");
  res.status(200).send('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>AVENGERS Strategy Guide</title><style>'+css+'</style></head><body><main>'+
    '<header><a class="back" href="/">← Stat Center</a><div class="eyebrow">AVENGERS · Clan knowledge</div>'+
    '<h1>Strategy & Gameplay Guide</h1><p>Source-linked advice gathered from our eight selected Discord channels. These are <strong>reported player tactics</strong>, not a guarantee that every older method still works. Open the original source for examples, questions and videos.</p></header>'+
    '<div class="controls"><label for="q">Search the guide</label><input class="search" id="q" type="search" autocomplete="off" placeholder="Search loadouts, champion, event, returns…"/><div class="filters">'+topicButtons+'</div><div class="count" id="count"></div></div>'+
    '<section class="cards">'+cards+'</section><p class="fine">Source messages and clips remain in Discord. The full archive is kept private; nothing here is published to GitHub Pages. Older advice may have been superseded by game updates.</p></main><script>'+script+'</script></body></html>');
 }catch(e){
  console.error('Guide page render failed',e?.code||e?.name||'Error');
  return deny(res,503,'The private guide archive could not be loaded.');
 }
};
