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
  const explicit = input.match(/\bcountry\s*[:=]\s*([^\n|,;]{2,60})/i);
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
    const [name, , , , , location] = line.split('\t');
    if (name) historical.set(key(name), {name, status:'Inactive', country: location || ''});
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
    const row = {name, status, country: old?.country || ''};
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
// The channel is for submissions, not proof that a Discord nickname owns an
// existing in-game identity. Trusted onboarding roles can automatically add
// genuinely new names. Existing identities require an explicitly verified link.
function onboardingPolicy() {
  const trustedRoleIds = String(process.env.DISCORD_UTC_TRUSTED_ROLE_IDS || '')
    .split(',').map(x => x.trim()).filter(Boolean);
  if (!trustedRoleIds.length || trustedRoleIds.some(x => !/^\d{15,22}$/.test(x)))
    throw new Error('Set DISCORD_UTC_TRUSTED_ROLE_IDS to at least one valid Discord role ID');
  let verifiedLinks;
  try { verifiedLinks = JSON.parse(process.env.DISCORD_UTC_VERIFIED_LINKS || '{}'); }
  catch { throw new Error('DISCORD_UTC_VERIFIED_LINKS must be a valid private JSON object'); }
  if (!verifiedLinks || Array.isArray(verifiedLinks) || typeof verifiedLinks !== 'object')
    throw new Error('DISCORD_UTC_VERIFIED_LINKS must be a JSON object');
  return {trustedRoleIds,verifiedLinks};
}
function submitPending(state, message, proposedName, utc, country, reason) {
  const discordUserId = String(message.author.id);
  state.pending = state.pending.filter(p => p.discordUserId !== discordUserId);
  state.pending.push({discordUserId, proposedName, utc, country,
    reason, messageId:String(message.id)});
}
function reconcile(state, message, known, defaultClan, policy = {}) {
  if (!message?.author?.id || message.author.bot) return;
  const utc = parseUtc(message.content);
  if (utc === null) return;
  const discordUserId = String(message.author.id);
  const old = state.members.find(m => m.discordUserId === discordUserId);
  const proposed = nameOf(message);
  const country = countryOf(message.content) || old?.country || '';
  const trustedIds = policy.trustedRoleIds || [];
  const roles = Array.isArray(message.member?.roles) ? message.member.roles.map(String) : [];
  if (!trustedIds.length || !roles.some(role => trustedIds.includes(role))) {
    submitPending(state,message,proposed,utc,country,
      !trustedIds.length ? 'trusted_role_not_configured' : 'untrusted_role');
    return;
  }
  // An admin-confirmed ID→game-name mapping is stored only in a GitHub secret.
  const linkedName = policy.verifiedLinks?.[discordUserId];
  const linkedRoster = linkedName ? known.get(key(linkedName)) : null;
  if (linkedName && !linkedRoster) {
    submitPending(state,message,proposed,utc,country,'verified_link_not_in_roster');
    return;
  }
  const claimedRoster = known.get(key(proposed));
  // A new Discord account cannot claim an existing game identity merely by
  // choosing its nickname or typing Name: ... in a message.
  if (!old && claimedRoster && (!linkedRoster || key(claimedRoster.name) !== key(linkedRoster.name))) {
    submitPending(state,message,proposed,utc,country,'existing_identity_requires_verification');
    return;
  }
  if (old && linkedRoster && key(old.name) !== key(linkedRoster.name)) {
    submitPending(state,message,proposed,utc,country,'linked_identity_mismatch');
    return;
  }
  if (!old && !linkedRoster && !claimedRoster &&
    !/\b(?:game\s*name|member|player|name)\s*[:=]\s*[^\n|,;]{1,70}/i.test(String(message.content||''))) {
    submitPending(state,message,proposed,utc,country,'explicit_game_name_required');
    return;
  }
  const name = old?.name || linkedRoster?.name || proposed;
  const status = old?.status || linkedRoster?.status || clanOf(message.content, defaultClan);
  if (!name || !['Active', 'AV2', 'Inactive'].includes(status)) {
    submitPending(state,message,proposed,utc,country,
      !name ? 'missing_game_name' : 'missing_clan');
    return;
  }
  const conflict = state.members.find(m => key(m.name) === key(name) && m.discordUserId !== discordUserId);
  if (conflict) {
    submitPending(state,message,proposed,utc,country,
      'name_already_linked_to_another_discord_account');
    return;
  }
  const next = {discordUserId, name, status, utc, country,
    messageId:String(message.id), updatedAt:message.timestamp || new Date().toISOString()};
  if (old) Object.assign(old,next);
  else state.members.push(next);
  state.pending = state.pending.filter(p => p.discordUserId !== discordUserId);
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
  if (!messages.length) return;
  const nextId = messages.reduce((id, m) => maxId(id, m.id), state.lastMessageId);
  if (!state.lastMessageId && process.env.DISCORD_UTC_BACKFILL !== 'true') {
    // On first configuration, begin with future posts instead of bulk-importing old recruitment chatter.
    state.lastMessageId = nextId;
    save(state);
    console.log('Initialized checkpoint; future UTC posts will be processed.');
    return;
  }
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
  encryptState, decryptState, publicProjection, fetchMessages, onboardingPolicy};
