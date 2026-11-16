'use strict';
// Read-only, resumable Discord source discovery. No event parsing or publication.
const {retrieveOriginal}=require('../scripts/fetch-original-discord-image.cjs');
const TYPES={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif'};
const ID=/^\d{15,22}$/;
const PROGRESS=/(preliminary|still\s+ongoing|in\s+progress|progress\s+results|current\s+standings|not\s+final)/i;
function imageKind(a){
  const ext=String(a.filename||'').split('.').pop().toLowerCase();
  const mime=String(a.content_type||'').split(';')[0].toLowerCase();
  if(!TYPES[ext]&&!mime.startsWith('image/'))return {status:'not_image',mime:mime||null};
  if(!TYPES[ext]||(mime&&TYPES[ext]!==mime))return {status:'unsupported',mime:mime||null};
  return {status:'pending',mime:TYPES[ext]};
}
function sourceMessage(channelKey,m) {
  if(!ID.test(String(m?.id||''))||!Array.isArray(m.attachments)||
     !Number.isFinite(Date.parse(String(m.timestamp||''))))throw Error('invalid_source_message');
  const unique=new Set();
  const attachments=m.attachments.map(a=>{
    if(!ID.test(String(a?.id||''))||unique.has(a.id))throw Error('invalid_source_attachment');
    unique.add(a.id);
    const t=imageKind(a);
    return {channelKey,messageId:String(m.id),attachmentId:String(a.id),
      filename:String(a.filename||'').slice(0,255),contentType:t.mime,
      expectedSize:Number.isSafeInteger(a.size)&&a.size>=0?a.size:null,status:t.status};
  });
  return {channelKey,messageId:String(m.id)¶»§q«^