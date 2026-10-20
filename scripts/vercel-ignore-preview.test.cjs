'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldSkipPreview, documentationOnlyPath } = require('./vercel-ignore-preview.cjs');
const SHA = 'a'.repeat(40);
const BASE = 'b'.repeat(40);
function gitStub(files, message = 'docs: update status') {
  return (args) => {
    switch (args[0] + ' ' + args[1]) {
      case 'rev-parse --show-toplevel': return '/repo\n';
      case 'rev-parse HEAD': return SHA + '\n';
      case 'rev-parse HEAD^': return BASE + '\n';
      case 'log -1': return message;
      case 'diff --name-only': return files.join('\0') + '\0';
      default: throw new Error('Unexpected git command: ' + args.join(' '));
    }
  };
}
const preview = { VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'docs/status' };
test('never cancels production or unknown environments', () => {
  assert.equal(shouldSkipPreview({ ...preview, VERCEL_ENV:'production' }, gitStub(['docs/a.md'])), false);
  assert.equal(shouldSkipPreview({ ...preview, VERCEL_ENV:'staging' }, gitStub(['docs/a.md'])), false);
});
test('docs branch: docs-only preview may be skipped', () => {
  assert.equal(shouldSkipPreview(preview, gitStub(['docs/a.md', 'README.md'])), true);
});
test('docs branch: code/assets/config/empty diff always builds', () => {
  for (const files of [['docs/a.md','api/index.js'], ['vercel.json'], ['receiver/assets/logo.png'], []]) {
    assert.equal(shouldSkipPreview(preview, gitStub(files)), false);
  }
});
test('feature branches require opt-in AND documents-only', () => {
  const env = { ...preview, VERCEL_GIT_COMMIT_REF:'feature/new-parser' };
  assert.equal(shouldSkipPreview(env, gitStub(['docs/a.md'])), false);
  assert.equal(shouldSkipPreview(env, gitStub(['docs/a.md'], 'docs: checkpoint [skip-vercel-preview]')), true);
  assert.equal(shouldSkipPreview(env, gitStub(['docs/a.md','receiver/index.js'], 'docs: checkpoint [skip-vercel-preview]')), false);
});
test('force build overrides skipping', () => {
  assert.equal(shouldSkipPreview({ ...preview, VERCEL_FORCE_BUILD:'1' }, gitStub(['docs/a.md'])), false);
});
test('missing Git parent fails open', () => {
  assert.equal(shouldSkipPreview(preview, () => { throw new Error('shallow clone') }), false);
});
test('allowlist protects original art and assets', () => {
  assert.equal(documentationOnlyPath('ROADMAP.md'), true);
  assert.equal(documentationOnlyPath('docs/PROJECT_CONTINUITY.md'), true);
  assert.equal(documentationOnlyPath('receiver/assets/ORIGINAL_ASSET_MANIFEST.md'), false);
  assert.equal(documentationOnlyPath('assets/README.md'), false);
  assert.equal(documentationOnlyPath('package.json'), false);
});
