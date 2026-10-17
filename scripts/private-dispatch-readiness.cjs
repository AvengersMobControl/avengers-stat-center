'use strict';
// Offline/read-only #8 database privilege preflight. No credentials, network
// bootstrap, database mutations, public endpoints or Discord transport.
const EXPECTED_ROLE='avengers_dispatch_runtime';
const EXPECTED_DATABASE='avengers_private';
const READ_ONLY_SQL=`
SELECT
 current_user::text AS "connectedRole",
 session_user::text AS "authenticatedRole",
 current_database()::text AS "databaseName",
 COALESCE((SELECT rolcanlogin FROM pg_roles WHERE rolname=current_user), false) AS "canLogin",
 COALESCE((SELECT rolsuper FROM pg_roles WHERE rolname=current_user), true) AS "isSuperuser",
 COALESCE((SELECT rolcreaterole FROM pg_roles WHERE rolname=current_user), true) AS "canCreateRole",
 COALESCE((SELECT rolcreatedb FROM pg_roles WHERE rolname=current_user), true) AS "canCreateDatabase",
 COALESCE((SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user), true) AS "bypassesRls",
 EXISTS (
   SELECT 1 FROM pg_auth_members WHERE member=(
     SELECT oid FROM pg_roles WHERE rolname=current_user
   )
 ) AS "hasInheritedMembership",
 has_database_privilege(current_user,current_database(),'CREATE') AS "canCreateObjects",
 has_schema_privilege(current_user,'avengers_dispatch_private','USAGE') AS "canUsePrivateSchema",
 has_schema_privilege(current_user,'avengers_dispatch_private','CREATE') AS "canCreatePrivateSchemaObjects",
 has_table_privilege(current_user,'avengers_dispatch_private.publication_slots','SELECT') AS "slotRead",
 has_table_privilege(current_user,'avengers_dispatch_private.publication_slots','INSERT') AS "slotInsert",
 has_table_privilege(current_user,'avengers_dispatch_private.publication_slots','UPDATE') AS "slotUpdate",
 has_table_privilege(current_user,'avengers_dispatch_private.publication_slots','DELETE') AS "slotDelete",
 has_table_privilege(current_user,'avengers_dispatch_private.send_intents','SELECT') AS "intentRead",
 has_table_privilege(current_user,'avengers_dispatch_private.send_intents','INSERT') AS "intentInsert",
 has_table_privilege(current_user,'avengers_dispatch_private.send_intents','UPDATE') AS "intentUpdate",
 has_table_privilege(current_user,'avengers_dispatch_private.send_intents','DELETE') AS "intentDelete",
 has_table_privilege(current_user,'avengers_dispatch_private.message_receipts','SELECT') AS "receiptRead",
 has_table_privilege(current_user,'avengers_dispatch_private.message_receipts','INSERT') AS "receiptInsert",
 has_table_privilege(current_user,'avengers_dispatch_private.message_receipts','UPDATE') AS "receiptUpdate",
 has_table_privilege(current_user,'avengers_dispatch_private.message_receipts','DELETE') AS "receiptDelete",
 has_table_privilege(current_user,'avengers_dispatch_private.audit_events','SELECT') AS "auditRead",
 has_table_privilege(current_user,'avengers_dispatch_private.audit_events','INSERT') AS "auditInsert",
 has_table_privilege(current_user,'avengers_dispatch_private.audit_events','UPDATE') AS "auditUpdate",
 has_table_privilege(current_user,'avengers_dispatch_private.audit_events','DELETE') AS "auditDelete",
 has_table_privilege(current_user,'avengers_dispatch_private.runtime_safety','SELECT') AS "safetyRead",
 has_table_privilege(current_user,'avengers_dispatch_private.runtime_safety','INSERT') AS "safetyInsert",
 has_table_privilege(current_user,'avengers_dispatch_private.runtime_safety','UPDATE') AS "safetyUpdate",
 has_table_privilege(current_user,'avengers_dispatch_private.runtime_safety','DELETE') AS "safetyDelete",
 (SELECT COUNT(*)=1 FROM avengers_dispatch_private.runtime_safety) AS "exactlyOneSafetyRow",
 (SELECT automatic_discord_send_enabled FROM avengers_dispatch_private.runtime_safety WHERE singleton=TRUE)
   AS "automaticSendEnabled",
 (SELECT automatic_discord_delete_enabled FROM avengers_dispatch_private.runtime_safety WHERE singleton=TRUE)
   AS "automaticDeleteEnabled",
 (SELECT publication_endpoint_enabled FROM avengers_dispatch_private.runtime_safety WHERE singleton=TRUE)
   AS "publicationEndpointEnabled";
`.trim();

const desired={
 connectedRole:EXPECTED_ROLE,authenticatedRole:EXPECTED_ROLE,databaseName:EXPECTED_DATABASE,
 canLogin:true,isSuperuser:false,canCreateRole:false,canCreateDatabase:false,bypassesRls:false,
 hasInheritedMembership:false,canCreateObjects:false,canUsePrivateSchema:true,
 canCreatePrivateSchemaObjects:false,
 slotRead:true,slotInsert:true,slotUpdate:true,slotDelete:false,
 intentRead:true,intentInsert:true,intentUpdate:true,intentDelete:false,
 receiptRead:true,receiptInsert:true,receiptUpdate:true,receiptDelete:false,
 auditRead:true,auditInsert:true,auditUpdate:false,auditDelete:false,
 safetyRead:true,safetyInsert:false,safetyUpdate:false,safetyDelete:false,
 exactlyOneSafetyRow:true,automaticSendEnabled:false,automaticDeleteEnabled:false,
 publicationEndpointEnabled:false
};
function evaluate(snapshot){
 if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot))
   return {ready:false,failedChecks:['missing-database-evidence'],
     permitsAutomaticSend:false,permitsAutomaticDelete:false,permitsPublicEndpoint:false};
 const failedChecks=Object.entries(desired).filter(([key,value])=>snapshot[key]!==value)
   .map(([key])=>key);
 return {ready:failedChecks.length===0,failedChecks,
   // This is a credential/connection eligibility test, NOT permission to publish.
   permitsAutomaticSend:false,permitsAutomaticDelete:false,permitsPublicEndpoint:false};
}
async function inspect(client){
 if(!client||typeof client.query!=='function')return evaluate(null);
 try{
   const answer=await client.query(READ_ONLY_SQL);
   if(!answer||!Array.isArray(answer.rows)||answer.rows.length!==1)return evaluate(null);
   return evaluate(answer.rows[0]);
 }catch{
   // Do not print a PostgreSQL error that could include a connection string,
   // host, private table content or an accidental bearer token.
   return {ready:false,failedChecks:['database-query-failed'],
     permitsAutomaticSend:false,permitsAutomaticDelete:false,permitsPublicEndpoint:false};
 }
}
module.exports={READ_ONLY_SQL,evaluate,inspect};
