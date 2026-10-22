'use strict';
// One Discord history page per call. Exact source text is written ONLY to the
// private Neon guide schema; no Discord posts, GitHub artifacts, or log output.
const {
  id,researchScope,permittedChannel,normalizeMessage,discordGet,
  signedMember,bearerAuthorized,reviewerAuthorized
}=require('./discord-guide-research.cjs');

const INIT_SQL=`INSERT INTO avengers_guide_private.channel_backfills
 (channel_id,parent_channel_id,cutoff_at,priority)
 VALUES ($1,$2,$3::timestamptz,$4) ON CONFLICT(channel_id) DO NOTHING`;
const STATE_SQL=`SELECT channel_id, cutoff_at, next_before_message_id, fetched_pages,
 fetched_messages, finished FROM avengers_guide_private.channel_backfills WHERE channel_id=$1`;
const BATCH_SQL=`INSERT INTO avengers_guide_private.source_messages
 (message_id,guild_id,channel_id,parent_channel_id,author_id,author_name,
 source_timestamp,edited_timestamp,reply_to_message_id,source_url,
 body,embed_text,attachment_metadata,candidate_topics,pinned,last_observed_at)
 SELECT message_id,guild_id,channel_id,parent_channel_id,author_id,author_name,
 source_timestamp,edited_timestamp,reply_to_message_id,source_url,
 body,embed_text,attachments::jsonb,candidate_topics,pinned,now()
 FROM jsonb_to_recordset($1::jsonb) AS rows(
 message_id text,guild_id text,channel_id text,parent_channel_id text,
 author_id text,author_name text,source_timestamp timestamptz,edited_timestamp timestamptz,
 reply_to_message_id text,source_url text,body text,embed_text text,
 attachments jsonb,candidate_topics text[],pinned boolean)
 ON CONFLICT(message_id) DO UPDATE SET
 edited_timestamp=excluded.edited_timestamp,
 body=excluded.body,embed_text=excluded.embed_text,
 attachment_metadata=excluded.attachment_metadata,
 candidate_topics=excluded.candidate_topics,
 pinned=excluded.pinned,last_observed_at=now()`;
const PROGRESS_SQL=`UPDATE avengers_guide_private.channel_backfills SET
 next_before_message_id=$3,
 fetched_pages=fetched_pages+1,
 fetched_messages=fetched_messages+$4,
 earliest_fetched_at=CASE WHEN $5::timestamptz IS NULL THEN earliest_fetched_at
 WHEN earliest_fetched_at IS NULL THEN $5::timestamptz
 ELSE LEAST(earliest_fetched_at,$5::timestamptz) END,
 latest_fetched_at=CASE WHEN $6::timestamptz IS NULL THEN latest_fetched_at
 WHEN latest_fetched_at IS NULL THEN $6::timestamptz
 ELSE GREATEST(latest_fetched_at,$6::timestamptz) END,
 finished=$7,updated_at=now(),last_error=null
 WHERE channel_id=$1 AND next_before_message_id IS NOT DISTINCT FROM $2
 AND finished=false RETURNING channel_id`;

function makeStore(sql) {
  if(typeof sql!=='function'||typeof sql.query!=='function'||typeof sql.transaction!=='function')
    throw Error('Transactional private query client required');
  return {
    async state(channelId,parentId,policy) {
      await sql.query(INIT_SQL,[channelId,parentId,policy.since,policy.priority]);
      const rows=await sql.query(STATE_SQL,[channelId]);
      if(!Array.isArray(rows)||rows.length!==1)throw Error('Missing private channel state');
      const got=rows[0];
      if((got.cutoff_at===null?null:Date.parse(String(got.cutoff_at))) !== (policy.since===null?null:Date.parse(policy.since)))
        throw Error('Source cutoff conflict; manual reconciliation required');
      return got;
    },
    async save({channelId,parentId,expectedCursor,nextCursor,rows,finished}) {
      const safe=rows.map(m=>({
        message_id:m.id,guild_id:m.guildId,channel_id:m.channelId,
        parent_channel_id:parentId,author_id:m.author.id||null,
        author_name:m.author.name,source_timestamp:m.timestamp,
        edited_timestamp:m.editedTimestamp||null,reply_to_message_id:m.replyToId||null,
        source_url:m.url,body:m.content,embed_text:m.embedText,
        attachments:m.attachments.map(a=>({id:a.id,name:a.name,contentType:a.contentType,
          size:a.size,description:a.description})),
        candidate_topics:m.tags,pinned:m.pinned
      }));
      const dates=safe.map(m=>m.source_timestamp).sort();
      const [inserted,updated]=await sql.transaction([
        sql.query(BATCH_SQL,[JSON.stringify(safe)]),
        sql.query(PROGRESS_SQL,[channelId,expectedCursor,nextCursor,rows.length,dates[0]||null,
          dates[dates.length-1]||null,finished])
      ]);
      if(!Array.isArray(updated)||updated.length!==1)
        return {raceDetected:true}; // safe: sources idempotent, winning cursor retained
      return {saved:rows.length};
    }
  };
}
function productionStore(env=process.env) {
  if(!env.AVENGERS_GUIDE_DATABASE_URL)throw Error('Dedicated guide database unavailable');
  const {neon}=require('@neondatabase/serverless');
  return makeStore(neon(env.AVENGERS_GUIDE_DATABASE_URL));
}
async function backfillPage(channelId,env,store,fetchImpl=fetch) {
  const scope=researchScope(env);
  if(!scope||!id(channelId)||!env.DISCORD_BOT_TOKEN||!id(env.DISCORD_GUILD_ID))
    return {status:503,error:'Private guide configuration missing'};
  const ch=await discordGet('/channels/'+channelId,env.DISCORD_BOT_TOKEN,fetchImpl);
  if(ch.rateLimited)return {status:429,retryAfterMs:ch.retryAfterMs};
  if(!ch.data||ch.data.guild_id!==env.DISCORD_GUILD_ID ||
    ![0,5,10,11,12,15].includes(ch.data.type)||!permittedChannel(ch.data,scope))
    return {status:403,error:'Channel outside authorized guild/scope'};
  const policy=permittedChannel(ch.data,scope);
  const state=await store.state(channelId,ch.data.parent_id||null,policy);
  if(state.finished)return {status:200,channelId,finished:true,scanned:0,saved:0};
  const params=new URLSearchParams({limit:'100'});
  if(state.next_before_message_id)params.set('before',state.next_before_message_id);
  const result=await discordGet('/channels/'+channelId+'/messages?'+params,env.DISCORD_BOT_TOKEN,fetchImpl);
  if(result.rateLimited)return {status:429,retryAfterMs:result.retryAfterMs};
  if(!Array.isArray(result.data))return {status:502,error:'Discord history unavailable'};
  const since=policy.since?Date.parse(policy.since):null;
  if(result.data.some(m=>!id(m.id)||!Number.isFinite(Date.parse(m.timestamp))))
    return {status:502,error:'Malformed source page (not saved)'};
  const reachedCutoff=since!=null&&result.data.some(m=>Date.parse(m.timestamp)<since);
  const filtered=result.data.filter(m=>since==null||Date.parse(m.timestamp)>=since);
  const rows=filtered.map(m=>normalizeMessage(m,env.DISCORD_GUILD_ID,channelId));
  const finished=reachedCutoff||result.data.length<100;
  const next=finished?null:String(result.data.at(-1).id);
  const save=await store.save({channelId,parentId:ch.data.parent_id||null,
    expectedCursor:state.next_before_message_id||null,
    nextCursor:next,rows,finished});
  return {status:save.raceDetected?409:200,channelId,scanned:result.data.length,
    saved:save.saved||0,finished:finished&&!save.raceDetected,
    candidateCount:rows.filter(m=>m.relevant).length,cutoffReached:reachedCutoff,
    ...(save.raceDetected?{error:'Cursor changed; retry current page'}:{})};
}
async function authorizedOperator(req,env,fetchImpl=fetch){
  if(bearerAuthorized(req,env.AVENGERS_GUIDE_RESEARCH_SECRET))return true;
  const member=signedMember(req,env.AUTH_SECRET);
  if(!member)return false;
  const check=await discordGet('/guilds/'+env.DISCORD_GUILD_ID+'/members/'+member.sub,
    env.DISCORD_BOT_TOKEN,fetchImpl);
  return Boolean(check.data&&Array.isArray(check.data.roles)&&
    reviewerAuthorized(member.sub,check.data.roles,env));
}
module.exports={makeStore,productionStore,backfillPage,authorizedOperator,INIT_SQL,STATE_SQL,BATCH_SQL,PROGRESS_SQL};
