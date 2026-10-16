'use strict';
// Incremental, read-only Discord poll; the GitHub workflow publishes the roster overlay.
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const dataPath = path.join(root, 'discord-utc-roster.json');
const browserPath = path.join(root, 'discord-utc-roster.js');
const sourcePath = path.join(root, 'member-timezones-source.js');
const BLANK = {lastMessageId: null, members: [], pending: []};

// The repository and GitHub Pages are public. Encrypt raw Discord message IDs,
// author IDs, review queue, and checkpoints before committing any state.
function stateKey(secret) {
  if (typeof secret !== 'string' || secret.length < 32)
    throw new Error('DISCORD_UTC_STATE_KEY must be a secret of at least 32 characters');
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}
function encryptState(state, secret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', stateKey(secret), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(state), 'utf8'), cipher.final()
  ]);
  return {version: 1, algorithm: 'aes-256-gcm',
    iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64')};
}
function decryptState(payload, secret) {
  if (payload?.version !== 1 || payload.algorithm !== 'aes-256-gcm')
    throw new Error('Unsupported encrypted Discord roster state');
  const decipher = crypto.createDecipheriv('aes-256-gcm', stateKey(secret),
    Buffer.from(payload.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64')), decipher.final()
  ]).toString('utf8');
  const state = JSON.parse(plaintext);
  if (!Array.isArray(state.members) || !Array.isArray(state.pending))
    throw new Error('Invalid decrypted Discord roster state');
  return state;
}
function publicProjection(state) {
  // Explicit allowlist. Never publish author IDs, message IDs or review queue.
  return {members: state.members.map(m => ({
    name: m.name, status: m.status, utc: m.utc, country: m.country
  }))};
}

function parseUtc(text) {
  const input = String(text || '').replace(/\u2212/g, '-');
  const match = input.match(/\b(?:UTC|GMT)\s*([+-])\s*(\d{1,2})(?::([0-5]\d)|\.(\d{1,2}))?(?!\d)/i)
    || input.match(/^\s*([+-])\s*(\d{1,2})(?::([0-5]\d)|\.(\d{1,2}))?(?=\s|$|[,|])/);
  if (!match) return null;
  const hour = Number(match[2]);
  const minutes = match[3] ? Number(match[3]) : (match[4] ? Number('0.' + match[4]) * 60 : 0);
  const value = (match[1] === '-' ? -1 : 1) * (hour + minutes / 60);
  if (!Number.isFinite(value) || value < -12 || value > 14 || Math.round(minutes) !== minutes) return null;
  return Math.round(value * 100) / 100;
}
function countryOf(text) {
  const input = String(text || '');
  const explicit = input.match(/\b(?:country|location)\s*[:=]\s*([^\n|,;]{2,60})/i);
  if (explicit) return explicit[1].trim();
  const compact = input.match(/\b(?:UTC|GMT)\s*[+-]\s*\d{1,2}(?::[0-5]\d|\.\d{1,2})?\s*[,|]\s*([a-z][\w \-'.()]{1,59})(?:$|[\n|,;])/i);
  return compact ? compact[1].trim() : '';
}
function nameOf(message) {
  const input = String(message.content || '');
  const explicit = input.match(/\b(?:game\s*name|member|player|name)\s*[:=]\s*([^\n|,;]{1,70})/i);
  return String((explicit && explicit[1]) || message.member?.nick
    || message.author?.global_name || message.author?.username || '').trim().slice(0, 70);
}
function clanOf(text, fallback) {
  const match = String(text || '').match(/\b(?:clan|team)\s*[:=]\s*(AVENGERS|AV-2)\b/i);
  if (match) return match[1].toUpperCase() === 'AV-2' ? 'AV2' : 'Active';
  if (fallback === 'AV-2') return 'AV2';
  if (fallback === 'AVENGERS') return 'Active';
  return null;
}
function key(name) { return String(name || '').trim().toLocaleLowerCase('en'); }
function knownRoster() {
  // Historical timezones provide known identities and country metadata, but
  // their Oct 1 clan status is stale. The Oct 15 snapshot controls membership.
  const source = fs.readFileSync(sourcePath, 'utf8');
  const match = source.match(/const tsv=`([\s\S]*?)`;/);
  if (!match) throw new Error('Cannot locate member-timezones-source.js TSV');
  const lines = match[1].replace(/\\t/g, '\t').replace(/\\n/g, '\n').split(/\r?\n/);
  const historical = new Map();
  for (const line of lines.slice(1)) {
    const [name, , utcRaw, , , location] = line.split('\t');
    const utc = utcRaw === '' ? null : Number(utcRaw);
    if (name) historical.set(key(name), {name, status:'Inactive',
      utc:Number.isFinite(utc)?utc:null,country:location || ''});
  }

  const rosterPath = path.join(root, 'roster-stars-snapshot-2026-10-15.js');
  const rosterSource = fs.readFileSync(rosterPath, 'utf8');
  function parsedArray(name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const found = rosterSource.match(new RegExp('const ' + escaped + '=(\\[[^\\n]+\\]);'));
    if (!found) throw new Error('Cannot find ' + name + ' in current roster source');
    return JSON.parse(found[1]);
  }
  const avengers = parsedArray('avengers');
  const av2 = parsedArray('av2Stars');
  // Current display names in the Stars snapshot must remain linked to their
  // historical profile names from the October 15 Sparks roster source.
  const av2RosterSource = fs.readFileSync(path.join(root, 'av2-roster-snapshot-2026-10-15.js'),'utf8');
  const av2RosterMatch = av2RosterSource.match(/const entries=(\[[^\n]+\]);/);
  if (!av2RosterMatch) throw new Error('Cannot find October 15 AV-2 profile mappings');
  const av2Profiles = new Map(JSON.parse(av2RosterMatch[1]).map(([name,,profile]) => [name,profile||name]));
  if (avengers.length !== 48 || av2.length !== 50 || av2Profiles.size !== 50 ||
      av2.some(([name]) => !av2Profiles.has(name)))
    throw new Error('Incomplete or mismatched October 15 current roster baseline');
  const current = new Map();
  function addCurrent(name, status, profileName) {
    const old = historical.get(key(profileName || name)) || historical.get(key(name));
    const row = {name, status, utc:old?.utc ?? null, country: old?.country || ''};
    for (const identifier of [name, profileName].filter(Boolean)) {
      const k = key(identifier);
      if (current.has(k) && current.get(k).name !== name)
        throw new Error('Current roster identity collision: ' + identifier);
      current.set(k, row);
    }
  }
  for (const [name, , profileName] of avengers) addCurrent(name, 'Active', profileName);
  for (const [name] of av2) addCurrent(name, 'AV2', av2Profiles.get(name));
  // Explicit October 15 council correction beyond the 50 AV-2 screenshots.
  addCurrent('AV-DrDetroit', 'AV2');
  addCurrent('AV-Starred', 'AV2');

  const map = new Map(historical);
  for (const [k, value] of current) map.set(k, value);
  // Legacy aliases should never override a name confirmed in the new snapshot.
  const aliasBlock = source.match(/const aliases=\{([\s\S]*?)\};/);
  if (aliasBlock) {
    const rx = /'([^']+)'\s*:\s*'([^']+)'/g;
    for (const pair of aliasBlock[1].matchAll(rx)) {
      const target = map.get(key(pair[2]));
      if (target && !current.has(key(pair[1]))) map.set(key(pair[1]), target);
    }
  }
  // Historical aliases verified in council corrections.
  if (map.has(key('AV-Zolika.x.Kira')))
    map.set(key('AV-Zolika.x.TheBoss'), map.get(key('AV-Zolika.x.Kira')));
  if (map.has(key('AV-ColdCreeps')))
    map.set(key('take.them.out'), map.get(key('AV-ColdCreeps')));
  return map;
}
// Members can self-report their first qualifying UTC/location message.
// Council members may additionally report for exactly one mentioned member,
// but only to fill fields not already present in the authoritative roster.
// The council role is identified by Discord role ID, never by username.
function onboardingPolicy() {
  const councilRoleIds = String(process.env.DISCORD_UTC_COUNCIL_ROLE_IDS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  if (councilRoleIds.some(s => !/^\d{15,22}$/.test(s)))
    throw new Error('DISCORD_UTC_COUNCIL_ROLE_IDS must contain numeric Discord role IDs');
  let verifiedLinks;
  try { verifiedLinks = JSON.parse(process.env.DISCORD_UTC_VERIFIED_LINKS || '{}'); }
  catch { throw new Error('DISCORD_UTC_VERIFIED_LINKS must be a private JSON object'); }
  if (!verifiedLinks || Array.isArray(verifiedLinks) || typeof verifiedLinks !== 'object')
    throw new Error('DISCORD_UTC_VERIFIED_LINKS must be a JSON object');
  return {councilRoleIds,verifiedLinks};
}
function submitPending(state, message, proposedName, utc, country, reason, targetId) {
  const discordUserId = String(targetId || message.author.id);
  state.pending = state.pending.filter(p => p.discordUserId !== discordUserId);
  state.pending.push({discordUserId,submittedBy:String(message.author.id),
    proposedName,utc,country,reason,messageId:String(message.id)});
}
function explicitGameName(content) {
  return /\b(?:game\s*name|member|player|name)\s*[:=]\s*[^\n|,;]{1,70}/i.test(String(content||''));
}
function matchedIdentity(known, name) {
  return known.get(key(name)) || null;
}
function councilTarget(message) {
  const mentions=Array.isArray(message.mentions)?message.mentions:[];
  if (mentions.length!==1) return null;
  const target=mentions[0];
  if (!target?.id || String(target.id)===String(message.author?.id) || target.bot) return null;
  return {id:String(target.id),
    name:String(target.member?.nick || target.global_name || target.username || '').trim()};
}
function isMissing(value) { return value==null || String(value).trim()===''; }
function reconcile(state, message, known, defaultClan, policy = {}) {
  if (!message?.author?.id || message.author.bot) return;
  const utc=parseUtc(message.content);
  const providedCountry=countryOf(message.content);
  const authorId=String(message.author.id);
  const mentions=Array.isArray(message.mentions)?message.mentions:[];
  const isProxy=mentions.some(m=>m?.id && String(m.id)!==authorId);
  // A member's own submission needs UTC. Council may fill only country
  // when an existing member has no logged country yet.
  if(utc===null && (!isProxy || !providedCountry)) return;
  const roles=Array.isArray(message.member?.roles)?message.member.roles.map(String):[];

  if (isProxy) {
    const target=councilTarget(message);
    if (!target) {
      submitPending(state,message,'',utc,providedCountry,'requires_exactly_one_tagged_member');
      return;
    }
    if (!(policy.councilRoleIds||[]).some(id=>roles.includes(id))) {
      submitPending(state,message,target.name,utc,providedCountry,
        policy.councilRoleIds?.length?'council_role_required':'council_role_not_configured',target.id);
      return;
    }
    // Use the actual mention target, not an untrusted Name: field in the
    // posting councillor's message.
    const verified=policy.verifiedLinks?.[target.id];
    const knownMember=matchedIdentity(known,verified||target.name);
    if (!knownMember || knownMember.status==='Inactive') {
      submitPending(state,message,target.name,utc,providedCountry,
        'tagged_member_not_in_active_roster',target.id);
      return;
    }
    if (verified && key(knownMember.name)!==key(matchedIdentity(known,target.name)?.name||knownMember.name)) {
      submitPending(state,message,target.name,utc,providedCountry,
        'tagged_identity_conflict',target.id);
      return;
    }
    const old=state.members.find(m=>m.discordUserId===target.id);
    if (old && key(old.name)!==key(knownMember.name)) {
      submitPending(state,message,target.name,utc,providedCountry,
        'tagged_identity_conflict',target.id);
      return;
    }
    const conflict=state.members.find(m=>key(m.name)===key(knownMember.name)&&m.discordUserId!==target.id);
    if (conflict) {
      submitPending(state,message,target.name,utc,providedCountry,
        'name_already_linked_to_another_discord_account',target.id);
      return;
    }
    // Council is allowed to supply MISSING data only; never overwrite
    // existing UTC/country either from the historical roster or Discord.
    const baselineUtc=old?.utc ?? knownMember.utc ?? null;
    const baselineCountry=old?.country || knownMember.country || '';
    if (!isMissing(baselineUtc)&&!isMissing(baselineCountry)) return;
    const nextUtc=isMissing(baselineUtc)?utc:baselineUtc;
    const nextCountry=isMissing(baselineCountry)?providedCountry:baselineCountry;
    if (isMissing(nextCountry)) {
      submitPending(state,message,target.name,utc,providedCountry,'country_missing',target.id);
      return;
    }
    const next={discordUserId:target.id,name:knownMember.name,status:knownMember.status,
      utc:nextUtc,country:nextCountry,
      messageId:String(message.id),updatedAt:message.timestamp||new Date().toISOString(),
      source:'council'};
    if(old)Object.assign(old,next);else state.members.push(next);
    state.pending=state.pending.filter(p=>p.discordUserId!==target.id);
    return;
  }

  // The member's own FIRST qualifying submission is accepted without any
  // role requirement. Later posts cannot silently change that submission.
  const old=state.members.find(m=>m.discordUserId===authorId);
  if(old?.source==='self') return;
  const proposed=nameOf(message);
  const claimed=matchedIdentity(known,proposed);
  const verifiedName=policy.verifiedLinks?.[authorId];
  const linked=verifiedName?matchedIdentity(known,verifiedName):null;
  if(verifiedName && !linked) {
    submitPending(state,message,proposed,utc,providedCountry,'verified_link_not_in_roster');
    return;
  }
  // Existing users may be matched through the Discord member nickname.
  // A contradictory explicit Name: claim must be reviewed instead of guessed.
  const nickname=String(message.member?.nick||'').trim();
  const nickRoster=matchedIdentity(known,nickname);
  if(linked && claimed && key(linked.name)!==key(claimed.name)) {
    submitPending(state,message,proposed,utc,providedCountry,'linked_identity_mismatch');
    return;
  }
  if(!linked && claimed && nickRoster && key(claimed.name)!==key(nickRoster.name)) {
    submitPending(state,message,proposed,utc,providedCountry,'nickname_identity_conflict');
    return;
  }
  if(!linked && claimed && !nickRoster) {
    submitPending(state,message,proposed,utc,providedCountry,'existing_identity_requires_nickname_match');
    return;
  }
  if(!linked && !claimed && nickRoster && explicitGameName(message.content)) {
    submitPending(state,message,proposed,utc,providedCountry,'nickname_identity_conflict');
    return;
  }
  const knownMember=linked||claimed;
  if(old && knownMember && key(old.name)!==key(knownMember.name)) {
    submitPending(state,message,proposed,utc,providedCountry,'linked_identity_mismatch');
    return;
  }
  // For newcomers, an unambiguous Discord *server nickname* is sufficient
  // when the post includes a clan; no special form or Council role is needed.
  // Account usernames alone are not assumed to be in-game names.
  if(!old && !knownMember && !explicitGameName(message.content)
      && !String(message.member?.nick||'').trim()) {
    submitPending(state,message,proposed,utc,providedCountry,'explicit_game_name_required');
    return;
  }
  const name=old?.name||knownMember?.name||proposed;
  const status=knownMember?.status||old?.status||clanOf(message.content,defaultClan);
  if(!name||!['Active','AV2'].includes(status)) {
    submitPending(state,message,proposed,utc,providedCountry,'missing_or_inactive_clan');
    return;
  }
  const conflict=state.members.find(m=>key(m.name)===key(name)&&m.discordUserId!==authorId);
  if(conflict) {
    submitPending(state,message,proposed,utc,providedCountry,
      'name_already_linked_to_another_discord_account');
    return;
  }
  if(!providedCountry && isMissing(old?.country)&&isMissing(knownMember?.country)) {
    submitPending(state,message,proposed,utc,providedCountry,'country_missing');
    return;
  }
  const country=providedCountry||old?.country||knownMember?.country||'';
  const next={discordUserId:authorId,name,status,utc,country,
    messageId:String(message.id),updatedAt:message.timestamp||new Date().toISOString(),
    source:'self'};
  if(old)Object.assign(old,next);else state.members.push(next);
  state.pending=state.pending.filter(p=>p.discordUserId!==authorId);
}

function maxId(a, b) {
  if (!a) return String(b);
  return BigInt(b) > BigInt(a) ? String(b) : String(a);
}
async function fetchMessages(token, channelId, lastMessageId) {
  // Discord message pages are newest-first. Read backwards until we reach the
  // saved checkpoint; a single "after" query can silently skip >100 messages.
  const collected = [];
  let before = null;
  let pages = 0;
  while (true) {
    if (++pages > 100) throw new Error('Discord UTC backlog exceeded 10,000 messages; no checkpoint advanced');
    const query = new URLSearchParams({limit: '100'});
    if (before) query.set('before', before);
    const response = await fetch('https://discord.com/api/v10/channels/' + channelId + '/messages?' + query, {
      headers: {Authorization: 'Bot ' + token}
    });
    if (!response.ok) throw new Error('Discord messages request failed (' + response.status + '): ' + (await response.text()).slice(0, 250));
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error('Discord messages response was not an array');
    if (!batch.length) break;
    for (const m of batch) {
      if (!lastMessageId || BigInt(m.id) > BigInt(lastMessageId)) collected.push(m);
    }
    const oldest = batch.reduce((id, m) => !id || BigInt(m.id) < BigInt(id) ? String(m.id) : id, null);
    if (lastMessageId && BigInt(oldest) <= BigInt(lastMessageId)) break;
    if (batch.length < 100) break;
    // Normally the first run just checkpoints the latest messages, without
    // importing all historical channel discussion unless backfill is requested.
    if (!lastMessageId && process.env.DISCORD_UTC_BACKFILL !== 'true') break;
    if (oldest === before) throw new Error('Discord paging cursor did not advance');
    before = oldest;
  }
  return collected.sort((a, b) => BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0);
}

function load() {
  if (!fs.existsSync(dataPath)) return structuredClone(BLANK);
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  if (data.version === 1) return decryptState(data, process.env.DISCORD_UTC_STATE_KEY);
  // Permit only the known empty bootstrap file; never migrate nonempty plaintext
  // into a public commit accidentally. Such a migration needs deliberate review.
  if (data.lastMessageId == null && Array.isArray(data.members) &&
    !data.members.length && Array.isArray(data.pending) && !data.pending.length)
    return structuredClone(BLANK);
  throw new Error('Existing Discord roster state is unencrypted; manual migration required');
}
function save(state) {
  const encrypted = encryptState(state, process.env.DISCORD_UTC_STATE_KEY);
  fs.writeFileSync(dataPath, JSON.stringify(encrypted, null, 2) + '\n');
  fs.writeFileSync(browserPath,
    'window.AVENGERS_DISCORD_UTC_ROSTER = ' +
    JSON.stringify(publicProjection(state), null, 2).replace(/</g, '\\u003c') +
    ';\n');
}

function initializeCheckpoint(state, messages, backfill) {
  if (state.lastMessageId) return false;
  // A new empty channel must not lose its first future submission. Zero means
  // 'begin from the very first message', rather than 'skip the first message'.
  // When history already exists and backfill is off, checkpoint the latest
  // message so old chatter is not bulk-imported.
  if (messages.length && backfill === 'true') return false;
  state.lastMessageId = messages.length
    ? messages[messages.length - 1].id
    : '0';
  return true;
}

async function main() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_UTC_CHANNEL_ID;
  const defaultClan = process.env.DISCORD_UTC_DEFAULT_CLAN || '';
  if (!token || !channelId || !/^\d{15,22}$/.test(channelId))
    throw new Error('UTC sync not configured: set DISCORD_BOT_TOKEN and DISCORD_UTC_CHANNEL_ID');
  stateKey(process.env.DISCORD_UTC_STATE_KEY); // Fail closed before fetching.
  const policy = onboardingPolicy();
  const state = load();
  const messages = await fetchMessages(token, channelId, state.lastMessageId);
  if (initializeCheckpoint(state, messages, process.env.DISCORD_UTC_BACKFILL)) {
    save(state);
    console.log('Initialized UTC checkpoint; future posts will be processed.');
    return;
  }
  if (!messages.length) return;
  const nextId = messages.reduce((id, m) => maxId(id, m.id), state.lastMessageId);
  const known = knownRoster();
  for (const message of messages) {
    if (!state.lastMessageId || BigInt(message.id) > BigInt(state.lastMessageId)) {
      reconcile(state, message, known, defaultClan, policy);
    }
  }
  state.lastMessageId = nextId;
  save(state);
  console.log('UTC roster members: ' + state.members.length + '; pending: ' + state.pending.length);
}
if (require.main === module) main().catch(err => {console.error(err); process.exitCode = 1;});
module.exports = {parseUtc, countryOf, nameOf, clanOf, reconcile, knownRoster,
  encryptState, decryptState, publicProjection, fetchMessages, onboardingPolicy,
  initializeCheckpoint};
