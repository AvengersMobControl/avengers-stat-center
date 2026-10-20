'use strict';

// Exit 0 = Vercel cancels the build; exit 1 = Vercel continues building.
// Production and uncertain preview situations MUST build.
const { execFileSync } = require('node:child_process');

const ROOT_DOCUMENTS = new Set([
  'README.md', 'CHANGELOG.md', 'CONTRIBUTING.md',
  'PROJECT_CONTINUITY.md', 'DECISION_LOG.md', 'ROADMAP.md',
  'CURRENT_STATE.md', 'PNG_CONSTRUCTION_SPEC.md',
]);

function documentationOnlyPath(path) {
  return ROOT_DOCUMENTS.has(path) || /^docs\/[^\0]+$/.test(path) ||
    /^\.github\/(?:ISSUE_TEMPLATE\/[^\0]+|PULL_REQUEST_TEMPLATE\.md)$/.test(path);
}

function shouldSkipPreview(env = process.env, runGit = (args, options) => execFileSync('git', args, options)) {
  if (env.VERCEL_ENV !== 'preview' || env.VERCEL_FORCE_BUILD === '1') return false;
  const branch = String(env.VERCEL_GIT_COMMIT_REF || '');
  const docsBranch = /^(?:docs[\/-]|documentation[\/-]|chore\/docs[\/-])/.test(branch);
  if (!branch) return false;
  try {
    const options = { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 };
    const root = String(runGit(['rev-parse', '--show-toplevel'], options)).trim();
    if (!root) return false;
    const gitOptions = { ...options, cwd: root };
    const head = String(runGit(['rev-parse', 'HEAD'], gitOptions)).trim();
    const parent = String(runGit(['rev-parse', 'HEAD^'], gitOptions)).trim();
    if (!/^[0-9a-f]{40,64}$/.test(head) || !/^[0-9a-f]{40,64}$/.test(parent)) return false;
    const message = String(runGit(['log', '-1', '--format=%B', head], gitOptions));
    // A feature/release branch must explicitly opt in: don't miss batched code previews.
    if (!docsBranch && !message.includes('[skip-vercel-preview]')) return false;
    const changed = String(runGit([
      'diff', '--name-only', '-z', '--no-renames', '--diff-filter=ACDMRTUXB',
      parent, head, '--',
    ], gitOptions)).split('\0').filter(Boolean);
    return changed.length > 0 && changed.every(documentationOnlyPath);
  } catch {
    // Shallow clone, missing parent, or unexpected git state: build normally.
    return false;
  }
}

if (require.main === module) {
  const skip = shouldSkipPreview();
  console.log(skip ? 'Documentation-only preview explicitly eligible: skipping build.' : 'Build retained (production, code, required preview, or uncertain git state).');
  process.exit(skip ? 0 : 1);
}
module.exports = { documentationOnlyPath, shouldSkipPreview };
