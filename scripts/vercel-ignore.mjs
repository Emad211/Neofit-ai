const CANONICAL_PREVIEW_BRANCH = 'vercel/preview';
const CANONICAL_PRODUCTION_BRANCH = 'stage2/pwa-vercel-foundation';

function skip(reason) {
  console.log(`[NeoFit Vercel] skipped: ${reason}`);
  process.exit(0);
}

function build(reason) {
  console.log(`[NeoFit Vercel] build allowed: ${reason}`);
  process.exit(1);
}

const environment = process.env.VERCEL_ENV;
const branch = process.env.VERCEL_GIT_COMMIT_REF;

if (environment === 'production') {
  if (branch !== CANONICAL_PRODUCTION_BRANCH) {
    skip(`canonical Production branch is ${CANONICAL_PRODUCTION_BRANCH}.`);
  }
  build('explicit update of the canonical NeoFit Production branch.');
}

if (environment === 'preview') {
  if (branch !== CANONICAL_PREVIEW_BRANCH) {
    skip(`canonical Preview branch is ${CANONICAL_PREVIEW_BRANCH}.`);
  }
  build('explicit update of the canonical NeoFit Preview release branch.');
}

skip('NeoFit deploys only from the canonical Production or Preview release branch.');
