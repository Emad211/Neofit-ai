import { spawnSync } from 'node:child_process';

const CANONICAL_PREVIEW_BRANCH = 'web/full-frontend-integration';
const DEPLOY_MARKER = '.vercel-deploy';

function skip(reason) {
  console.log(`[NeoFit Vercel] skipped: ${reason}`);
  process.exit(0);
}

function build(reason) {
  console.log(`[NeoFit Vercel] build allowed: ${reason}`);
  process.exit(1);
}

if (process.env.VERCEL_ENV !== 'preview') {
  skip('NeoFit promotion is Preview-only until Production is explicitly approved.');
}

if (process.env.VERCEL_GIT_COMMIT_REF !== CANONICAL_PREVIEW_BRANCH) {
  skip(`canonical Preview branch is ${CANONICAL_PREVIEW_BRANCH}.`);
}

const comparison = spawnSync(
  'git',
  ['diff', '--quiet', 'HEAD^', 'HEAD', '--', DEPLOY_MARKER],
  { stdio: 'ignore' },
);

if (comparison.status === 0) {
  skip(`${DEPLOY_MARKER} did not change.`);
}

if (comparison.status === 1) {
  build(`${DEPLOY_MARKER} changed in this commit.`);
}

build('marker comparison was unavailable; failing open for the canonical Preview only.');
