'use strict';
// OAuth client allowlist and auth gate for the read-only AVENGERS Discord MCP connector.
const { test } = require('node:test');
const assert = require('node:assert/strict');

process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-only-secret-not-used-in-production';
const { cimdClientFor, validateOAuthClient, authorizationServer, handleMcp } = require('../api/mcp.js')._test;

const CLAUDE_ID = 'https://claude.ai/oauth/mcp-oauth-client-metadata';
const CLAUDE_CB = 'https://claude.ai/api/mcp/auth_callback';
const GPT_ID = 'https://chatgpt.com/oauth/example/client.json';
const GPT_CB = 'https://chatgpt.com/connector_platform_oauth_redirect';

function fakeFetch(doc, ok = true) {
  const calls = [];
  const fn = async url => {
    calls.push(url);
    return { ok, json: async () => doc };
  };
  fn.calls = calls;
  return fn;
}

function fakeRes() {
  return {
    statusCode: 0, headers: {}, body: undefined,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
    end() { return this; }
  };
}

test('Claude hosted callback is accepted when listed in its metadata document', async () => {
  assert.equal(cimdClientFor(CLAUDE_ID, CLAUDE_CB).name, 'claude');
  const f = fakeFetch({ client_id: CLAUDE_ID, redirect_uris: [CLAUDE_CB] });
  assert.equal(await validateOAuthClient(CLAUDE_ID, CLAUDE_CB, f), true);
  assert.deepEqual(f.calls, [CLAUDE_ID]);
});

test('Claude metadata hosted on claude.com is also accepted', async () => {
  const id = 'https://claude.com/oauth/mcp-oauth-client-metadata';
  const f = fakeFetch({ client_id: id, redirect_uris: [CLAUDE_CB] });
  assert.equal(await validateOAuthClient(id, CLAUDE_CB, f), true);
});

test('ChatGPT clients keep working unchanged', async () => {
  const f = fakeFetch({ redirect_uris: [GPT_CB] });
  assert.equal(await validateOAuthClient(GPT_ID, GPT_CB, f), true);
});

test('redirect must be on the allowlist and in the document', async () => {
  // Claude client may not redirect anywhere except the fixed hosted callback.
  assert.equal(cimdClientFor(CLAUDE_ID, 'https://claude.ai/evil'), null);
  assert.equal(cimdClientFor(CLAUDE_ID, 'http://localhost:3118/callback'), null);
  assert.equal(cimdClientFor(CLAUDE_ID, GPT_CB), null);
  // Allowed shape but missing from the published metadata -> rejected.
  const f = fakeFetch({ client_id: CLAUDE_ID, redirect_uris: ['https://claude.ai/other'] });
  assert.equal(await validateOAuthClient(CLAUDE_ID, CLAUDE_CB, f), false);
});

test('unknown hosts, look-alikes and non-https client ids are never fetched', async () => {
  for (const id of [
    'https://claude.ai.evil.example/meta',
    'https://evil.example/claude.ai',
    'http://claude.ai/oauth/mcp-oauth-client-metadata',
    'https://user@claude.ai/meta',
    'https://claude.ai:8443/meta',
    'not a url'
  ]) {
    const f = fakeFetch({ redirect_uris: [CLAUDE_CB] });
    assert.equal(await validateOAuthClient(id, CLAUDE_CB, f), false, id);
    assert.equal(f.calls.length, 0, id);
  }
});

test('metadata whose client_id does not match the URL is rejected', async () => {
  const f = fakeFetch({ client_id: 'https://claude.ai/someone-else', redirect_uris: [CLAUDE_CB] });
  assert.equal(await validateOAuthClient(CLAUDE_ID, CLAUDE_CB, f), false);
});

test('failed metadata fetch is rejected', async () => {
  assert.equal(await validateOAuthClient(CLAUDE_ID, CLAUDE_CB, fakeFetch({}, false)), false);
});

test('authorization server advertises CIMD with public-client auth (required for Claude)', () => {
  const res = fakeRes();
  authorizationServer(res);
  assert.equal(res.body.client_id_metadata_document_supported, true);
  assert.deepEqual(res.body.token_endpoint_auth_methods_supported, ['none']);
  assert.deepEqual(res.body.code_challenge_methods_supported, ['S256']);
});

test('unauthenticated MCP calls get HTTP 401 with a resource_metadata pointer', async () => {
  for (const method of ['initialize', 'tools/list', 'tools/call']) {
    const res = fakeRes();
    await handleMcp({ method: 'POST', headers: {}, body: { jsonrpc: '2.0', id: 1, method } }, res);
    assert.equal(res.statusCode, 401, method);
    assert.match(res.headers['www-authenticate'], /resource_metadata="https:\/\/avengers-stat-center\.vercel\.app\/\.well-known\/oauth-protected-resource"/);
    assert.match(res.headers['www-authenticate'], /scope="discord\.results\.read"/);
  }
});

test('a forged bearer token is still 401', async () => {
  const res = fakeRes();
  await handleMcp({ method: 'POST', headers: { authorization: 'Bearer abc.def' }, body: { id: 2, method: 'tools/list' } }, res);
  assert.equal(res.statusCode, 401);
});

test('GET info endpoint stays public', async () => {
  const res = fakeRes();
  await handleMcp({ method: 'GET', headers: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.transport, 'streamable-http');
});
