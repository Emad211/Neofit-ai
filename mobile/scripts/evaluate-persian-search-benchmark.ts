import { readFileSync, writeFileSync } from 'node:fs';
import {
  buildPersianAliasIndex,
  matchPersianAliasRecords,
  rankUniversalCatalogCandidates,
  resolveGenericAliasTarget,
  type PersianAliasRecord,
  type UniversalCatalogCandidate,
} from '../src/nutrition-core/universal-catalog-ranking';

interface BenchmarkCase {
  readonly queryId: string;
  readonly query: string;
  readonly canonicalAlias: string;
  readonly targetType: 'generic' | 'iranian_canon';
  readonly expectedTargets: readonly string[];
  readonly variantType: string;
}

interface BenchmarkInput {
  readonly format: string;
  readonly aliases: readonly PersianAliasRecord[];
  readonly cases: readonly BenchmarkCase[];
  readonly candidatesByTarget: Readonly<Record<string, readonly UniversalCatalogCandidate[]>>;
  readonly iranianCanonIds: readonly string[];
}

interface Counter {
  count: number;
  route: number;
  top1: number;
  top5: number;
}

function argument(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

function requiredArgument(name: string): string {
  const value = argument(name);
  if (!value) throw new Error(`Missing required argument ${name}`);
  return value;
}

function normalizedEnglishTokens(value: string): readonly string[] {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 0 && !['and', 'or', 'the'].includes(token));
}

function semanticTargetMatch(target: string, candidateName: string): boolean {
  const expected = normalizedEnglishTokens(target);
  const actual = new Set(normalizedEnglishTokens(candidateName));
  return expected.length > 0 && expected.every((token) => actual.has(token));
}

function rate(value: number, total: number): number {
  return total === 0 ? 0 : Math.round((value / total) * 10000) / 10000;
}

function increment(map: Map<string, Counter>, key: string, result: {
  route: boolean;
  top1: boolean;
  top5: boolean;
}) {
  const counter = map.get(key) ?? { count: 0, route: 0, top1: 0, top5: 0 };
  counter.count += 1;
  if (result.route) counter.route += 1;
  if (result.top1) counter.top1 += 1;
  if (result.top5) counter.top5 += 1;
  map.set(key, counter);
}

function summarize(counter: Counter) {
  return {
    count: counter.count,
    routeAccuracy: rate(counter.route, counter.count),
    top1Accuracy: rate(counter.top1, counter.count),
    top5Accuracy: rate(counter.top5, counter.count),
  };
}

const inputPath = requiredArgument('--input');
const outputPath = requiredArgument('--output');
const minimumTop1 = Number(argument('--minimum-top1') ?? '0.90');
const minimumTop5 = Number(argument('--minimum-top5') ?? '0.97');
const enforce = process.argv.includes('--enforce');
const payload = JSON.parse(readFileSync(inputPath, 'utf8')) as BenchmarkInput;
if (payload.format !== 'ifkb-persian-search-benchmark-input') {
  throw new Error(`Unexpected benchmark input format: ${payload.format}`);
}
if (payload.cases.length !== 500) {
  throw new Error(`Expected exactly 500 cases, found ${payload.cases.length}`);
}

const aliasIndex = buildPersianAliasIndex(payload.aliases);
const canonIds = new Set(payload.iranianCanonIds);
const overall: Counter = { count: 0, route: 0, top1: 0, top5: 0 };
const byVariant = new Map<string, Counter>();
const byTargetType = new Map<string, Counter>();
const failures: Array<Record<string, unknown>> = [];

for (const benchmarkCase of payload.cases) {
  const matched = matchPersianAliasRecords(benchmarkCase.query, aliasIndex);
  const selected = matched.find((row) => row.targetType === 'iranian_canon')
    ?? matched.find((row) => row.targetType === 'generic');
  const expected = new Set(benchmarkCase.expectedTargets);
  const route = selected !== undefined
    && selected.targetType === benchmarkCase.targetType
    && expected.has(selected.target);
  let top1 = false;
  let top5 = false;
  let resolvedTarget: string | null = null;
  let returnedNames: readonly string[] = [];

  if (route && selected?.targetType === 'iranian_canon') {
    top1 = canonIds.has(selected.target);
    top5 = top1;
    resolvedTarget = selected.target;
    returnedNames = top1 ? [selected.target] : [];
  } else if (route && selected?.targetType === 'generic') {
    resolvedTarget = resolveGenericAliasTarget(selected.target, benchmarkCase.query);
    const rows = payload.candidatesByTarget[resolvedTarget] ?? [];
    const ranked = rankUniversalCatalogCandidates(resolvedTarget, rows, 5);
    returnedNames = ranked.map((row) => row.nameEn);
    top1 = ranked[0] !== undefined && semanticTargetMatch(resolvedTarget, ranked[0].nameEn);
    top5 = ranked.some((row) => semanticTargetMatch(resolvedTarget ?? '', row.nameEn));
  }

  const result = { route, top1, top5 };
  increment(new Map([['overall', overall]]), 'overall', result);
  increment(byVariant, benchmarkCase.variantType, result);
  increment(byTargetType, benchmarkCase.targetType, result);
  if (!route || !top1 || !top5) {
    failures.push({
      queryId: benchmarkCase.queryId,
      query: benchmarkCase.query,
      variantType: benchmarkCase.variantType,
      expectedTargetType: benchmarkCase.targetType,
      expectedTargets: benchmarkCase.expectedTargets,
      selectedAliasTarget: selected?.target ?? null,
      selectedAliasType: selected?.targetType ?? null,
      resolvedTarget,
      route,
      top1,
      top5,
      returnedNames,
    });
  }
}

const report = {
  format: 'ifkb-persian-search-benchmark-report',
  cases: payload.cases.length,
  thresholds: { minimumTop1, minimumTop5 },
  overall: summarize(overall),
  byVariant: Object.fromEntries([...byVariant.entries()].sort().map(([key, value]) => [key, summarize(value)])),
  byTargetType: Object.fromEntries([...byTargetType.entries()].sort().map(([key, value]) => [key, summarize(value)])),
  failureCount: failures.length,
  failures: failures.slice(0, 100),
};
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report.overall));
console.log(`failures=${failures.length}`);

if (enforce && (report.overall.top1Accuracy < minimumTop1 || report.overall.top5Accuracy < minimumTop5)) {
  throw new Error(
    `Persian search benchmark failed: Top-1 ${report.overall.top1Accuracy}, Top-5 ${report.overall.top5Accuracy}`,
  );
}
