'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const sql=fs.readFileSync(path.join(__dirname,'../database/migrations/001_private_dispatch_ledger.sql'),'utf8');
test('schema is isolated and retains all five expected private tables',()=>{
 assert.match(sql,/CREATE SCHEMA IF NOT EXISTS avengers_dispatch_private;/);
 assert.match(sql,/REVOKE ALL ON SCHEMA avengers_dispatch_private FROM PUBLIC;/);
 for(const table of ['publication_slots','send_intents','message_receipts','audit_events','runtime_safety'])
  assert.match(sql,new RegExp('CREATE TABLE IF NOT EXISTS avengers_dispatch_private\\.'+table+' \\('));
 assert.doesNotMatch(sql,/CREATE TABLE[^;]*public\./i);
});
test('event-time clan + kind + event is uniquely tracked and corrections stay serialized',()=>{
 assert.match(sql,/UNIQUE \(kind,event_id,event_time_clan\)/);
 assert.match(sql,/CREATE UNIQUE INDEX IF NOT EXISTS av_dispatch_one_unresolved_intent/);
 assert.match(sql,/WHERE intent_status = 'awaiting_manual_receipt'/);
 assert.match(sql,/CREATE UNIQUE INDEX IF NOT EXISTS av_dispatch_one_current_message/);
 assert.match(sql,/WHERE receipt_status = 'active'/);
 assert.match(sql,/CREATE UNIQUE INDEX IF NOT EXISTS av_dispatch_one_retiring_message/);
 assert.match(sql,/WHERE receipt_status = 'awaiting_manual_retirement'/);
 assert.match(sql,/UNIQUE \(discord_channel_id,discord_message_id\)/);
 assert.match(sql,/CONSTRAINT receipt_matches_approved_intent FOREIGN KEY/);
 assert.match(sql,/destination_channel_id,projection_sha256,image_sha256,template_version/);
});
test('explicit disable for unattended Discord send, delete and public endpoint',()=>{
 for(const toggle of ['automatic_discord_send_enabled','automatic_discord_delete_enabled','publication_endpoint_enabled'])
  assert.match(sql,new RegExp(toggle+' boolean NOT NULL DEFAULT FALSE CHECK \\('+toggle+' = FALSE\\)'));
 assert.match(sql,/approved_for_automatic_send boolean NOT NULL DEFAULT FALSE/);
 assert.doesNotMatch(sql,/\bCREATE (TRIGGER|FUNCTION|PROCEDURE)\b/i);
});
test('prepared v1 applies no role grants, public endpoints, secrets or destructive DML',()=>{
 assert.doesNotMatch(sql,/^GRANT\s/mi);
 assert.doesNotMatch(sql,/^\s*(DELETE\s+FROM|DROP\s+TABLE|TRUNCATE|ALTER\s+ROLE|CREATE\s+ROLE)\b/mi);
 assert.doesNotMatch(sql,/DISCORD_BOT_TOKEN|sk-[a-zA-Z0-9]+|postgresql:\/\//);
 assert.match(sql,/inherits neon_superuser/);
 assert.match(sql,/v1 migration intentionally grants NO application role access/);
});
