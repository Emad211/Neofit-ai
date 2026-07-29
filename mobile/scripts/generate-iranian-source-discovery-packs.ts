import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

type ReadinessStatus = 'ds0_broad_fallback' | 'ds2_consensus_blocked' | 'legacy_estimate';
type Workstream = 'acquire_sources_and_recipe_profile' | 'finish_ds2_normalization' | 'review_legacy_estimate';

interface BatchItem {
  canonId: string;
  appProfileId: string;
  nameFa: string;
  nameEn: string;
  category: string;
  readinessStatus: ReadinessStatus;
  workstream: Workstream;
  priorityScore: number;
}

interface BatchPlan {
  format: string;
  version: string;
  batchCount: number;
  totalItems: number;
  batches: Array<{ batchId: string; items: BatchItem[] }>;
}

interface CanonRow {
  canon_id: string;
  name_fa: string;
  name_en: string;
  aliases_fa: string | null;
  category: string | null;
  region: string | null;
  priority: string | null;
}

export interface DiscoveryRecord {
  canonId: string;
  appProfileId: string;
  batchId: string;
  nameFa: string;
  nameEn: string;
  aliasesFa: string[];
  category: string;
  region: string | null;
  canonicalPriority: string | null;
  currentStatus: ReadinessStatus;
  workstream: Workstream;
  discoveryMode: 'new_source_acquisition' | 'legacy_revalidation' | 'existing_ds2_completion';
  targetEvidencePath: string;
  minimumIndependentSourceGroups: number;
  preferredIndependentSourceGroups: number;
  queriesFa: string[];
  queriesEn: string[];
  requiredOutputs: string[];
  rejectedEvidence: string[];
  sourceRecords: [];
  reviewStatus: 'unstarted';
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildDiscoveryRecord(
  item: BatchItem,
  batchId: string,
  canon: Pick<CanonRow, 'aliases_fa' | 'region' | 'priority'>,
): DiscoveryRecord {
  const aliasesFa = unique((canon.aliases_fa ?? '').split('|'));
  const discoveryMode = item.readinessStatus === 'ds0_broad_fallback'
    ? 'new_source_acquisition'
    : item.readinessStatus === 'ds2_consensus_blocked'
      ? 'existing_ds2_completion'
      : 'legacy_revalidation';
  const targetEvidencePath = item.readinessStatus === 'ds2_consensus_blocked'
    ? 'complete quantity, ingredient mapping, yield, retention and serving nutrition for existing DS2 consensus'
    : item.readinessStatus === 'legacy_estimate'
      ? 'replace legacy centre with independently sourced recipe/serving profile'
      : 'establish identity/recipe consensus, serving basis and nutrient-ready profile';
  const minimumIndependentSourceGroups = item.readinessStatus === 'ds2_consensus_blocked' ? 3 : 2;
  const preferredIndependentSourceGroups = 3;
  const aliasQueries = aliasesFa.slice(0, 3).flatMap((alias) => [
    `${alias} دستور پخت مقدار مواد`,
    `${alias} وزن یک پرس`,
  ]);
  return {
    canonId: item.canonId,
    appProfileId: item.appProfileId,
    batchId,
    nameFa: item.nameFa,
    nameEn: item.nameEn,
    aliasesFa,
    category: item.category,
    region: canon.region,
    canonicalPriority: canon.priority,
    currentStatus: item.readinessStatus,
    workstream: item.workstream,
    discoveryMode,
    targetEvidencePath,
    minimumIndependentSourceGroups,
    preferredIndependentSourceGroups,
    queriesFa: unique([
      `${item.nameFa} دستور پخت مقدار دقیق مواد`,
      `${item.nameFa} وزن یک پرس گرم`,
      `${item.nameFa} ارزش غذایی منبع`,
      ...aliasQueries,
    ]),
    queriesEn: unique([
      `${item.nameEn} recipe ingredient quantities grams`,
      `${item.nameEn} serving weight grams`,
      `${item.nameEn} nutrition recipe source`,
    ]),
    requiredOutputs: [
      'source URL and publisher/domain',
      'source-record id and access date/version',
      'independence group',
      'structured ingredients and quantities',
      'declared servings or cooked batch yield',
      'serving-weight evidence or explicit unresolved status',
      'license/reuse status',
      'reviewer decision without AI-generated nutrition',
    ],
    rejectedEvidence: [
      'model-generated calories or macros',
      'unsourced recipe copy',
      'aggregator values without primary provenance',
      'identity-only evidence presented as nutrient readiness',
    ],
    sourceRecords: [],
    reviewStatus: 'unstarted',
  };
}

export function buildDiscoveryQueue(
  plan: BatchPlan,
  canonRows: readonly CanonRow[],
): { records: DiscoveryRecord[]; batches: Array<{ batchId: string; records: DiscoveryRecord[] }> } {
  const canonById = new Map(canonRows.map((row) => [row.canon_id, row]));
  const records: DiscoveryRecord[] = [];
  const batches = plan.batches.map((batch) => ({
    batchId: batch.batchId,
    records: batch.items.map((item) => {
      const canon = canonById.get(item.canonId);
      if (!canon) throw new Error(`Missing canonical identity ${item.canonId}.`);
      const record = buildDiscoveryRecord(item, batch.batchId, canon);
      records.push(record);
      return record;
    }),
  }));
  if (records.length !== plan.totalItems) throw new Error(`Discovery queue contains ${records.length}; expected ${plan.totalItems}.`);
  if (new Set(records.map((record) => record.canonId)).size !== records.length) throw new Error('Discovery queue contains duplicate canonical ids.');
  if (records.some((record) => record.queriesFa.length < 3 || record.queriesEn.length < 3)) throw new Error('Every discovery record requires Persian and English query packs.');
  return { records: records.sort((left, right) => left.canonId.localeCompare(right.canonId)), batches };
}

function outputDirectory(): string {
  const index = process.argv.indexOf('--output-dir');
  return resolve(index >= 0 && process.argv[index + 1] ? process.argv[index + 1]! : '../build/iranian-source-discovery');
}

function batchPlanPath(): string {
  const index = process.argv.indexOf('--batch-plan');
  return resolve(index >= 0 && process.argv[index + 1]
    ? process.argv[index + 1]!
    : '../build/full-nutrition-catalog-audit/iranian-batch-plan.json');
}

export function run(outputDir: string, planPath: string): void {
  const plan = JSON.parse(readFileSync(planPath, 'utf8')) as BatchPlan;
  if (plan.format !== 'neofit-iranian-profile-batch-plan' || plan.totalItems !== 261 || plan.batchCount !== 12) {
    throw new Error('Unsupported Iranian batch plan.');
  }
  const databasePath = fileURLToPath(new URL('../assets/ifkb/ifkb-universal-v1.db', import.meta.url));
  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const canonRows = database.prepare(`
      SELECT canon_id,name_fa,name_en,aliases_fa,category,region,priority
      FROM iranian_canon ORDER BY canon_id;
    `).all() as unknown as CanonRow[];
    const result = buildDiscoveryQueue(plan, canonRows);
    const statusCounts = Object.fromEntries([...new Set(result.records.map((record) => record.currentStatus))]
      .sort()
      .map((status) => [status, result.records.filter((record) => record.currentStatus === status).length]));
    const modeCounts = Object.fromEntries([...new Set(result.records.map((record) => record.discoveryMode))]
      .sort()
      .map((mode) => [mode, result.records.filter((record) => record.discoveryMode === mode).length]));
    mkdirSync(outputDir, { recursive: true });
    const batchDir = resolve(outputDir, 'batches');
    mkdirSync(batchDir, { recursive: true });
    for (const batch of result.batches) {
      writeFileSync(resolve(batchDir, `${batch.batchId}.json`), `${JSON.stringify({
        format: 'neofit-iranian-source-discovery-batch',
        version: '1.0.0',
        batchId: batch.batchId,
        recordCount: batch.records.length,
        records: batch.records,
      }, null, 2)}\n`, 'utf8');
    }
    const headers = [
      'canonId','appProfileId','batchId','nameFa','nameEn','category','region','canonicalPriority',
      'currentStatus','workstream','discoveryMode','minimumIndependentSourceGroups',
      'preferredIndependentSourceGroups','queriesFa','queriesEn','reviewStatus',
    ];
    const csvRows = result.records.map((record) => ({
      ...record,
      queriesFa: JSON.stringify(record.queriesFa),
      queriesEn: JSON.stringify(record.queriesEn),
    }));
    writeFileSync(resolve(outputDir, 'all-iranian-source-discovery-queue.csv'), `${headers.join(',')}\n${csvRows
      .map((row) => headers.map((header) => csvEscape((row as Record<string, unknown>)[header])).join(','))
      .join('\n')}\n`, 'utf8');
    const summary = {
      format: 'neofit-iranian-source-discovery-summary',
      version: '1.0.0',
      recordCount: result.records.length,
      batchCount: result.batches.length,
      statusCounts,
      discoveryModeCounts: modeCounts,
      recordsWithAliases: result.records.filter((record) => record.aliasesFa.length > 0).length,
      totalPersianQueries: result.records.reduce((sum, record) => sum + record.queriesFa.length, 0),
      totalEnglishQueries: result.records.reduce((sum, record) => sum + record.queriesEn.length, 0),
      approvedSourceRecordCount: 0,
      policy: 'Discovery packs accelerate parallel research. They do not approve sources, nutrients, portions or promotion bundles.',
    };
    writeFileSync(resolve(outputDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    database.close();
  }
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(resolve(invokedPath)).href) run(outputDirectory(), batchPlanPath());
