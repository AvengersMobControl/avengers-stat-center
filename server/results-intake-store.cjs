'use strict';
// Private state. Idempotent page writes; credentials and signed URLs NEVER persisted.
const {randomUUID}=require('node:crypto');
function connect(connection,channels){
  if(!connection)throw Error('missing_private_results_database');
  const {neon}=require('@neondatabase/serverless');
  return createStore(neon(connection),channels);
}
function createStore(sql,channels={}) {
  return {
    async acquireLease(){
      const owner=randomUUID();
      const rows=await sql`INSERT INTO avengers_results_private.collector_lease
        (lease_name,owner_id,expires_at)
        VALUES ('source-intake',${owner},now()+interval '4 minutes')
        ON CONFLICT(lease_name) DO UPDATE SET
          owner_id=excluded.owner_id,expires_at=excluded.expires_at
          WHERE avengers_results_private.collector_lease.expires_at<now()
        RETURNING owner_id`;
      return rows.length?owner:null;
    },
    async releaseLease(owner){
      await sql`DELETE FROM avengers_results_private.collector_lease
        WHERE lease_name='source-intake' AND owner_id=${owner}`;
    },
    async beginRun(){
      const id=randomUUID();
      await sql`INSERT INTO avengers_results_private.ingest_runs(run_id,status)
        VALUES (${id},'running')`;
      return id;
    },
    async finishRun(id,status,summary){
      await sql`UPDATE avengers_results_private.ingest_runs
        SET status=${status},finished_at=now(),summary=${JSON.stringify(summary)}::jsonb
        WHERE run_id=${id}`;
    },
    async getCheckpoint(key){
      const rows=await sql`SELECT last_completed_id,resume_before_id,resume_upper_id
        FROM avengers_results_private.channel_checkpoints WHERE channel_key=${key}`;
      const s=rows[0];
      return s?{lastCompletedId:s.last_completed_id,
        resumeBeforeId:s.resume_before_id,resumeUpperId:s.resume_upper_id}:null;
    },
    async putCheckpoint(key,s){
      await sql`INSERT INTO avengers_results_private.channel_checkpoints
        (channel_key,last_completed_id,resume_before_id,resume_upper_id,
        last_scan_complete,updated_at)
        VALUES (${key},${s.lastCompletedId},${s.resumeBeforeId},${s.resumeUpperId},
          ${s.lastScanComplete},now())
        ON CONFLICT(channel_key) DO UPDATE SET
          last_completed_id=excluded.last_completed_id,
          resume_before_id=excluded.resume_before_id,
          resume_upper_id=excluded.resume_upper_id,
          last_scan_complete=excluded.last_scan_complete,
          updated_at=now()`;
    },
    async savePage(key,docs){
      if(!docs.length)return;
      const m=docs.map(d=>({
        channel_key:key,message_id:d.messageId,message_timestamp:d.timestamp,
        attachment_count_total:d.attachmentCountTotal,image_count:d.imageCount,
        progress_hint:d.progressHint
      }));
      await sql`INSERT INTO avengers_results_private.source_messages
          (channel_key,message_id,message_timestamp,attachment_count_total,
          image_count,progress_hint)
        SELECT x.channel_key,x.message_id,x.message_timestamp::timestamptz,
          x.attachment_count_total,x.image_count,x.progress_hint
        FROM jsonb_to_recordset(${JSON.stringify(m)}::jsonb)
          AS x(channel_key text,message_id text,message_timestamp text,
            attachment_count_total int,image_count int,progress_hint boolean)
        ON CONFLICT(channel_key,message_id) DO UPDATE SET
          attachment_count_total=excluded.attachment_count_total,
          image_count=excluded.image_count,
          progress_hint=excluded.progress_hint`;
      const a=docs.flatMap(d=>d.attachments).map(x=>({
        channel_key:key,message_id:x.messageId,attachment_id:x.attachmentId,
        filename:x.filename,content_type:x.contentType,
        expected_size:x.expectedSize,status:x.status
      }));
      if(a.length)await sql`INSERT INTO avengers_results_private.source_attachments
          (channel_key,message_id,attachment_id,filename,content_type,expected_size,status)
        SELECT x.channel_key,x.message_id,x.attachment_id,x.filename,
          x.content_type,x.expected_size,x.status
        FROM jsonb_to_recordset(${JSON.stringify(a)}::jsonb)
          AS x(channel_key text,message_id text,attachment_id text,filename text,
            content_type text,expected_size bigint,status text)
        ON CONFLICT(channel_key,attachment_id) DO NOTHING`;
    },
    async listPending(limit){
      const rows=await sql`SELECT a.channel_key,a.message_id,a.attachment_id,
        a.content_type,a.attempts
        FROM avengers_results_private.source_attachments a
        JOIN avengers_results_private.source_messages m
          ON m.channel_key=a.channel_key AND m.message_id=a.message_id
        WHERE a.status IN ('pending','retry') AND a.next_retry_at<=now()
        ORDER BY m.message_timestamp DESC LIMIT ${limit}`;
      return rows.map(x=>({
        channelKey:x.channel_key,channelId:channels[x.channel_key]?.id,
        messageId:x.message_id,attachmentId:x.attachment_id,contentType:x.content_type,
        attempts:x.attempts
      }));
    },
    async markVerified(x,proof){
      await sql`UPDATE avengers_results_private.source_attachments
        SET status='verified_bytes',image_sha256=${proof.imageSha256},
          byte_length=${proof.byteLength},verified_at=now(),
          last_error_code=NULL,attempts=attempts+1
        WHERE channel_key=${x.channelKey} AND attachment_id=${x.attachmentId}`;
    },
    async markRetry(x,reason){
      await sql`UPDATE avengers_results_private.source_attachments
        SET status=CASE WHEN attempts>=4 THEN 'blocked' ELSE 'retry' END,
          attempts=attempts+1,last_error_code=${reason},
          next_retry_at=now()+(interval '1 minute' *
            LEAST(240,(5 * power(2,LEAST(attempts,5)))::int))
        WHERE channel_key=${x.channelKey} AND attachment_id=${x.attachmentId}`;
    },
    async status(){
      const a=await sql`SELECT status,COUNT(*)::int n
        FROM avengers_results_private.source_attachments GROUP BY status`;
      const c=await sql`SELECT COUNT(*)::int total,
        COUNT(*) FILTER(WHERE last_scan_complete)::int complete,
        COUNT(*) FILTER(WHERE NOT last_scan_complete)::int continuing
        FROM avengers_results_private.channel_checkpoints`;
      const r=await sql`SELECT status,started_at,finished_at,summary
        FROM avengers_results_private.ingest_runs ORDER BY started_at DESC LIMIT 1`;
      return {attachmentStatus:Object.fromEntries(a.map(x=>[x.status,x.n])),
        channels:c[0],lastRun:r[0]||null};
    }
  };
}
module.exports={connect,createStore};
