'use strict';

const options='<option value="">Select a status</option><option value="Active">AVENGERS</option>'+
 '<option value="AV2">AV-2</option><option value="Inactive">Inactive</option>';
function page(res){
  res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; connect-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
  res.setHeader('Content-Type','text/html; charset=utf-8');
  return res.status(200).send(
    '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta name="robots" content="noindex,nofollow"><title>Manage rosters · AVENGERS</title>'+
    '<style>body{background:#07101d;color:#ecf4ff;font:16px system-ui;margin:0}main{max-width:780px;margin:auto;padding:26px 18px}a{color:#9cddff}h2{font-size:1.17rem}p{color:#bbcae0}'+
    'fieldset{border:1px solid #334e70;border-radius:10px;background:#101e33;padding:16px;min-width:0}form+form{margin-top:18px}legend{font-weight:750;padding:0 7px}'+
    'label{display:block;margin:8px 0}input,select,button{font:inherit}input,select{color:inherit;background:#081423;border:1px solid #557499;border-radius:6px;padding:9px;width:100%;box-sizing:border-box}'+
    'button{border:0;border-radius:6px;padding:9px 15px;font-weight:700;background:#9cddff;color:#082033;margin-top:10px}button:disabled{opacity:.5}[role=status]{min-height:1.4em}</style>'+
    '<main><a href="/?page=rosters">Back to Stat Center</a><h1>Manage rosters</h1>'+
    '<p id="sync" aria-live="polite">Loading roster…</p><p id="feedback" role="status"></p>'+
    '<form data-kind="status"><fieldset disabled><legend>Change clan status</legend>'+
    '<label>Member<select name="name" data-members required></select></label>'+
    '<label>New status<select name="status" required>'+options+'</select></label><button>Save status</button></fieldset></form>'+
    '<form data-kind="link"><fieldset disabled><legend>Link two names</legend>'+
    '<label>Existing name or screenshot spelling to link<input name="name" list="known-names" maxlength="80" required></label>'+
    '<label>Canonical name to keep<select name="target" data-members required></select></label>'+
    '<p>The kept name receives the linked results. Past results keep their event-time clan.</p><button>Link names</button></fieldset></form>'+
    '<form data-kind="add"><fieldset disabled><legend>Add a member</legend>'+
    '<label>In-game name<input name="name" maxlength="80" required></label>'+
    '<label>Clan status<select name="status" required>'+options+'</select></label><button>Add member</button></fieldset></form>'+
    '<datalist id="known-names"></datalist></main><script src="/api/roster-editor?view=script" defer></script></html>');
}
function browser(){
  const sync=document.getElementById('sync');
  const feedback=document.getElementById('feedback');
  const forms=[...document.querySelectorAll('form')];
  const controls=forms.map(form=>form.querySelector('fieldset'));
  let revision=0;
  async function read(){
    const r=await fetch('/api/roster-editor?view=state',{cache:'no-store'});
    const data=await r.json();
    if(!r.ok)throw Error(data.error);
    revision=data.revision;
    sync.textContent=data.revision===data.published?'Roster is up to date.':
      (data.revision-data.published)+' saved change(s) waiting for website publication.';
    for(const input of document.querySelectorAll('[data-members], #known-names')){
      const selected=input.value;
      input.replaceChildren();
      if(input.tagName==='SELECT')input.add(new Option('Select a member',''));
      for(const member of data.people)input.append(new Option(member.name,member.name));
      if(selected)input.value=selected;
    }
    controls.forEach(control=>{control.disabled=false;});
    return data;
  }
  let lastRequest;
  for(const form of forms)form.addEventListener('submit',async event=>{
    event.preventDefault();
    const payload={...Object.fromEntries(new FormData(form)),kind:form.dataset.kind,revision};
    const fingerprint=JSON.stringify(payload);
    if(lastRequest?.fingerprint!==fingerprint)lastRequest={fingerprint,id:crypto.randomUUID()};
    controls.forEach(control=>{control.disabled=true;});
    feedback.textContent='Saving…';
    try{
      const result=await fetch('/api/roster-editor',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...payload,requestId:lastRequest.id})});
      const saved=await result.json();
      if(!result.ok){
        if(result.status===409)await read();
        throw Error(saved.error);
      }
      form.reset();
      lastRequest=null;
      feedback.textContent='Saved. The site and importer will use the change after publication.';
      await read();
    }catch(e){
      feedback.textContent=e.message||'Unable to confirm the save.';
    }finally{controls.forEach(control=>{control.disabled=false;});}
  });
  read().catch(e=>{sync.textContent=e.message||'Could not load the roster.';});
  setInterval(()=>{
    if(document.visibilityState==='visible'&&!controls.some(control=>control.disabled))
      read().catch(()=>{});
  },30000);
}
function script(res){
  res.setHeader('Content-Type','application/javascript; charset=utf-8');
  return res.status(200).send('('+browser.toString()+')();');
}
module.exports={page,script};
