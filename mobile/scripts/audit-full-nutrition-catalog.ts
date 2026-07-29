import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { IRANIAN_FALLBACK_SEED } from '../src/data/iranian-fallback-seed.generated';
import { IRANIAN_FOOD_SEED } from '../src/data/iranian-food-seed';
import { IFKB_CATALOG_RELEASE } from '../src/nutrition-core';

type IranianProfile = (typeof IRANIAN_FOOD_SEED)[number];
type GenericReadiness =
  | 'macro_and_portion_ready'
  | 'macro_ready_no_official_portion'
  | 'macro_incomplete'
  | 'missing_concept_mapping';
type IranianReadiness = 'ds0_broad_fallback' | 'ds2_consensus_blocked' | 'legacy_estimate';

type GenericAuditInput = {
  macroCompleteness: number;
  portionCount: number;
  conceptId: string | null;
};

type IranianAuditInput = {
  baseProfileType: 'legacy_seed' | 'ds0_fallback';
  hasDs2Consensus: boolean;
  portionGrams: number | null;
  confidence: string;
  category: string;
  canonicalPriority: string | null;
};

interface GenericDbRow {
  id: string;
  source_type: string;
  source_numeric_id: number | null;
  source_food_code: string | null;
  name_en: string;
  macro_completeness: number;
  portion_count: number;
  calcium_mg: number | null;
  iron_mg: number | null;
  potassium_mg: number | null;
  vitamin_c_mg: number | null;
  concept_id: string | null;
  mapping_policy: string | null;
  concept_variant_count: number | null;
  concept_source_type_count: number | null;
}

interface IranianCanonRow {
  canon_id: string;
  name_fa: string;
  name_en: string;
  aliases_fa: string | null;
  category: string | null;
  canon_status: string | null;
  priority: string | null;
}

interface IranianReadinessRow {
  canonId: string;
  appProfileId: string;
  nameFa: string;
  nameEn: string;
  category: string;
  canonicalCategory: string | null;
  canonicalPriority: string | null;
  canonStatus: string | null;
  baseProfileType: 'legacy_seed' | 'ds0_fallback';
  readinessStatus: IranianReadiness;
  workstream: 'acquire_sources_and_recipe_profile' | 'finish_ds2_normalization' | 'review_legacy_estimate';
  dataUse: 'app_continuity_only' | 'identity_consensus_only' | 'legacy_estimate_only';
  confidence: string;
  portionGrams: number | null;
  portionKnown: boolean;
  evidenceTier: 'broad_fallback' | 'digital_consensus_identity_only' | 'legacy_estimate';
  promotionEligible: false;
  priorityScore: number;
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(headers: readonly string[], rows: readonly Record<string, unknown>[]): string {
  return `${headers.join(',')}\n${rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')).join('\n')}\n`;
}

function countBy<T>(values: readonly T[], selector: (value: T) => string): Record<string, number> {
  const result: Record<string, number> = {};
  for (const value of values) {
    const key = selector(value);
    result[key] = (result[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(result).sort(([left], [right]) => left.localeCompare(right)));
}

function normalizePersian(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('fa')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[ۀة]/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/[إأ]/g, 'ا')
    .replace(/[َُِّْٰـ]/g, '')
    .replace(/[\u200c\u200f\u202a-\u202e]/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function addNameMapping(map: Map<string, Set<string>>, value: string, canonId: string): void {
  const normalized = normalizePersian(value);
  if (!normalized) return;
  const targets = map.get(normalized) ?? new Set<string>();
  targets.add(canonId);
  map.set(normalized, targets);
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]!;
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

export function parseCsvRecords(text: string): Array<Record<string, string>> {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]!);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

export function classifyGenericRecord(input: GenericAuditInput): GenericReadiness {
  if (!input.conceptId) return 'missing_concept_mapping';
  if (input.macroCompleteness !== 1) return 'macro_incomplete';
  if (input.portionCount <= 0) return 'macro_ready_no_official_portion';
  return 'macro_and_portion_ready';
}

export function classifyIranianRecord(input: IranianAuditInput): {
  readinessStatus: IranianReadiness;
  workstream: IranianReadinessRow['workstream'];
  dataUse: IranianReadinessRow['dataUse'];
  evidenceTier: IranianReadinessRow['evidenceTier'];
  priorityScore: number;
} {
  const readinessStatus: IranianReadiness = input.hasDs2Consensus
    ? 'ds2_consensus_blocked'
    : input.baseProfileType === 'ds0_fallback'
      ? 'ds0_broad_fallback'
      : 'legacy_estimate';
  const mixedDish = ['stew', 'rice', 'kebab', 'soup', 'street_food', 'dessert'].includes(input.category);
  const statusScore = readinessStatus === 'ds0_broad_fallback' ? 100 : readinessStatus === 'ds2_consensus_blocked' ? 80 : 40;
  const priorityScore = statusScore
    + (mixedDish ? 15 : 5)
    + (input.portionGrams === null ? 10 : 0)
    + (input.canonicalPriority === 'P0' ? 10 : input.canonicalPriority === 'P1' ? 5 : 0)
    + (input.confidence === 'low' ? 5 : 0);
  if (readinessStatus === 'ds0_broad_fallback') {
    return {
      readinessStatus,
      workstream: 'acquire_sources_and_recipe_profile',
      dataUse: 'app_continuity_only',
      evidenceTier: 'broad_fallback',
      priorityScore,
    };
  }
  if (readinessStatus === 'ds2_consensus_blocked') {
    return {
      readinessStatus,
      workstream: 'finish_ds2_normalization',
      dataUse: 'identity_consensus_only',
      evidenceTier: 'digital_consensus_identity_only',
      priorityScore,
    };
  }
  return {
    readinessStatus,
    workstream: 'review_legacy_estimate',
    dataUse: 'legacy_estimate_only',
    evidenceTier: 'legacy_estimate',
    priorityScore,
  };
}

export function buildBalancedBatches<T extends { canonId: string; priorityScore: number }>(
  rows: readonly T[],
  batchCount = 12,
): Array<{ batchId: string; items: T[] }> {
  if (!Number.isInteger(batchCount) || batchCount <= 0) throw new Error('batchCount must be a positive integer.');
  const sorted = [...rows].sort((left, right) => right.priorityScore - left.priorityScore || left.canonId.localeCompare(right.canonId));
  const batches = Array.from({ length: batchCount }, (_, index) => ({
    batchId: `IRANIAN-BATCH-${String(index + 1).padStart(2, '0')}`,
    items: [] as T[],
  }));
  sorted.forEach((row, index) => batches[index % batchCount]!.items.push(row));
  return batches;
}

function buildAppToCanonMapping(
  canonRows: readonly IranianCanonRow[],
): Array<{ profile: IranianProfile; canonId: string }> {
  const canonIds = new Set(canonRows.map((row) => row.canon_id));
  const primaryNames = new Map<string, Set<string>>();
  const aliasNames = new Map<string, Set<string>>();
  for (const row of canonRows) {
    addNameMapping(primaryNames, row.name_fa, row.canon_id);
    for (const alias of (row.aliases_fa ?? '').split('|')) addNameMapping(aliasNames, alias, row.canon_id);
  }
  const mappings: Array<{ profile: IranianProfile; canonId: string }> = [];
  const unresolved: string[] = [];
  const ambiguous: string[] = [];
  for (const profile of [...IRANIAN_FOOD_SEED, ...IRANIAN_FALLBACK_SEED]) {
    let candidates = new Set<string>();
    const fallbackMatch = profile.id.match(/^iranian-fallback-ifkb-canon-(\d{5})$/);
    if (fallbackMatch?.[1]) {
      const canonId = `IFKB-CANON-${fallbackMatch[1]}`;
      if (canonIds.has(canonId)) candidates.add(canonId);
    }
    if (candidates.size === 0) {
      const primary = primaryNames.get(normalizePersian(profile.nameFa));
      if (primary) candidates = new Set(primary);
    }
    if (candidates.size === 0) {
      for (const alias of profile.aliasesFa) {
        const matches = aliasNames.get(normalizePersian(alias));
        if (!matches) continue;
        for (const canonId of matches) candidates.add(canonId);
      }
    }
    if (candidates.size === 1) mappings.push({ profile, canonId: [...candidates][0]! });
    else if (candidates.size === 0) unresolved.push(profile.id);
    else ambiguous.push(`${profile.id}=>${[...candidates].sort().join('|')}`);
  }
  if (unresolved.length > 0 || ambiguous.length > 0) {
    throw new Error(`Iranian mapping incomplete. unresolved=${unresolved.join(',')}; ambiguous=${ambiguous.join(',')}`);
  }
  return mappings.sort((left, right) => left.canonId.localeCompare(right.canonId));
}

function outputDirectory(): string {
  const index = process.argv.indexOf('--output-dir');
  return resolve(index >= 0 && process.argv[index + 1] ? process.argv[index + 1]! : '../build/full-nutrition-catalog-audit');
}

export function runAudit(outputDir: string): void {
  const databasePath = fileURLToPath(new URL('../assets/ifkb/ifkb-universal-v1.db', import.meta.url));
  const manifestPath = fileURLToPath(new URL('../assets/ifkb/ifkb-universal-v1.manifest.json', import.meta.url));
  const ds2Path = fileURLToPath(new URL('../../ifkb/digital_v0131/ds2_consensus_profiles.csv', import.meta.url));
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, unknown>;
  const databaseBytes = readFileSync(databasePath);
  if (sha256(databaseBytes) !== IFKB_CATALOG_RELEASE.databaseSha256) throw new Error('Catalog SHA-256 drift.');
  if (databaseBytes.byteLength !== IFKB_CATALOG_RELEASE.databaseBytes) throw new Error('Catalog byte-size drift.');
  if (manifest.databaseSha256 !== IFKB_CATALOG_RELEASE.databaseSha256) throw new Error('Manifest SHA-256 drift.');

  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const genericRows = database.prepare(`
      SELECT f.id,f.source_type,f.source_numeric_id,f.source_food_code,f.name_en,
             f.macro_completeness,f.portion_count,f.calcium_mg,f.iron_mg,
             f.potassium_mg,f.vitamin_c_mg,v.concept_id,c.mapping_policy,
             c.variant_count AS concept_variant_count,
             c.source_type_count AS concept_source_type_count
      FROM generic_foods f
      LEFT JOIN generic_variants v ON v.food_id=f.id
      LEFT JOIN generic_concepts c ON c.id=v.concept_id
      ORDER BY f.id;
    `).all() as unknown as GenericDbRow[];
    if (genericRows.length !== IFKB_CATALOG_RELEASE.genericFoodCount) {
      throw new Error(`Expected ${IFKB_CATALOG_RELEASE.genericFoodCount} generic records; found ${genericRows.length}.`);
    }
    const genericAuditRows = genericRows.map((row) => ({
      id: row.id,
      sourceType: row.source_type,
      sourceNumericId: row.source_numeric_id,
      sourceFoodCode: row.source_food_code,
      nameEn: row.name_en,
      readinessStatus: classifyGenericRecord({
        macroCompleteness: row.macro_completeness,
        portionCount: row.portion_count,
        conceptId: row.concept_id,
      }),
      macroComplete: row.macro_completeness === 1,
      portionCount: row.portion_count,
      hasOfficialPortion: row.portion_count > 0,
      conceptId: row.concept_id,
      mappingPolicy: row.mapping_policy,
      conceptVariantCount: row.concept_variant_count,
      conceptSourceTypeCount: row.concept_source_type_count,
      calciumAvailable: row.calcium_mg !== null,
      ironAvailable: row.iron_mg !== null,
      potassiumAvailable: row.potassium_mg !== null,
      vitaminCAvailable: row.vitamin_c_mg !== null,
    }));
    const genericReadinessCounts = countBy(genericAuditRows, (row) => row.readinessStatus);
    if ((genericReadinessCounts.missing_concept_mapping ?? 0) !== 0) throw new Error('Generic concept mapping coverage is incomplete.');
    if (genericAuditRows.filter((row) => row.macroComplete).length !== IFKB_CATALOG_RELEASE.macroCompleteCount) {
      throw new Error('Generic macro-complete count differs from release contract.');
    }

    const canonRows = database.prepare(`
      SELECT canon_id,name_fa,name_en,aliases_fa,category,canon_status,priority
      FROM iranian_canon ORDER BY canon_id;
    `).all() as unknown as IranianCanonRow[];
    const mappings = buildAppToCanonMapping(canonRows);
    if (mappings.length !== IFKB_CATALOG_RELEASE.iranianCanonCount) throw new Error('Iranian profile mapping count drift.');
    const canonById = new Map(canonRows.map((row) => [row.canon_id, row]));
    const ds2Records = parseCsvRecords(readFileSync(ds2Path, 'utf8'));
    const ds2CanonIds = new Set(ds2Records.map((row) => row.canon_id).filter(Boolean));
    if (ds2CanonIds.size !== 3) throw new Error(`Expected 3 DS2 canonical identities; found ${ds2CanonIds.size}.`);

    const iranianRows: IranianReadinessRow[] = mappings.map(({ profile, canonId }) => {
      const canon = canonById.get(canonId);
      if (!canon) throw new Error(`Missing canonical row ${canonId}.`);
      const baseProfileType = profile.id.startsWith('iranian-fallback-') ? 'ds0_fallback' : 'legacy_seed';
      const classified = classifyIranianRecord({
        baseProfileType,
        hasDs2Consensus: ds2CanonIds.has(canonId),
        portionGrams: profile.portionGrams,
        confidence: profile.confidence,
        category: profile.category,
        canonicalPriority: canon.priority,
      });
      return {
        canonId,
        appProfileId: profile.id,
        nameFa: profile.nameFa,
        nameEn: profile.nameEn,
        category: profile.category,
        canonicalCategory: canon.category,
        canonicalPriority: canon.priority,
        canonStatus: canon.canon_status,
        baseProfileType,
        readinessStatus: classified.readinessStatus,
        workstream: classified.workstream,
        dataUse: classified.dataUse,
        confidence: profile.confidence,
        portionGrams: profile.portionGrams,
        portionKnown: profile.portionGrams !== null,
        evidenceTier: classified.evidenceTier,
        promotionEligible: false,
        priorityScore: classified.priorityScore,
      };
    });
    const readinessCounts = countBy(iranianRows, (row) => row.readinessStatus);
    if ((readinessCounts.ds0_broad_fallback ?? 0) !== 178) throw new Error('Expected 178 DS0 fallback profiles.');
    if ((readinessCounts.ds2_consensus_blocked ?? 0) !== 3) throw new Error('Expected 3 DS2 blocked profiles.');
    if ((readinessCounts.legacy_estimate ?? 0) !== 80) throw new Error('Expected 80 non-DS2 legacy estimates.');

    const batches = buildBalancedBatches(iranianRows, 12);
    const batchAssignments = new Map<string, string>();
    for (const batch of batches) for (const row of batch.items) batchAssignments.set(row.canonId, batch.batchId);
    if (batchAssignments.size !== iranianRows.length) throw new Error('Batch assignment does not cover all Iranian identities.');
    const batchPlan = batches.map((batch) => ({
      batchId: batch.batchId,
      itemCount: batch.items.length,
      readinessCounts: countBy(batch.items, (row) => row.readinessStatus),
      workstreamCounts: countBy(batch.items, (row) => row.workstream),
      categoryCounts: countBy(batch.items, (row) => row.category),
      items: batch.items.map((row) => ({
        canonId: row.canonId,
        appProfileId: row.appProfileId,
        nameFa: row.nameFa,
        nameEn: row.nameEn,
        category: row.category,
        readinessStatus: row.readinessStatus,
        workstream: row.workstream,
        priorityScore: row.priorityScore,
      })),
    }));

    const genericHeaders = [
      'id','sourceType','sourceNumericId','sourceFoodCode','nameEn','readinessStatus','macroComplete',
      'portionCount','hasOfficialPortion','conceptId','mappingPolicy','conceptVariantCount',
      'conceptSourceTypeCount','calciumAvailable','ironAvailable','potassiumAvailable','vitaminCAvailable',
    ];
    const iranianHeaders = [
      'canonId','appProfileId','nameFa','nameEn','category','canonicalCategory','canonicalPriority','canonStatus',
      'baseProfileType','readinessStatus','workstream','dataUse','confidence','portionGrams','portionKnown',
      'evidenceTier','promotionEligible','priorityScore','batchId',
    ];
    const iranianCsvRows = iranianRows.map((row) => ({ ...row, batchId: batchAssignments.get(row.canonId) }));
    const genericExceptions = genericAuditRows.filter((row) => row.readinessStatus !== 'macro_and_portion_ready');
    const summary = {
      format: 'neofit-full-nutrition-catalog-bulk-audit',
      version: '1.0.0',
      catalogVersion: IFKB_CATALOG_RELEASE.version,
      databaseSha256: IFKB_CATALOG_RELEASE.databaseSha256,
      totalTrackedRecords: genericAuditRows.length + iranianRows.length,
      generic: {
        recordCount: genericAuditRows.length,
        conceptCount: IFKB_CATALOG_RELEASE.genericConceptCount,
        mappingCount: IFKB_CATALOG_RELEASE.genericVariantMappingCount,
        officialPortionCount: IFKB_CATALOG_RELEASE.genericPortionCount,
        readinessCounts: genericReadinessCounts,
        sourceCounts: countBy(genericAuditRows, (row) => row.sourceType),
        recordsWithOfficialPortions: genericAuditRows.filter((row) => row.hasOfficialPortion).length,
        exceptionQueueCount: genericExceptions.length,
        micronutrientCoverage: {
          calcium: genericAuditRows.filter((row) => row.calciumAvailable).length,
          iron: genericAuditRows.filter((row) => row.ironAvailable).length,
          potassium: genericAuditRows.filter((row) => row.potassiumAvailable).length,
          vitaminC: genericAuditRows.filter((row) => row.vitaminCAvailable).length,
        },
        readinessFingerprintSha256: sha256(genericAuditRows.map((row) => `${row.id}|${row.readinessStatus}|${row.conceptId ?? ''}|${row.portionCount}`).join('\n')),
      },
      iranian: {
        profileCount: iranianRows.length,
        baseProfileCounts: countBy(iranianRows, (row) => row.baseProfileType),
        readinessCounts,
        workstreamCounts: countBy(iranianRows, (row) => row.workstream),
        categoryCounts: countBy(iranianRows, (row) => row.category),
        knownPortionWeightCount: iranianRows.filter((row) => row.portionKnown).length,
        unknownPortionWeightCount: iranianRows.filter((row) => !row.portionKnown).length,
        promotionEligibleCount: 0,
        batchCount: batchPlan.length,
        smallestBatchSize: Math.min(...batchPlan.map((batch) => batch.itemCount)),
        largestBatchSize: Math.max(...batchPlan.map((batch) => batch.itemCount)),
        readinessFingerprintSha256: sha256(iranianRows.map((row) => `${row.canonId}|${row.appProfileId}|${row.readinessStatus}|${row.workstream}`).join('\n')),
        batchAssignmentFingerprintSha256: sha256(batchPlan.flatMap((batch) => batch.items.map((item) => `${item.canonId}|${batch.batchId}`)).sort().join('\n')),
      },
      interpretation: {
        genericRecordsAreAlreadyExtracted: true,
        iranianIdentitiesAreAlreadyPresent: true,
        remainingGenericWorkIsExceptionAndPortionReview: true,
        remainingIranianWorkIsEvidenceAndProfilePromotion: true,
        batchPlanIsOperationalPriorityNotScientificVerification: true,
      },
    };

    mkdirSync(outputDir, { recursive: true });
    writeFileSync(resolve(outputDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
    writeFileSync(resolve(outputDir, 'generic-record-readiness.csv'), csv(genericHeaders, genericAuditRows), 'utf8');
    writeFileSync(resolve(outputDir, 'generic-exception-queue.csv'), csv(genericHeaders, genericExceptions), 'utf8');
    writeFileSync(resolve(outputDir, 'iranian-profile-readiness.csv'), csv(iranianHeaders, iranianCsvRows), 'utf8');
    writeFileSync(resolve(outputDir, 'iranian-batch-plan.json'), `${JSON.stringify({
      format: 'neofit-iranian-profile-batch-plan',
      version: '1.0.0',
      batchCount: batchPlan.length,
      totalItems: iranianRows.length,
      policy: 'Twelve balanced execution batches; every batch mixes status/category work so no single food blocks overall progress.',
      batches: batchPlan,
    }, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify({
      outputDir,
      totalTrackedRecords: summary.totalTrackedRecords,
      genericReadinessCounts,
      genericExceptionQueueCount: genericExceptions.length,
      iranianReadinessCounts: readinessCounts,
      batchCount: batchPlan.length,
      batchSizeRange: [summary.iranian.smallestBatchSize, summary.iranian.largestBatchSize],
    }, null, 2));
  } finally {
    database.close();
  }
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(resolve(invokedPath)).href) runAudit(outputDirectory());
