import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPersianAliasIndex,
  matchPersianAliasRecords,
  normalizePersianText,
  parseFoodQuery,
  rankUniversalCatalogCandidates,
  resolveGenericAliasTarget,
  sanitizeFtsQuery,
  searchFoodDocuments,
} from '../src';
import {
  SEARCH_RANKING_GOLDEN_PROVENANCE,
  controlledAliasRows,
  representativeAliasCases,
  universalCandidate,
} from './search-ranking-golden-v1';
import { eggWhiteConcept, eggWhiteVariant } from './mobile-rc-golden-v1';

test('search fixtures identify the exact controlled benchmark authority', () => {
  assert.equal(SEARCH_RANKING_GOLDEN_PROVENANCE.benchmarkReleaseVersion, '1.1.0');
  assert.equal(SEARCH_RANKING_GOLDEN_PROVENANCE.benchmarkCatalogVersion, '1.2.0');
  assert.equal(SEARCH_RANKING_GOLDEN_PROVENANCE.naturalQueryReleaseStatus, 'contract_only_not_released');
  assert.match(SEARCH_RANKING_GOLDEN_PROVENANCE.benchmarkDatabaseSha256, /^[a-f0-9]{64}$/);
  for (const [key, value] of Object.entries(SEARCH_RANKING_GOLDEN_PROVENANCE)) {
    if (key.endsWith('Blob') || key === 'referenceHead') assert.match(String(value), /^[a-f0-9]{40}$/);
  }
});

test('Persian normalization matches Mobile RC Unicode, digit and punctuation behavior', () => {
  assert.equal(normalizePersianText('  سفيده‌ی ۲ عدد! '), 'سفیده ی 2 عدد');
  assert.equal(normalizePersianText('قورمه‌سبزی/كم‌چرب'), 'قورمه سبزی کم چرب');
  assert.equal(normalizePersianText('١٢۳ گرم'), '123 گرم');
});

test('query parser extracts preparation modifiers without inventing nutrition', () => {
  const parsed = parseFoodQuery('مرغ کبابی بدون پوست با روغن');
  assert.equal(parsed.baseQuery, 'مرغ');
  assert.deepEqual(parsed.modifiers, ['grilled', 'with_oil', 'skinless']);

  const egg = parseFoodQuery('سفیده تخم مرغ آب پز بدون روغن');
  assert.ok(egg.modifiers.includes('egg_white'));
  assert.ok(egg.modifiers.includes('boiled'));
  assert.ok(egg.modifiers.includes('without_added_fat'));
});

test('all nine official controlled-query variants route to their frozen targets', () => {
  const index = buildPersianAliasIndex(controlledAliasRows);
  for (const item of representativeAliasCases) {
    const matches = matchPersianAliasRecords(item.query, index);
    assert.ok(
      matches.some((row) => row.target === item.target && row.targetType === item.targetType),
      `${item.variant} did not route ${item.query} to ${item.targetType}:${item.target}`,
    );
  }
});

test('longest contained alias wins over a shorter generic alias', () => {
  const index = buildPersianAliasIndex(controlledAliasRows);
  const matches = matchPersianAliasRecords('50 گرم تخم مرغ آب پز', index);
  assert.equal(matches[0]?.target, 'egg, whole, boiled');
});

test('official evaluator precedence selects Iranian canonical route for a shared alias', () => {
  const index = buildPersianAliasIndex(controlledAliasRows);
  const matches = matchPersianAliasRecords('ماست', index);
  const selected = matches.find((row) => row.targetType === 'iranian_canon')
    ?? matches.find((row) => row.targetType === 'generic');
  assert.equal(selected?.targetType, 'iranian_canon');
  assert.equal(selected?.target, 'IFKB-CANON-00080');
});

test('local deterministic document search preserves modifier-aware Mobile ranking', () => {
  const hits = searchFoodDocuments('تخم مرغ بدون زرده آب پز', [
    { concept: eggWhiteConcept, variants: [eggWhiteVariant] },
  ]);
  assert.equal(hits[0]?.variantId, eggWhiteVariant.id);
  assert.ok((hits[0]?.score ?? 0) > 100);
  assert.ok(hits[0]?.reasons.includes('modifier_match:without_yolk'));
  assert.ok(hits[0]?.reasons.includes('modifier_match:boiled'));
});

test('generic target resolution applies vocabulary and preparation modifiers', () => {
  assert.equal(resolveGenericAliasTarget('sweet pepper', 'فلفل دلمه ای'), 'peppers, sweet');
  assert.equal(
    resolveGenericAliasTarget('egg, whole', 'سفیده تخم مرغ آب پز بدون روغن'),
    'egg, white, boiled, no added fat',
  );
  assert.equal(resolveGenericAliasTarget('chicken', 'مرغ کبابی'), 'chicken, grilled');
});

test('FTS query sanitation is bounded and deterministic', () => {
  assert.equal(sanitizeFtsQuery('Egg, white boiled!'), '"egg" AND "white" AND "boiled"');
  assert.equal(
    sanitizeFtsQuery('one two three four five six seven eight nine ten eleven'),
    '"one" AND "two" AND "three" AND "four" AND "five" AND "six" AND "seven" AND "eight" AND "nine" AND "ten"',
  );
});

test('prepared queries prefer FNDDS over an otherwise equal SR candidate', () => {
  const ranked = rankUniversalCatalogCandidates('egg white boiled', [
    universalCandidate('sr', 'sr_legacy', 'egg white boiled'),
    universalCandidate('fndds', 'fndds', 'egg white boiled'),
  ]);
  assert.equal(ranked[0]?.id, 'fndds');
  assert.ok(ranked[0]?.reasons.includes('consumed_food_source'));
});

test('atomic raw queries prefer SR Legacy over an otherwise equal FNDDS candidate', () => {
  const ranked = rankUniversalCatalogCandidates('egg white raw', [
    universalCandidate('fndds', 'fndds', 'egg white raw'),
    universalCandidate('sr', 'sr_legacy', 'egg white raw'),
  ]);
  assert.equal(ranked[0]?.id, 'sr');
  assert.ok(ranked[0]?.reasons.includes('atomic_food_source'));
});

test('unrequested uncommon processing is penalized and fresh form wins', () => {
  const ranked = rankUniversalCatalogCandidates('tomato', [
    universalCandidate('dried', 'sr_legacy', 'tomato dried'),
    universalCandidate('raw', 'sr_legacy', 'tomato raw'),
  ]);
  assert.equal(ranked[0]?.id, 'raw');
  assert.ok(ranked.find((row) => row.id === 'dried')?.reasons.includes('unrequested_process:dried'));
});

test('macro-incomplete candidates are excluded from universal ranking', () => {
  const ranked = rankUniversalCatalogCandidates('tomato', [
    universalCandidate('incomplete', 'sr_legacy', 'tomato', { macroComplete: false }),
    universalCandidate('complete', 'sr_legacy', 'tomato raw'),
  ]);
  assert.equal(ranked.some((row) => row.id === 'incomplete'), false);
  assert.equal(ranked[0]?.id, 'complete');
});

test('ranking ties are stable by shorter name and then identifier', () => {
  const ranked = rankUniversalCatalogCandidates('tomato', [
    universalCandidate('b', 'sr_legacy', 'tomato'),
    universalCandidate('a', 'sr_legacy', 'tomato'),
    universalCandidate('long', 'sr_legacy', 'tomato common raw form', { bm25: 0 }),
  ]);
  assert.deepEqual(ranked.slice(0, 2).map((row) => row.id), ['a', 'b']);
});

test('search and ranking limits fail closed when invalid', () => {
  assert.throws(() => searchFoodDocuments('سفیده', [], 0), /positive integer/);
  assert.throws(() => rankUniversalCatalogCandidates('tomato', [], 0), /positive integer/);
});
