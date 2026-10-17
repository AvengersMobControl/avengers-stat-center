'use strict';
// Review-only, deterministic summary dispatch planner. No network, Discord,
// filesystem writes, authorization escalation or source ledger mutation.
const crypto=require('node:crypto');
const KINDS=['piggy','flash','kraken','space'],CLANS=['AVENGERS','AV-2'];
const HEX=/^[a-f0-9]{64}$/i;
const fail=(message)=>{throw Error(message)};
function validateCandidate(c,registry){
 if(!c||typeof c!=='object'||!KINDS.includes(c.kind)||!CLANS.includes(c.clan))fail('Unsupported summary kind/clan');
 if(typeof c.eventId!=='string'||!c.eventId.startsWith(c.kind+'|')||c.eventId.length>140)fail('Invalid event identity');
 if(!HEX.test(c.projectionVersion||'')||!HEX.test(c.imageSHA256||''))fail('Missing canonical projection or raster SHA-256');
 if(c.approvedSourceOnly!==true||c.readyToPost!==false||c.discordPostingEnabled!==false)fail('Summary must be approved-ledger preview, not an authorized send');
 if(c.eventStatus!=='final')fail('Only explicitly final approved source can enter a dispatch review');
 if(!registry||registry.discordPostingEnabled!==false||registry.automaticDispatchEnabled!==false)fail('Posting safety flags absent');
 const t=c.kind==='space'?registry.space:registry.templates?.[c.kind];
 if(!t||!['temporarily-approved','approved-existing-unchanged'].includes(t.status))fail('Unapproved template');
 if(c.kind!=='space'&&(!t.clans?.includes(c.clan)||t.automaticDiscordPostingAllowed!==false))fail('Template clan or posting flags invalid');
 const version=c.kind==='space'?'space-approved-existing':t.version;
 if(typeof version!=='string'||!/^[a-z0-9-]{5,80}$/.test(version))fail('Invalid template version');
 return {...c,templateVersion:version};
}
function key(c){return [c.kind,c.eventId,c.clan].join('::')}
function edition(c){return [key(c),c.projectionVersion,c.templateVersion,c.imageSHA256].join('::')}
function validatePublished(p){
 if(!p||typeof p!=='object'||!KINDS.includes(p.kind)||!CLANS.includes(p.clan)||
 typeof p.eventId!=='string'||!p.eventId.startsWith(p.kind+'|')||!HEX.test(p.projectionVersion||'')||
 !HEX.test(p.imageSHA256||'')||typeof p.templateVersion!=='string')fail('Invalid prior publication record');
 if(!/^\d{15,22}$/.test(p.discordMessageId||'')||!/^\d{15,22}$/.test(p.discordChannelId||''))
 fail('A verified Discord channel/message ID is required for correction planning');
 return p;
}
function plan({candidate,registry,published=[]}){
 const c=validateCandidate(candidate,registry);
 if(!Array.isArray(published))fail('Invalid publication history');
 const entries=published.map(validatePublished).filter(p=>key(p)===key(c));
 if(entries.length>1)fail('Multiple active messages for same event/clan; manual reconciliation required');
 const prior=entries[0]||null;
 const operation=!prior?'needs-first-publication-approval':
 edition(prior)===edition(c)?'already-published':'needs-correction-approval';
 const actions=operation==='already-published'?[]:operation==='needs-first-publication-approval'?
 [{type:'review-send',requiresExplicitAuthorization:true}]:
 [{type:'review-replacement',requiresExplicitAuthorization:true,existingMessageId:prior.discordMessageId,
 existingChannelId:prior.discordChannelId,deletePriorOnlyAfterReplacementVerified:true}];
 return {schemaVersion:1,decision:operation,eventId:c.eventId,kind:c.kind,clan:c.clan,
 identity:key(c),edition:edition(c),projectionVersion:c.projectionVersion,
 templateVersion:c.templateVersion,imageSHA256:c.imageSHA256,
 priorMessageId:prior?.discordMessageId||null,priorChannelId:prior?.discordChannelId||null,
 actions,approvedToPost:false,sendEnabled:false,deleteEnabled:false,
 warning:'Human result and explicit send/replacement authorization required. Never automatically post or delete.'};
}
function manifestHash(planObject){
 return crypto.createHash('sha256').update(JSON.stringify(planObject)).digest('hex');
}
module.exports={plan,key,edition,manifestHash};
