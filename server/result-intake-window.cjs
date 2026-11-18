'use strict';
/**
 * AVENGERS source-intake windows. All wall-clock values use America/Chicago,
 * including daylight-saving transitions. The UTC Vercel cron only invokes
 * this handler; no Discord or database IO occurs outside an active window.
 */
const TZ='America/Chicago';
const FORMAT=new Intl.DateTimeFormat('en-US',{timeZone:TZ,year:'numeric',month:'2-digit',
  day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
const FRIDAY=['piggyFlash1','piggyFlash2','piggyFlash3','piggyFlash4','space','piggy','av2','kraken'];
const SUNDAY=['piggy','space','av2','kraken'];
function local(nowMs){
  const p=Object.fromEntries(FORMAT.formatToParts(new Date(nowMs))
    .filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  return {year:Number(p.year),month:Number(p.month),day:Number(p.day),
    weekday:p.weekday,hour:Number(p.hour),minute:Number(p.minute)};
}
function localStamp(p){return [p.year,String(p.month).padStart(2,'0'),String(p.day).padStart(2,'0')].join('-');}
function centralWallMillis(p,hour,minute=0){
  const target=Date.UTC(p.year,p.month-1,p.day,hour,minute);
  let guess=target+6*3600000;
  for(let i=0;i<2;i++){
    const observed=local(guess);
    const observedUtc=Date.UTC(observed.year,observed.month-1,observed.day,observed.hour,observed.minute);
    guess+=target-observedUtc;
  }
  return guess;
}
function dateMinusDays(p,days){
  const d=new Date(Date.UTC(p.year,p.month-1,p.day-days,12));
  return {year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate()};
}
function activeWindow(nowMs=Date.now()){
  const p=local(nowMs),clock=p.hour*60+p.minute;
  let mode,startMinute,endMinute;
  if(p.weekday==='Fri'&&clock>=360&&clock<=450){mode='friday';startMinute=360;endMinute=450;}
  else if(p.weekday==='Sun'&&clock>=960&&clock<=1110){mode='sunday';startMinute=960;endMinute=1110;}
  else return null;
  const start=centralWallMillis(p,Math.floor(startMinute/60),startMinute%60);
  const end=centralWallMillis(p,Math.floor(endMinute/60),endMinute%60);
  const mon=dateMinusDays(p,mode==='friday'?4:6);
  const wed=dateMinusDays(p,mode==='friday'?2:4);
  const fri=dateMinusDays(p,mode==='sunday'?2:0);
  const lookbacks={
    flash:centralWallMillis(mon,6),
    space:centralWallMillis(wed,6),
    piggy:centralWallMillis(mode==='friday'?wed:fri,6),
    // AV-2 is extended to the previous verified publication checkpoint by
    // the controller. 21 days is a safe initial bound, not a weekly cutoff.
    av2:start-21*86400000,
    kraken:start-21*86400000
  };
  const channels=mode==='friday'?FRIDAY:SUNDAY;
  return {id:mode+'-'+localStamp(p),mode,timeZone:TZ,startMs:start,endMs:end,
    minutesLeft:Math.max(0,Math.floor((end-nowMs)/60000)),
    cutoffs:lookbacks,channels,primary:mode==='friday'?'space':'piggy',
    fallback:mode==='friday'?'piggy':'space'};
}
function channelCutoff(w,channel){
  if(channel.startsWith('piggyFlash'))return w.cutoffs.flash;
  return w.cutoffs[channel]??w.startMs;
}
function scopedKey(w,channel){return 'window:'+w.id+':'+channel;}
function chooseNext(w,checkpoints={},count=3){
  // First complete every channel's full source range. Later ticks re-check
  // channels in event-priority order to capture new/late screenshots.
  const priority=w.channels;
  const outstanding=priority.filter(key=>!checkpoints[key]?.last_scan_complete);
  const pool=outstanding.length?outstanding:priority;
  return [...pool].sort((a,b)=>{
    const ca=checkpoints[a],cb=checkpoints[b];
    const pa=ca?.updated_at?Date.parse(ca.updated_at):0;
    const pb=cb?.updated_at?Date.parse(cb.updated_at):0;
    if(pa!==pb)return pa-pb;
    return priority.indexOf(a)-priority.indexOf(b);
  }).slice(0,count);
}
function sourceRefs(event){
  return new Set((event.sources||[]).map(s=>String(s).match(/(?:^|:)([a-f0-9]{64})$/)?.[1]).filter(Boolean));
}
function publicationCoverage(w,checkpoints,sourceRows,ledgerEvents){
  const hashesByChannel={};
  for(const key of w.channels)hashesByChannel[key]=[];
  const messageCounts=new Map();
  const missingByChannel=Object.fromEntries(w.channels.map(k=>[k,0]));
  for(const row of sourceRows){
    const cutoff=channelCutoff(w,row.channel_key);
    if(Date.parse(row.message_timestamp)<cutoff || row.progress_hint)continue;
    const key=row.channel_key+':'+row.message_id;
    if(!messageCounts.has(key))messageCounts.set(key,{
      channel:row.channel_key,expected:Number(row.image_count)||0,observed:0});
    const msg=messageCounts.get(key);
    if(row.attachment_id)msg.observed++;
    if(row.status!=='verified_bytes'||!row.image_sha256){
      missingByChannel[row.channel_key]=(missingByChannel[row.channel_key]||0)+1;
      continue;
    }
    if(hashesByChannel[row.channel_key])hashesByChannel[row.channel_key].push(row.image_sha256);
  }
  for(const msg of messageCounts.values()){
    if(msg.expected>msg.observed)missingByChannel[msg.channel]+=(msg.expected-msg.observed);
  }
  const ledger=ledgerEvents.map(e=>({...e,sourceHashSet:sourceRefs(e)}));
  const matching=(key,kind,index)=>{
    const hashes=[...new Set(hashesByChannel[key]||[])];
    if(!hashes.length)return {confirmed:false,matched:0,total:0};
    const relevant=ledger.filter(e=>e.kind===kind && Date.parse(e.date+'T12:00:00Z') >=
      (kind==='flash'?w.cutoffs.flash:channelCutoff(w,key))-86400000 &&
      (!index||e.id.endsWith('|'+index)));
    const matched=hashes.filter(h=>relevant.some(e=>e.sourceHashSet.has(h))).length;
    return {confirmed:matched===hashes.length&&matched>0,matched,total:hashes.length};
  };
  const flashes=w.mode==='friday'?
    [1,2,3,4].map(i=>({channel:'piggyFlash'+i,...matching('piggyFlash'+i,'flash',i)})):[];
  const primary=matching(w.primary,w.primary);
  const fallback=matching(w.fallback,w.fallback);
  const main=(primary.confirmed?primary:fallback);
  const selectedMain=primary.confirmed?w.primary:fallback.confirmed?w.fallback:w.primary;
  const relevantChannels=[selectedMain,...flashes.map(x=>x.channel)];
  const missingOriginals=relevantChannels.reduce((n,k)=>n+(missingByChannel[k]||0),0);
  const requiredScan=w.channels.filter(k=>!['av2','kraken'].includes(k));
  const missingScan=requiredScan.filter(k=>!checkpoints[k]?.last_scan_complete);
  const uncheckedOptional=['av2','kraken'].filter(k=>w.channels.includes(k)&&!checkpoints[k]?.updated_at);
  const av2Hashes=[...new Set(hashesByChannel.av2||[])];
  const av2Matches=av2Hashes.filter(h=>ledger.some(e=>e.sourceHashSet.has(h))).length;
  // AV-2 partial collection must not block AVENGERS publication.
  const canStop=missingScan.length===0 && uncheckedOptional.length===0 && missingOriginals===0 &&
    (w.mode!=='friday'||flashes.every(x=>x.confirmed)) && main.confirmed;
  return {websitePublished:canStop,mainKind:primary.confirmed?w.primary:fallback.confirmed?w.fallback:null,
    missingScan,uncheckedOptional,missingOriginals,flashes,primary,fallback,
    av2:{observed:av2Hashes.length,publishedSourceMatches:av2Matches,partial:av2Matches<av2Hashes.length},
    // Immutable source evidence is the only valid publication-completion basis.
    reason:canStop?'source-hashes-present-in-live-versioned-ledger':'awaiting-source-or-publication'};
}
module.exports={local,activeWindow,channelCutoff,scopedKey,chooseNext,publicationCoverage,centralWallMillis};
