'use strict';
// Incremental, read-only Discord poll; the GitHub workflow publishes the roster overlay.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const dataPath = path.join(root, 'discord-utc-roster.json');
const browserPath = path.join(root, 'discord-utc-roster.js');
const sourcePath = path.join(root, 'member-timezones-source.js');
const BLANK = {lastMessageId: null, members: [], pending: []};

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
  const source = fs.readFileSync(sourcePath, 'utf8');
  const match = source.match(/const tsv=\`([\s\S]*?)\`;/);
  if (!match) throw new Error('Cannot locate member-timezones-source.js TSV');
  const lines = match[1].replace(/\\t/g, '\t').replace(/\\n/g, '\n').split(/\r?\n/);
  const map = new Map();
  for (const line of lines.slice(1)) {
    const [name, status, , , , location] = line.split('\t');
    if (name && status) map.set(key(name), {name, status, country: location || ''});
  }
  // Aliases from the authoritative source: retain known canonical game identities.
  const aliasBlock = source.match(/const aliases=\{([\s\S]*?)\};/);
  if (aliasBlock) {
    const rx = /'([^']+)'\s*:\s*'([^']+)'/g;
    for (const pair of aliasBlock[1].matchAll(rx)) {
      const target = map.get(key(pair[2]));
      if (target) map.set(key(pair[1]), target);
    }
  }
  return map;
}
function reconcile(state, message, known, defaultClan) {
  if (!message?.author?.id || message.author.bot) return;
  const utc = parseUtc(message.content);
  if (utc === null) return;
  const discordUserId = String(message.author.id);
  const old = state.members.find(m => m.discordUserId === discordUserId);
  const proposed = nameOf(message);
  const roster = known.get(key(proposed));
  const name = old?.name || roster?.name || proposed;
  const country = countryOf(message.content) || old?.country || '';
  // Do not alter a known player's AVENGERS/AV-2/inactive status.
  const status = roster?.status || old?.status || clanOf(message.content, defaultClan);
  if (!name || !['Active', 'AV2', 'Inactive'].includes(status)) {
    state.pending = state.pending.filter(p => p.discordUserId !== discordUserId);
    state.pending.push({discordUserId, proposedName: proposed, utc, country,
      reason: !name ? 'missing_game_name' : 'missing_clan', messageId: String(message.id)});
    return;
  }
  const conflict = state.members.find(m => key(m.name) === key(name) && m.discordUserId !== discordUserId);
  if (conflict) {
    state.pending = state.pending.filter(p => p.discordUserId !== discordUserId);
    state.pending.push({discordUserId, proposedName: proposed, utc, country,
      reason: 'name_already_linked_to_another_discord_account', messageId: String(message.id)});
    return;
  }
  const next = {discordUserId, name, status, utc, country,
    messageId: String(message.id), updatedAt: message.timestamp || new Date().toISOString()};
  if (old) Object.assign(old, next);
  else state.members.push(next);
  state.pending = state.pending.filter(p => p.discordUserId !== discordUserId);
}
function maxId(a, b) {
  if (!a) return String(b);
  return BigInt(b) > BigInt(a) ? String(b) : String(a);
}
async function fetchMessages(token, channelId, lastMessageId) {
  const query = new URLSearchParams({limit: '100'});
  if (lastMessageId) query.set('after', lastMessageId);
  const response = await fetch('https://discord.com/api/v10/channels/' + channelId + '/messages?' + query, {
    headers: {Authorization: 'Bot ' + token}
  });
  if (!response.ok) throw new Error('Discord messages request failed (' + response.status + '): ' + (await response.text()).slice(0, 250));
  const messages = await response.json();
  if (!Array.isArray(messages)) throw new Error('Discord messages response was not an array');
  return messages.sort((a, b) => BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0);
}
function load() {
  if (!fs.existsSync(dataPath)) return structuredClone(BLANK);
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  return {lastMessageId: data.lastMessageId || null,
    members: Array.isArray(data.members) ? data.members : [],
    pending: Array.isArray(data.pending) ? data.pending : []};
}
function save(state) {
  fs.writeFileSync(dataPath, JSON.stringify(state, null, 2) + '\n');
  const published = {members: state.members};
  fs.writeFileSync(browserPath, 'window.AVENGERS_DISCORD_UTC_ROSTER = ' + JSON.stringify(published, null, 2)
    .replace(/</g, '\\u003c') + ';\n');
}
async function main() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_UTC_CHANNEL_ID;
  const defaultClan = process.env.DISCORD_UTC_DEFAULT_CLAN || '';
  if (!token || !channelId || !/^\d{15,22}$/.test(channelId)) {
    console.log('UTC sync not configured: set DISCORD_BOT_TOKEN and DISCORD_UTC_CHANNEL_ID. No changes made.');
    return;
  }
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
      reconcile(state, message, known, defaultClan);
    }
  }
  state.lastMessageId = nextId;
  save(state);
  console.log('UTC roster members: ' + state.members.length + '; pending: ' + state.pending.length);
}
if (require.main === module) main().catch(err => {console.error(err); process.exitCode = 1;});
module.exports = {parseUtc, countryOf, nameOf, clanOf, reconcile, knownRoster};
