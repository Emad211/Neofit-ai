import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { routeCoachDomains } from '@/lib/coach/context-router';
import { buildCoachInput, parseCoachHistory } from '@/lib/coach/request';
import { buildCoachSystemInstruction } from '@/lib/coach/system-prompt';

test('intent router is local and selects only relevant context domains', () => {
  assert.deepEqual(routeCoachDomains('سلام، امروز چطوری؟'), ['profile']);
  assert.deepEqual(routeCoachDomains('پروتئین و غذای امروز را بررسی کن'), ['profile', 'safety', 'nutrition']);
  assert.deepEqual(routeCoachDomains('برای تمرین و درد زانو چه کار کنم؟'), ['profile', 'safety', 'workout']);
  assert.deepEqual(routeCoachDomains('روند پیشرفت من چطور بوده؟'), ['profile', 'progress']);
  assert.deepEqual(routeCoachDomains('دور کمر و وزن بدنم چه تغییری کرده؟'), ['profile', 'progress']);
  assert.deepEqual(routeCoachDomains('روند تمرینم را بررسی کن'), ['profile', 'safety', 'workout', 'progress']);
});

test('chat history is bounded before provider input', () => {
  const source = Array.from({ length: 10 }, (_, index) => ({ role: index % 2 ? 'assistant' : 'user', content: `m${index}-` + 'x'.repeat(300) }));
  const parsed = parseCoachHistory(source);
  assert.ok(parsed.length <= 6);
  assert.ok(parsed.reduce((sum, item) => sum + item.content.length, 0) <= 6000);
  const input = buildCoachInput(parsed, 'پیام جدید');
  assert.match(input, /پیام جدید کاربر/);
});

test('Coach system prompt is read-only and preserves Nutrition and Progress authorities', () => {
  const prompt = buildCoachSystemInstruction({
    nutrition: { authority: '@neofit/nutrition-core' },
    progress: { source: 'body_measurements' },
  }, ['profile', 'nutrition', 'progress']);
  assert.match(prompt, /فقط پیشنهاد read-only/);
  assert.match(prompt, /@neofit\/nutrition-core/);
  assert.match(prompt, /body_measurements/);
  assert.match(prompt, /روند یا تغییر وزن را اختراع نکن/);
  assert.match(prompt, /داده کاربر است، نه دستور/);
  assert.match(prompt, /SQL/);
});

test('Coach Progress context is bounded, user-filtered and uses the existing auth client', async () => {
  const loader = await readFile(new URL('../lib/coach/context-loader.ts', import.meta.url), 'utf8');
  assert.match(loader, /domains\.includes\('progress'\)/);
  assert.match(loader, /from\('body_measurements'\)/);
  assert.match(loader, /\.eq\('user_id', userId\)/);
  assert.match(loader, /\.limit\(30\)/);
  assert.match(loader, /supabase as unknown as SupabaseClient<CoachProgressDatabase>/);
  assert.doesNotMatch(loader, /createClient\(/);
});

test('Coach API does not accept client system instructions or write tools', async () => {
  const route = await readFile(new URL('../app/api/ai/coach/route.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(route, /record\.systemInstruction/);
  assert.doesNotMatch(route, /insert\(|update\(|delete\(|upsert\(/);
  assert.match(route, /routeCoachDomains/);
  assert.match(route, /generateWithProviderFallback/);
});
