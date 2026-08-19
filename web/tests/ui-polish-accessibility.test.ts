import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
async function read(path: string) { return readFile(resolve(webRoot, path), 'utf8'); }

test('account Profile links to real workout surfaces without presenting Guest fixtures as the current plan', async () => {
  const profile = await read('components/profile-screen.tsx');
  assert.doesNotMatch(profile, /workout-fixtures|workoutPlan\.length|<small> fixture<\/small>/);
  assert.match(profile, /href="\/workout"/);
  assert.match(profile, /برنامه تمرین/);
  assert.match(profile, /\/profile\/integrations/);
});

test('global Stage 19 polish covers focus-visible, form typography and reduced motion', async () => {
  const css = await read('app/agent-tools-polish.css');
  assert.match(css, /a:focus-visible/);
  assert.match(css, /select:focus-visible/);
  assert.match(css, /textarea:focus-visible/);
  assert.match(css, /button,input,select,textarea\{font:inherit\}/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /\.page-stack\{animation:none!important\}/);
  assert.match(css, /min-block-size:44px/);
});

test('Coach surfaces bounded cooldown while keeping implementation metadata out of the conversation UI', async () => {
  const coach = await read('components/coach-screen.tsx');
  assert.match(coach, /response\.status === 429/);
  assert.match(coach, /Retry-After/);
  assert.match(coach, /setCooldownUntil/);
  assert.match(coach, /coach-cooldown/);
  assert.match(coach, /event\.ctrlKey \|\| event\.metaKey/);
  assert.match(coach, /event\.key === 'Enter'/);
  assert.match(coach, /aria-busy=\{loading\}/);
  assert.doesNotMatch(coach, /<details className="coach-technical-details">/);
  assert.doesNotMatch(coach, />Provider<|>Model<|>Latency<|>Fallback</);
});

test('YouTube results are cards and are never auto-embedded with an iframe', async () => {
  const coach = await read('components/coach-screen.tsx');
  assert.match(coach, /coach-youtube-card/);
  assert.match(coach, /target="_blank"/);
  assert.match(coach, /loading="lazy"/);
  assert.doesNotMatch(coach, /<iframe|youtube\.com\/embed/);
});

test('YouTube missing-key and Google-video capability errors provide focused CTAs', async () => {
  const coach = await read('components/coach-screen.tsx');
  assert.match(coach, /youtube_not_configured/);
  assert.match(coach, /\/profile\/integrations/);
  assert.match(coach, /youtube_video_requires_google/);
  assert.match(coach, /\/profile\/ai/);
});
