'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const sql=fs.readFileSync(path.resolve(__dirname,'../database/migrations/002_restrict_dispatch_app_role.sql'),'utf8');
test('runtime role is created with Postgres defaults and no Neon-managed elevated memberships',()=>{
 assert.match(sql,/^CREATE ROLE avengers_dispatch_runtime LOGIN;$/m);
 assert.doesNotMatch(sql,/\bGRANT\s+(?:neon_superuser|avengers_private_owner)\b/i);
 assert.doesNotMatch(sql,/\bCREATEROLE|\bCREATEDB|\bSUPERUSER|\bBYPASSRLS/i);
});
test('allow only private ledger writes, history append and kill-switch read',()=>{
 assert.match(sql,/GRANT CONNECT ON DATABASE avengers_private TO avengers_dispatch_runtime;/);
 assert.match(sql,/GRANT USAGE ON SCHEMA avengers_dispatch_private TO avengers_dispatch_runtime;/);
 for(const table of ['publication_slots','send_intents','message_receipts'])assert(sql.includes('avengers_dispatch_private.'+table));
 assert.match(sql,/GRANT SELECT, INSERT ON avengers_dispatch_private\.audit_events/);
 assert.match(sql,/GRANT SELECT ON avengers_dispatch_private\.runtime_safety/);
 assert.doesNotMatch(sql,/GRANT\s+(?:DELETE|TRUNCATE|CREATE|ALL PRIVILEGES)/i);
 assert.doesNotMatch(sql,/GRANT\s+\w+(?:\s*,\s*\w+)*\s+ON\s+avengers_dispatch_private\.runtime_safety\s+TO/i);
});
test('no credentials, tokens, public endpoint or dispatch toggle',()=>{
 assert.doesNotMatch(sql,/PASSWORD|DATABASE_URL|DISCORD_BOT_TOKEN|https?:\/\/|CREATE\s+(?:FUNCTION|TRIGGER)|automatic_discord_(?:send|delete)_enabled/i);
 assert.doesNotMatch(sql,/\b(?:ALTER|UPDATE|DELETE|DROP|TRUNCATE)\b/i);
 assert.doesNotMatch(sql,/\b(?:CREATE|GRANT)\s+ROLE\s+.*neon_superuser/i);
});
