'use strict';
// Private state. Idempotent page writes; credentials and signed URLs NEVER persisted.
const {neon}=require('@neondatabase/serverless');
const {randomUUID}=require('node:crypto');
function connect(connection,channels){
  if(!connection)throw Error('missing_private_results_database');
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
   ¶»§q«^