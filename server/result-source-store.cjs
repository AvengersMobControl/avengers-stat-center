'use strict';
// Existing private AVENGERS result-collector tables, already provisioned in Neon.
// Never touch avengers_dispatch_private (Discord posts) or public site ledgers.
const crypto=require('node:crypto');
const SQL='avengers_results_private';
function windowUuid(id){const h=crypto.createHash('sha256').update('avengers-window:'+id).digest('hex');return h.slice(0,8)+'-'+h.slice(8,12)+'-4'+h.slice(13,16)+'-a'+h.slice(17,20)+'-'+h.slice(20,32);}
function makeStore(db){
  const q=(statement,params=[])=>db.query(statement,params);
  return {
    async claim(key,nonce){
      const lock=await q('INSERT INTO '+SQL+'.collector_lease(lease_name,owner_id,expires_at) VALUES($1,$2::uuid,now()+interval \'4 minutes\') ON CONFLICT(lease_name) DO UPDATE SET owner_id=EXCLUDED.owner_id,expires_at=EXCLUDED.expires_at WHERE '+SQL+'.collector_lease.expires_at<now() RETURNING owner_id',
        ['source-intake:'+key,nonce]);
      if(lock.length!==1)return null;
      await q('INSERT INTO '+SQL+'.channel_checkpoints(channel_key) VALUES($1) ON CONFLICT DO NOTHING',[key]);
      await q('INSERT INTO '+SQL+'.ingest_runs(run_id,status,summary) VALUES($1::uuid,\'running\',jsonb_build_object(\'kind\',\'source-intake\',\'channel\',$2::text))',[nonce,key]);
      const rows=await q('SELECT resume_before_id AS next_before,resume_upper_id FROM '+SQL+'.channel_checkpoints WHERE channel_key=$1',[key]);
      return rows[0];
    },
    async recordMessage(r){
      await q('INSERT INTO '+SQL+'.source_messages(channel_key,message_id,message_timestamp,attachment_count_total,image_count,progress_hint) VALUES($1,$2,$3::timestamptz,$4,$5,$6) ON CONFLICT(channel_key,message_id) DO UPDATE SET attachment_count_total=EXCLUDED.attachment_count_total,image_count=EXCLUDED.image_count,progress_hint=EXCLUDED.progress_hint',
        [r.channelKey,r.messageId,r.sourceTime,r.attachmentCountTotal,r.imageCount,r.progressHint]);
    },
    async find(key,messageId,attachmentId){
      const rows=await q('SELECT image_sha256 AS original_sha256,byte_length FROM '+SQL+'.source_attachments WHERE channel_key=$1 AND message_id=$2 AND attachment_id=$3 AND status=\'verified_bytes\'',[key,messageId,attachmentId]);
      return rows[0]||null;
    },
    async receipt(r){
      await q('INSERT INTO '+SQL+'.source_attachments(channel_key,message_id,attachment_id,filename,content_type,status,attempts,image_sha256,byte_length,verified_at) VALUES($1,$2,$3,$4,$5,\'verified_bytes\',1,$6,$7,now()) ON CONFLICT(channel_key,attachment_id) DO UPDATE SET status=\'verified_bytes\',attempts='+SQL+'.source_attachments.attempts+1,image_sha256=EXCLUDED.image_sha256,byte_length=EXCLUDED.byte_length,verified_at=now(),last_error_code=NULL',
        [r.channelKey,r.messageId,r.attachmentId,r.filename,r.contentType,r.originalSha256,r.byteLength]);
    },
    async failure(r){
      await q('INSERT INTO '+SQL+'.source_attachments(channel_key,message_id,attachment_id,filename,content_type,status,attempts,last_error_code) VALUES($1,$2,$3,$4,$5,\'retry\',1,$6) ON CONFLICT(channel_key,attachment_id) DO UPDATE SET status=\'retry\',attempts='+SQL+'.source_attachments.attempts+1,last_error_code=EXCLUDED.last_error_code,next_retry_at=now()+interval \'5 minutes\' WHERE '+SQL+'.source_attachments.status<>\'verified_bytes\'',
        [r.channelKey,r.messageId,r.attachmentId,r.filename,r.contentType,r.errorCode]);
    },
    async complete(key,nonce,r){
      const rows=await q('UPDATE '+SQL+'.channel_checkpoints SET resume_before_id=$2,resume_upper_id=$3,last_scan_complete=$4,last_completed_id=CASE WHEN $4 THEN $5 ELSE last_completed_id END,updated_at=now() WHERE channel_key=$1 AND EXISTS (SELECT 1 FROM '+SQL+'.collector_lease WHERE lease_name=$6 AND owner_id=$7::uuid AND expires_at>now()) RETURNING channel_key',
        [key,r.nextBefore,r.cycleComplete?null:r.upperId,r.cycleComplete,r.upperId,'source-intake:'+key,nonce]);
      if(rows.length!==1)throw Error('Could not checkpoint the channel');
      await q('UPDATE '+SQL+'.ingest_runs SET status=$2,finished_at=now(),summary=jsonb_build_object(\'kind\',\'source-intake\',\'channel\',$3::text,\'pagesComplete\',$4::boolean,\'attachmentsAccounted\',$5::integer,\'newProofs\',$6::integer) WHERE run_id=$1::uuid',
        [nonce,r.cycleComplete?'source-cycle-complete':'source-page-complete',key,r.cycleComplete,r.sourceAttachments,r.newProofs]);
      await q('DELETE FROM '+SQL+'.collector_lease WHERE lease_name=$1 AND owner_id=$2::uuid',['source-intake:'+key,nonce]);
    },
    async release(key,nonce,errorCode){
      await q('UPDATE '+SQL+'.ingest_runs SET status=\'source-failed\',finished_at=now(),summary=jsonb_build_object(\'kind\',\'source-intake\',\'channel\',$2::text,\'errorCode\',$3::text) WHERE run_id=$1::uuid',[nonce,key,errorCode]);
      await q('DELETE FROM '+SQL+'.collector_lease WHERE lease_name=$1 AND owner_id=$2::uuid',['source-intake:'+key,nonce]);
    },
    async windowCheckpoints(window,scopedKey){
      const keys=window.channels.map(k=>scopedKey(window,k));
      const rows=await q('SELECT channel_key,last_scan_complete,resume_before_id,updated_at FROM '+SQL+'.channel_checkpoints WHERE channel_key=ANY($1::text[])',[keys]);
      const map={};
      for(const row of rows){
        for(const channel of window.channels)if(row.channel_key===scopedKey(window,channel))map[channel]=row;
      }
      return map;
    },
    async previousWebsitePublication(){
      const rows=await q('SELECT max(finished_at) AS last_published FROM '+SQL+'.ingest_runs WHERE status=\'website-published\' AND summary->>\'mode\' IN (\'friday\',\'sunday\') AND coalesce(summary#>>\'{verification,av2,partial}\',\'false\')=\'false\'');
      const t=rows[0]?.last_published;
      return t?Date.parse(t):null;
    },
    async sourceRows(window){
      const since=Math.min(...Object.values(window.cutoffs));
      const rows=await q('SELECT m.channel_key,m.message_id,m.message_timestamp,m.progress_hint,m.image_count,a.attachment_id,a.image_sha256,a.status FROM '+SQL+'.source_messages m LEFT JOIN '+SQL+'.source_attachments a ON m.channel_key=a.channel_key AND m.message_id=a.message_id WHERE m.channel_key=ANY($1::text[]) AND m.message_timestamp >= $2::timestamptz AND m.image_count>0 ORDER BY m.message_timestamp DESC LIMIT 2501',
        [window.channels,new Date(since).toISOString()]);
      if(rows.length>2500)throw Error('source-query-result-limit');
      return rows;
    },
    async websitePublished(windowId){
      const uuid=windowUuid(windowId);
      const rows=await q('SELECT summary FROM '+SQL+'.ingest_runs WHERE run_id=$1::uuid AND status=\'website-published\'',[uuid]);
      return rows[0]?.summary||null;
    },
    async markWebsitePublished(window,verification){
      const uuid=windowUuid(window.id);
      const summary={
        kind:'website-source-coverage',
        windowId:window.id,mode:window.mode,sourceSha:verification.publicCommit,
        releaseVersion:verification.version,checkedAt:new Date().toISOString(),
        channels:window.channels,
        verification:verification.coverage
      };
      await q('INSERT INTO '+SQL+'.ingest_runs(run_id,status,started_at,finished_at,summary) VALUES($1::uuid,\'website-published\',to_timestamp($2::double precision / 1000),now(),$3::jsonb) ON CONFLICT(run_id) DO UPDATE SET status=EXCLUDED.status,finished_at=EXCLUDED.finished_at,summary=EXCLUDED.summary',
        [uuid,window.startMs,JSON.stringify(summary)]);
      return summary;
    },
    async status(){
      const rows=await q('SELECT c.channel_key,c.updated_at,c.last_scan_complete,c.resume_before_id IS NOT NULL AS pending_pages, (SELECT count(*)::integer FROM '+SQL+'.source_attachments a WHERE a.channel_key=c.channel_key AND a.status=\'verified_bytes\') AS original_images_verified, (SELECT count(*)::integer FROM '+SQL+'.source_attachments a WHERE a.channel_key=c.channel_key AND a.status IN (\'retry\',\'blocked\')) AS source_failures, (SELECT count(*)::integer FROM '+SQL+'.source_messages m WHERE m.channel_key=c.channel_key AND (SELECT count(*) FROM '+SQL+'.source_attachments a WHERE a.channel_key=m.channel_key AND a.message_id=m.message_id AND a.status=\'verified_bytes\') <> m.image_count) AS incomplete_posts FROM '+SQL+'.channel_checkpoints c ORDER BY c.channel_key');
      return rows.map(r=>({channel:r.channel_key,lastCheckpoint:r.updated_at,cycleComplete:r.last_scan_complete,pendingPages:r.pending_pages,verifiedOriginals:Number(r.original_images_verified),sourceFailures:Number(r.source_failures),incompletePosts:Number(r.incomplete_posts)}));
    }
  };
}
module.exports={makeStore};
