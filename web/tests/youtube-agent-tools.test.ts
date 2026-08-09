import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractYouTubeUrl, routeCoachExternalTool } from '@/lib/coach/external-tool-router';
import { toolQueryFingerprint } from '@/lib/integrations/tool-audit-core';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '..');
async function web(path: string) { return readFile(resolve(webRoot, path), 'utf8'); }
async function repo(path: string) { return readFile(resolve(repoRoot, path), 'utf8'); }

test('YouTube router uses direct URLs without search and only searches on explicit video intent', () => {
  assert.equal(extractYouTubeUrl('این رو ببین https://youtu.be/9hE5-98ZeCg?t=12'), 'https://www.youtube.com/watch?v=9hE5-98ZeCg');
  assert.deepEqual(routeCoachExternalTool('این ویدیو را بررسی کن https://www.youtube.com/watch?v=9hE5-98ZeCg'), {
    kind: 'youtube_video',
    url: 'https://www.youtube.com/watch?v=9hE5-98ZeCg',
  });
  assert.equal(routeCoachExternalTool('برای اسکوات چه نکته‌ای مهم است؟').kind, 'none');
  const search = routeCoachExternalTool('در یوتیوب یک ویدیوی آموزش اسکوات پیدا کن');
  assert.equal(search.kind, 'youtube_search');
  assert.ok(search.kind === 'youtube_search' && search.query.includes('اسکوات'));
});

test('tool audit stores only a SHA-256 query fingerprint, never the raw query', () => {
  const one = toolQueryFingerprint('آموزش اسکوات');
  const two = toolQueryFingerprint('آموزش اسکوات');
  assert.equal(one, two);
  assert.match(one, /^[a-f0-9]{64}$/);
  assert.notEqual(one, 'آموزش اسکوات');
});

test('YouTube integration uses a separate encrypted credential domain and table', async () => {
  const vault = await web('lib/integrations/credential-vault.ts');
  const store = await web('lib/integrations/credential-store.ts');
  const route = await web('app/api/integrations/youtube/route.ts');
  assert.match(vault, /neofit:integration-credential:v\$\{KEY_VERSION\}/);
  assert.match(vault, /AI_CREDENTIAL_ENCRYPTION_KEY/);
  assert.doesNotMatch(vault, /neofit:ai-credential/);
  assert.match(store, /encrypted_integration_credentials/);
  assert.doesNotMatch(store, /encrypted_provider_credentials/);
  assert.match(route, /encryptIntegrationApiKey/);
  assert.doesNotMatch(route, /encryptProviderApiKey|decryptProviderApiKey/);
});

test('saving or testing a YouTube key never burns search quota', async () => {
  const route = await web('app/api/integrations/youtube/route.ts');
  assert.match(route, /validateYouTubeApiKey/);
  assert.doesNotMatch(route, /searchYouTubeVideos/);
  const client = await web('lib/integrations/youtube-client.ts');
  const validationBlock = client.slice(client.indexOf('export async function validateYouTubeApiKey'), client.indexOf('export async function searchYouTubeVideos'));
  assert.match(validationBlock, /apiUrl\('videos'/);
  assert.match(validationBlock, /chart.*mostPopular/s);
  assert.doesNotMatch(validationBlock, /apiUrl\('search'/);
});

test('YouTube search is bounded, safe-filtered and uses one batched video metadata lookup', async () => {
  const client = await web('lib/integrations/youtube-client.ts');
  assert.match(client, /MAX_SEARCH_RESULTS = 4/);
  assert.match(client, /safeSearch.*strict/s);
  assert.match(client, /videoEmbeddable.*true/s);
  assert.match(client, /videoSyndicated.*true/s);
  assert.match(client, /relevanceLanguage.*fa/s);
  assert.match(client, /detailsUrl\.searchParams\.set\('id', candidates\.map/);
  assert.equal((client.match(/apiUrl\('search'/g) ?? []).length, 1);
  assert.equal((client.match(/apiUrl\('videos'/g) ?? []).length, 2); // validation + one search metadata batch
  assert.doesNotMatch(client, /captions|transcript|youtube-dl|yt-dlp|scrape/i);
});

test('Coach uses local tool intent and does not hide a YouTube search on every turn', async () => {
  const route = await web('app/api/ai/coach/route.ts');
  assert.match(route, /routeCoachExternalTool\(message\)/);
  assert.match(route, /externalIntent\.kind === 'youtube_search'/);
  assert.match(route, /runYouTubeSearchTool/);
  assert.match(route, /externalIntent\.kind === 'youtube_video'/);
  assert.match(route, /media = \[\{ type: 'youtube_video'/);
  assert.doesNotMatch(route, /function_call|tool_choice/);
});

test('YouTube video understanding is Google-only and never fake-falls back to AvalAI', async () => {
  const router = await web('lib/ai/provider-router.ts');
  const google = await web('lib/ai/providers/google.ts');
  assert.match(router, /requiresYouTubeVideo \? \(\['google'\] as const\)/);
  assert.match(router, /if \(requiresYouTubeVideo\) throw error/);
  assert.match(router, /AiCapabilityUnavailableError\('youtube_video'\)/);
  assert.match(google, /type: 'video'/);
  assert.match(google, /uri: youtubeUri/);
  assert.doesNotMatch(google, /captions|transcript/i);
});

test('external titles are explicitly untrusted prompt data and exact cards come from tool output', async () => {
  const prompt = await web('lib/coach/system-prompt.ts');
  const route = await web('app/api/ai/coach/route.ts');
  assert.match(prompt, /EXTERNAL_TOOL_DATA/);
  assert.match(prompt, /غیرقابل اعتماد/);
  assert.match(prompt, /هرگز دستور/);
  assert.match(route, /toolData = \{ youtube: \{ mode: 'search', videos: youtube\.videos \} \}/);
});

test('YouTube schema is RLS-owned and audit is metadata-only', async () => {
  const migration = await repo('supabase/migrations/20260809150638_youtube_integration_and_tool_audit.sql');
  assert.match(migration, /encrypted_integration_credentials/);
  assert.match(migration, /agent_tool_audit/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /query_fingerprint/);
  assert.doesNotMatch(migration, /\b(raw_query|query_text|prompt|result_payload|api_key)\s+text\b/i);
  assert.match(migration, /grant insert \(user_id, tool_name, query_fingerprint\)/);
  assert.doesNotMatch(migration, /grant delete on table public\.agent_tool_audit/i);
});

test('generated Supabase types include integration credential and tool audit tables', async () => {
  const types = await web('lib/supabase/database.types.ts');
  assert.match(types, /agent_tool_audit:/);
  assert.match(types, /encrypted_integration_credentials:/);
  assert.match(types, /nutrition_entries_plan_provenance_fk/);
});
