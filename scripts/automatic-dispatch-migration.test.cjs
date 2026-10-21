'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const sql=fs.readFileSync(require('node:path').join(__dirname,'../database/migrations/003_guarded_automatic_dispatch.sql'),'utf8');
test('automatic dispatch migration permits sends only with endpoint and leaves deletion hard-off',()=>{
 assert.match(sql,/automatic_discord_send_requires_endpoint/);
 assert.match(sql,/CHECK \(NOT automatic_discord_send_enabled OR publication_endpoint_enabled\)/);
 assert.match(sql,/automatic_discord_delete_hard_off/);
 assert.match(sql,/CHECK \(automatic_discord_delete_enabled = FALSE\)/);
 assert.match(sql,/DROP CONSTRAINT IF EXISTS send_intents_approved_for_automatic_send_check/);
 assert.match(sql,/automatic_send_is_first_publication_only/);
 assert.match(sql,/CHECK \(NOT approved_for_automatic_send OR intent_kind = 'first'\)/);
 assert.match(sql,/automatic_authorization_recorded/);
 assert.doesNotMatch(sql,/UPDATE avengers_dispatch_private\.runtime_safety/i);
 assert.doesNotMatch(sql,/automatic_discord_send_enabled\s*=\s*TRUE/i);
});
