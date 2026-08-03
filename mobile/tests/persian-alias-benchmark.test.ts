import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import {
  buildPersianAliasIndex,
  matchPersianAliasRecords,
  normalizedAliasKey,
  type PersianAliasRecord,
} from '../src/nutrition-core';

interface AliasRow {
  alias_fa: string;
  target: string;
  target_type: 'generic' | 'iranian_canon';
}

interface BenchmarkCase {
  readonly query: string;
  readonly expectedTarget: string;
  readonly perturbation: string;
}

function arabicCodepointVariant(value: string): string {
  return value.replaceAll('ی', 'ي').replaceAll('ک', 'ك');
}

function persianDigits(value: number): string {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)] ?? digit);
}

function caseVariants(alias: string): readonly { query: string; perturbation: string }[] {
  return [
    { query: alias, perturbation: 'exact' },
    { query: `  ${alias}  `, perturbation: 'outer_whitespace' },
    { query: alias.replaceAll('\u200c', ' '), perturbation: 'zwnj_to_space' },
    { query: arabicCodepointVariant(alias), perturbation: 'arabic_codepoints' },
    { query: `یک پرس ${alias}`, perturbation: 'serving_prefix' },
    { query: `${alias} برای ناهار`, perturbation: 'meal_context' },
    { query: `امروز ${alias} خوردم`, perturbation: 'sentence_context' },
    { query: `${persianDigits(2)} پرس ${alias}`, perturbation: 'persian_digit_context' },
  ];
}

test('500-query Persian Iranian-food alias stress benchmark', () => {
  const databasePath = fileURLToPath(new URL('../assets/ifkb/ifkb-universal-v1.db', import.meta.url));
  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const rows = database.prepare(`
      SELECT alias_fa, target, target_type
      FROM persian_search_aliases
      WHERE target_type = 'iranian_canon'
      ORDER BY alias_fa, target
    `).all() as unknown as AliasRow[];
    const records: PersianAliasRecord[] = rows.map((row) => ({
      aliasFa: row.alias_fa,
      target: row.target,
      targetType: row.target_type,
    }));
    const index = buildPersianAliasIndex(records);

    const unambiguous = records.filter((record) => {
      const exact = index.exact.get(normalizedAliasKey(record.aliasFa)) ?? [];
      const targets = new Set(
        exact.filter((candidate) => candidate.targetType === 'iranian_canon')
          .map((candidate) => candidate.target),
      );
      return targets.size === 1 && targets.has(record.target);
    });

    const cases: BenchmarkCase[] = [];
    const seen = new Set<string>();
    for (const record of unambiguous) {
      for (const variant of caseVariants(record.aliasFa)) {
        const key = `${normalizedAliasKey(variant.query)}\u0000${record.target}\u0000${variant.perturbation}`;
        if (seen.has(key)) continue;
        seen.add(key);
        cases.push({
          query: variant.query,
          expectedTarget: record.target,
          perturbation: variant.perturbation,
        });
      }
    }

    assert.ok(cases.length >= 500, `Only ${cases.length} deterministic benchmark cases were generated.`);
    const benchmark = cases.slice(0, 500);
    let top1 = 0;
    let top5 = 0;
    const failures: BenchmarkCase[] = [];
    const byPerturbation = new Map<string, { total: number; top1: number }>();

    for (const item of benchmark) {
      const matches = matchPersianAliasRecords(item.query, index)
        .filter((candidate) => candidate.targetType === 'iranian_canon');
      const actualTargets = [...new Set(matches.map((candidate) => candidate.target))];
      const correctTop1 = actualTargets[0] === item.expectedTarget;
      const correctTop5 = actualTargets.slice(0, 5).includes(item.expectedTarget);
      if (correctTop1) top1 += 1;
      if (correctTop5) top5 += 1;
      if (!correctTop1) failures.push(item);
      const bucket = byPerturbation.get(item.perturbation) ?? { total: 0, top1: 0 };
      bucket.total += 1;
      if (correctTop1) bucket.top1 += 1;
      byPerturbation.set(item.perturbation, bucket);
    }

    const top1Rate = top1 / benchmark.length;
    const top5Rate = top5 / benchmark.length;
    console.log(JSON.stringify({
      benchmark: 'persian-iranian-alias-stress-v0.1',
      cases: benchmark.length,
      sourceAliases: unambiguous.length,
      top1: top1Rate,
      top5: top5Rate,
      byPerturbation: Object.fromEntries(byPerturbation),
      sampleFailures: failures.slice(0, 10),
      limitation: 'Deterministic alias and normalization stress set; not an independent user-query corpus.',
    }));

    assert.ok(top1Rate >= 0.98, `Top-1 alias resolution ${top1Rate.toFixed(3)} is below 0.98.`);
    assert.ok(top5Rate >= 0.995, `Top-5 alias resolution ${top5Rate.toFixed(3)} is below 0.995.`);
  } finally {
    database.close();
  }
});
