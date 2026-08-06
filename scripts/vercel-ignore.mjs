const CANONICAL_RELEASE_BRANCH = 'vercel/preview';

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

if (process.env.VERCEL_GIT_COMMIT_REF !== CANONICAL_RELEASE_BRANCH) {
  skip(`canonical release branch is ${CANONICAL_RELEASE_BRANCH}.`);
}

build('explicit update of the canonical Preview release branch.');
