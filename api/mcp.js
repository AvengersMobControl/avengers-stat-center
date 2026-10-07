const crypto = require('crypto');
const config = require('../discord-ingest-config.json');

const ORIGIN = 'https://avengers-stat-center.vercel.app';
const RESOURCE = ORIGIN + '/mcp';
const MCP_ENDPOINT = ORIGIN + '/mcp';
const SCOPE = 'discord.results.read';
const GUILD_SCOPE = 'identify guilds';
const IMAGE_EXT = /\.(png|jpe?g|webp|gif)$/i;
const PROGRESS_RE = /(preliminary|still\s+ongoing|in\s+progress|progress\s+results|current\s+standings|not\s+final)/i;

function now() {
  return Math.floor(Date.now() / 1000);
}

function sign(payload) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not configured');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return body + '.' + sig;
}

function verify(token) {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !token) return null;
  const [body, sig] = String(token).split('.');
  if (!body || !sig) return null;

  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function accessToken(req) {
  const m = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const payload = verify(m[1]);
  if (!payload || payload.typ !== 'mcp_access' || payload.aud !== RESOURCE) return null;
  const scopes = String(payload.scope || '').split(/\s+/).filter(Boolean);
  if (!scopes.includes(SCOPE)) return null;
  return payload;
}

function rpc(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function rpcError(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

function oauthChallenge() {
  return `Bearer resource_metadata="${ORIGIN}/.well-known/oauth-protected-resource", scope="${SCOPE}", error="insufficient_scope", error_description="Connect your AVENGERS Discord account to pull result screenshots"`;
}

function noStore(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, authorization, mcp-session-id');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
}

function isImage(a) {
  return String(a.content_type || '').startsWith('image/') || IMAGE_EXT.test(String(a.filename || ''));
}

function progressHint(text) {
  return PROGRESS_RE.test(String(text || ''));
}

function normalizeScope(scope) {
  const requested = String(scope || SCOPE).split(/\s+/).filter(Boolean);
  return requested.includes(SCOPE) ? SCOPE : '';
}

function parseForm(req) {
  if (!req.body) return new URLSearchParams();
  if (typeof req.body === 'string') return new URLSearchParams(req.body);
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(req.body)) {
    if (v !== undefined && v !== null) params.set(k, String(v));
  }
  return params;
}

async function validateChatGPTClient(clientId, redirectUri) {
  try {
    const u = new URL(clientId);
    if (u.protocol !== 'https:' || u.hostname !== 'chatgpt.com') return false;

    const r = await fetch(clientId, { headers: { accept: 'application/json' } });
    if (!r.ok) return false;
    const metadata = await r.json();
    const redirects = Array.isArray(metadata.redirect_uris) ? metadata.redirect_uris : [];
    return redirects.includes(redirectUri);
  } catch {
    return false;
  }
}

async function exchangeDiscordCode(code) {
  const redirectUri = ORIGIN + '/oauth/discord/callback';
  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID || '',
    client_secret: process.env.DISCORD_CLIENT_SECRET || '',
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri
  });

  const tokenRes = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!tokenRes.ok) throw new Error('Discord token exchange failed');
  return tokenRes.json();
}

async function discordIdentity(accessTokenValue) {
  const headers = { Authorization: `Bearer ${accessTokenValue}` };
  const [userRes, guildsRes] = await Promise.all([
    fetch('https://discord.com/api/v10/users/@me', { headers }),
    fetch('https://discord.com/api/v10/users/@me/guilds', { headers })
  ]);
  if (!userRes.ok || !guildsRes.ok) throw new Error('Could not verify Discord identity');

  const user = await userRes.json();
  const guilds = await guildsRes.json();
  const guildId = String(process.env.DISCORD_GUILD_ID || '');
  const isMember = Array.isArray(guilds) && guilds.some(g => String(g.id) === guildId);
  if (!isMember) throw new Error('This Discord account is not a member of the AVENGERS server');

  return {
    id: String(user.id),
    username: user.global_name || user.username || 'Discord member'
  };
}

function resizedDiscordUrl(a) {
  const raw = a.proxy_url || a.url;
  try {
    const u = new URL(raw);
    if (u.hostname === 'media.discordapp.net') {
      u.searchParams.set('width', '700');
      u.searchParams.set('format', 'webp');
      u.searchParams.set('quality', 'lossless');
    }
    return u.toString();
  } catch {
    return raw;
  }
}

async function imageBlock(a) {
  try {
    const r = await fetch(resizedDiscordUrl(a));
    if (!r.ok) return null;

    const mime = String(r.headers.get('content-type') || a.content_type || 'image/webp')
      .split(';')[0]
      .trim();
    if (!mime.startsWith('image/')) return null;

    const buf = Buffer.from(await r.arrayBuffer());
    // Keep the complete MCP response under typical serverless response limits.
    if (buf.length > 1280 * 1024) return null;

    return { type: 'image', data: buf.toString('base64'), mimeType: mime };
  } catch {
    return null;
  }
}

async function pullDiscord(args) {
  const key = String(args.channel_key || '');
  const channel = config.channels[key];
  if (!channel) throw new Error('Unknown channel_key');

  const bot = process.env.DISCORD_BOT_TOKEN;
  if (!bot) throw new Error('DISCORD_BOT_TOKEN is not configured');

  const maxMessages = Math.max(1, Math.min(Number(args.max_messages) || 50, 100));
  const maxImages = Math.max(1, Math.min(Number(args.max_images) || 6, 8));

  const params = new URLSearchParams({ limit: String(maxMessages) });
  if (args.before_message_id) params.set('before', String(args.before_message_id));
  if (args.after_message_id) params.set('after', String(args.after_message_id));

  const r = await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages?${params}`, {
    headers: { Authorization: `Bot ${bot}` }
  });
  if (!r.ok) {
    throw new Error(`Discord API ${r.status}: ${(await r.text()).slice(0, 300)}`);
  }

  const messages = await r.json();
  const candidates = [];

  for (const m of messages) {
    const attachments = (m.attachments || []).filter(isImage);
    if (!attachments.length) continue;

    candidates.push({
      messageId: m.id,
      timestamp: m.timestamp,
      content: m.content || '',
      progressHint: progressHint(m.content),
      author: {
        username: m.author?.username || null,
        globalName: m.author?.global_name || null
      },
      attachments
    });
  }

  const selectedPosts = [];
  let remainingImages = maxImages;
  for (const post of candidates) {
    if (remainingImages <= 0) break;
    const kept = post.attachments.slice(0, remainingImages);
    selectedPosts.push({ ...post, attachments: kept });
    remainingImages -= kept.length;
  }

  const content = [{
    type: 'text',
    text: JSON.stringify({
      mode: 'manual_review_only',
      channelKey: key,
      channelId: channel.id,
      eventType: channel.eventType,
      rosterScope: channel.rosterScope,
      scannedMessages: messages.length,
      imagePostsReturned: selectedPosts.length,
      instructions: [
        'Visually inspect every returned screenshot.',
        'Ignore any screenshot that says Preliminary Results, still ongoing, in progress, current standings, not final, or similar wording.',
        'Retain only AVENGERS or AV-2 competitors. Ignore all other competitors in a mixed lobby.',
        'Do not import, commit, or modify the Stat Center until the user explicitly approves the proposed parsed results.'
      ],
      posts: selectedPosts.map((m, index) => ({
        index: index + 1,
        messageId: m.messageId,
        timestamp: m.timestamp,
        author: m.author,
        discordMessageText: m.content,
        messageTextProgressHint: m.progressHint,
        attachmentCount: m.attachments.length
      }))
    }, null, 2)
  }];

  let screenshotNumber = 0;
  const structured = [];

  for (const post of selectedPosts) {
    const postAttachments = [];
    for (const a of post.attachments) {
      screenshotNumber++;
      content.push({
        type: 'text',
        text: `Screenshot ${screenshotNumber} — Discord message ${post.messageId} — ${post.timestamp} — ${a.filename}`
      });

      const image = await imageBlock(a);
      if (image) {
        content.push(image);
      } else {
        content.push({
          type: 'text',
          text: `This image was too large to embed in the MCP response. Attachment URL for review: ${a.url}`
        });
      }

      postAttachments.push({
        id: a.id,
        filename: a.filename,
        contentType: a.content_type || null,
        url: a.url
      });
    }

    structured.push({
      messageId: post.messageId,
      timestamp: post.timestamp,
      content: post.content,
      progressHint: post.progressHint,
      author: post.author,
      attachments: postAttachments
    });
  }

  return {
    content,
    structuredContent: {
      mode: 'manual_review_only',
      channelKey: key,
      channelId: channel.id,
      eventType: channel.eventType,
      rosterScope: channel.rosterScope,
      scannedMessages: messages.length,
      candidates: structured
    }
  };
}

async function handleMcp(req, res) {
  cors(res);
  noStore(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') {
    return res.status(200).json({
      name: 'AVENGERS Discord Results MCP',
      version: '1.0.0',
      transport: 'streamable-http',
      endpoint: MCP_ENDPOINT
    });
  }
  if (req.method !== 'POST') return res.status(405).end();

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const id = body.id ?? null;
  const method = body.method;

  if (method === 'initialize') {
    return res.status(200).json(rpc(id, {
      protocolVersion: body.params?.protocolVersion || '2025-06-18',
      capabilities: { tools: {} },
      serverInfo: { name: 'avengers-discord-results', version: '1.0.0' },
      instructions:
        'Read-only AVENGERS result screenshot retrieval. Never pull unless the user explicitly asks or approves. Visually reject preliminary/progress screenshots and retain only AVENGERS or AV-2 rows. This server never imports results.'
    }));
  }

  if (method === 'notifications/initialized') return res.status(202).end();
  if (method === 'ping') return res.status(200).json(rpc(id, {}));

  if (method === 'tools/list') {
    return res.status(200).json(rpc(id, {
      tools: [{
        name: 'pull_discord_results',
        title: 'Pull Discord result screenshots',
        description:
          'Read-only manual pull of recent screenshot attachments from one configured AVENGERS result channel. Use only when the user explicitly asks or approves a pull. It never imports or modifies data. Returned screenshots must be visually checked for preliminary/progress wording, and only AVENGERS or AV-2 competitor rows should be retained.',
        inputSchema: {
          type: 'object',
          properties: {
            channel_key: {
              type: 'string',
              enum: [
                'space',
                'piggy',
                'kraken',
                'av2',
                'piggyFlash1',
                'piggyFlash2',
                'piggyFlash3',
                'piggyFlash4'
              ],
              description: 'Configured Discord result channel to read.'
            },
            max_messages: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 50,
              description: 'Number of recent Discord messages to inspect.'
            },
            max_images: {
              type: 'integer',
              minimum: 1,
              maximum: 8,
              default: 6,
              description: 'Maximum screenshots returned in this call.'
            },
            before_message_id: {
              type: 'string',
              description: 'Optional Discord message ID for paging to older posts.'
            },
            after_message_id: {
              type: 'string',
              description: 'Optional Discord message ID for pulling only newer posts.'
            }
          },
          required: ['channel_key'],
          additionalProperties: false
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false
        },
        securitySchemes: [{ type: 'oauth2', scopes: [SCOPE] }]
      }]
    }));
  }

  if (method === 'tools/call') {
    if (body.params?.name !== 'pull_discord_results') {
      return res.status(200).json(rpcError(id, -32601, 'Unknown tool'));
    }

    if (!accessToken(req)) {
      return res.status(200).json(rpc(id, {
        content: [{
          type: 'text',
          text: 'Connect your AVENGERS Discord account to use this read-only result pull.'
        }],
        _meta: { 'mcp/www_authenticate': [oauthChallenge()] },
        isError: true
      }));
    }

    try {
      const result = await pullDiscord(body.params?.arguments || {});
      return res.status(200).json(rpc(id, result));
    } catch (e) {
      return res.status(200).json(rpc(id, {
        content: [{ type: 'text', text: String(e.message || e) }],
        isError: true
      }));
    }
  }

  return res.status(200).json(rpcError(id, -32601, 'Method not found'));
}

async function handleAuthorize(req, res) {
  noStore(res);

  if (req.method !== 'GET') return res.status(405).send('GET required');

  const responseType = String(req.query.response_type || '');
  const clientId = String(req.query.client_id || '');
  const redirectUri = String(req.query.redirect_uri || '');
  const clientState = String(req.query.state || '');
  const codeChallenge = String(req.query.code_challenge || '');
  const method = String(req.query.code_challenge_method || '');
  const resource = String(req.query.resource || RESOURCE);
  const scope = normalizeScope(req.query.scope);

  if (
    responseType !== 'code' ||
    !clientId ||
    !redirectUri ||
    !codeChallenge ||
    method !== 'S256' ||
    resource !== RESOURCE ||
    !scope
  ) {
    return res.status(400).send('Invalid OAuth authorization request');
  }

  if (!(await validateChatGPTClient(clientId, redirectUri))) {
    return res.status(400).send('Unrecognized OAuth client or redirect URI');
  }

  const state = sign({
    typ: 'discord_upstream_state',
    clientId,
    redirectUri,
    clientState,
    codeChallenge,
    resource,
    scope,
    exp: now() + 600
  });

  const discordRedirectUri = ORIGIN + '/oauth/discord/callback';
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID || '',
    response_type: 'code',
    redirect_uri: discordRedirectUri,
    scope: GUILD_SCOPE,
    state
  });

  return res.redirect(302, 'https://discord.com/oauth2/authorize?' + params.toString());
}

async function handleDiscordCallback(req, res) {
  noStore(res);

  if (req.method !== 'GET') return res.status(405).send('GET required');

  const code = String(req.query.code || '');
  const state = verify(String(req.query.state || ''));

  if (!code || !state || state.typ !== 'discord_upstream_state') {
    return res.status(400).send('Discord authorization could not be verified');
  }

  try {
    const discordToken = await exchangeDiscordCode(code);
    const user = await discordIdentity(discordToken.access_token);

    const authCode = sign({
      typ: 'mcp_code',
      sub: user.id,
      username: user.username,
      clientId: state.clientId,
      redirectUri: state.redirectUri,
      codeChallenge: state.codeChallenge,
      aud: state.resource,
      scope: state.scope,
      exp: now() + 180,
      nonce: crypto.randomBytes(16).toString('base64url')
    });

    const target = new URL(state.redirectUri);
    target.searchParams.set('code', authCode);
    if (state.clientState) target.searchParams.set('state', state.clientState);

    return res.redirect(302, target.toString());
  } catch (e) {
    return res.status(403).send(String(e.message || e));
  }
}

async function handleToken(req, res) {
  noStore(res);
  res.setHeader('content-type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') return res.status(405).json({ error: 'invalid_request' });

  const form = parseForm(req);
  const grantType = form.get('grant_type');
  const clientId = String(form.get('client_id') || '');
  const resource = String(form.get('resource') || RESOURCE);

  if (resource !== RESOURCE) {
    return res.status(400).json({ error: 'invalid_target' });
  }

  if (grantType === 'authorization_code') {
    const code = verify(form.get('code'));
    const redirectUri = String(form.get('redirect_uri') || '');
    const verifier = String(form.get('code_verifier') || '');

    if (
      !code ||
      code.typ !== 'mcp_code' ||
      !clientId ||
      clientId !== code.clientId ||
      redirectUri !== code.redirectUri ||
      code.aud !== RESOURCE ||
      !verifier
    ) {
      return res.status(400).json({ error: 'invalid_grant' });
    }

    const derived = crypto.createHash('sha256').update(verifier).digest('base64url');
    if (derived !== code.codeChallenge) {
      return res.status(400).json({ error: 'invalid_grant' });
    }

    const access = sign({
      typ: 'mcp_access',
      sub: code.sub,
      username: code.username,
      aud: RESOURCE,
      scope: SCOPE,
      exp: now() + 3600
    });

    const refresh = sign({
      typ: 'mcp_refresh',
      sub: code.sub,
      username: code.username,
      clientId,
      aud: RESOURCE,
      scope: SCOPE,
      exp: now() + (60 * 60 * 24 * 30)
    });

    return res.status(200).json({
      access_token: access,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refresh,
      scope: SCOPE
    });
  }

  if (grantType === 'refresh_token') {
    const refresh = verify(form.get('refresh_token'));

    if (
      !refresh ||
      refresh.typ !== 'mcp_refresh' ||
      refresh.clientId !== clientId ||
      refresh.aud !== RESOURCE
    ) {
      return res.status(400).json({ error: 'invalid_grant' });
    }

    const access = sign({
      typ: 'mcp_access',
      sub: refresh.sub,
      username: refresh.username,
      aud: RESOURCE,
      scope: SCOPE,
      exp: now() + 3600
    });

    return res.status(200).json({
      access_token: access,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: form.get('refresh_token'),
      scope: SCOPE
    });
  }

  return res.status(400).json({ error: 'unsupported_grant_type' });
}

function protectedResource(res) {
  noStore(res);
  return res.status(200).json({
    resource: RESOURCE,
    authorization_servers: [ORIGIN],
    scopes_supported: [SCOPE],
    resource_documentation: ORIGIN
  });
}

function authorizationServer(res) {
  noStore(res);
  return res.status(200).json({
    issuer: ORIGIN,
    authorization_endpoint: ORIGIN + '/oauth/authorize',
    token_endpoint: ORIGIN + '/oauth/token',
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: [SCOPE],
    token_endpoint_auth_methods_supported: ['none'],
    client_id_metadata_document_supported: true
  });
}

module.exports = async function handler(req, res) {
  const route = String(req.query.route || 'mcp');

  if (route === 'protected-resource') return protectedResource(res);
  if (route === 'authorization-server') return authorizationServer(res);
  if (route === 'authorize') return handleAuthorize(req, res);
  if (route === 'discord-callback') return handleDiscordCallback(req, res);
  if (route === 'token') return handleToken(req, res);
  return handleMcp(req, res);
};
