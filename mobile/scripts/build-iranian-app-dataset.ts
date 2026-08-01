import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { IRANIAN_FALLBACK_SEED } from '../src/data/iranian-fallback-seed.generated';
import { IRANIAN_FOOD_SEED } from '../src/data/iranian-food-seed';

const VERSION = '0.15.0-stage3';
const RELEASED_AT = '2026-08-01T00:00:00.000Z';

const DEFAULT_SERVING_GRAMS: Record<string, number> = {
  stew: 250,
  rice: 300,
  kebab: 200,
  soup: 300,
  breakfast: 200,
  street_food: 180,
  bread: 60,
  dessert: 100,
  dairy_beverage: 250,
  ingredient: 100,
  custom: 200,
};

const IMAGE_MANIFESTS = [
  '../../ifkb/images/pilot_seed_manifest.csv',
  '../../ifkb/images/p0_wave2_accepted_manifest.csv',
  '../../ifkb/images/releases/0.12.2/retry-readjudicated-manifest.csv',
  '../../ifkb/images/releases/0.12.2/wave3-readjudicated-manifest.csv',
] as const;

type Profile =
  | (typeof IRANIAN_FOOD_SEED)[number]
  | (typeof IRANIAN_FALLBACK_SEED)[number];

interface CanonRow {
  canon_id: string;
  name_fa: string;
  name_en: string;
  aliases_fa: string | null;
  category: string | null;
  priority: string | null;
}

type Range = { low: number; central: number; high: number };

export interface IranianAppDatasetRow {
  canonId: string;
  appProfileId: string;
  nameFa: string;
  nameEn: string;
  aliasesFa: string[];
  aliasesEn: string[];
  category: string;
  priority: string | null;
  portionLabelFa: string;
  portionLabelEn: string;
  servingGrams: number;
  servingWeightSource: 'declared' | 'category_default_estimate';
  perServing: {
    caloriesKcal: Range;
    proteinG: Range;
    carbsG: Range;
    fatG: Range;
  };
  per100gCentral: {
    caloriesKcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  variabilityPct: number;
  confidence: 'low' | 'medium' | 'high';
  evidenceTier:
    | 'broad_fallback'
    | 'curated_estimate'
    | 'multi_source_identity_with_curated_nutrition';
  sourceLabel: string;
  notesFa: string;
  notesEn: string;
  requiresUserConfirmation: boolean;
  imageStatus: 'licensed_reference_available' | 'placeholder_required';
  imageKey: string;
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function nutritionRange(value: number, variabilityPct: number): Range {
  const fraction = variabilityPct / 100;
  return {
    low: round(Math.max(0, value * (1 - fraction))),
    central: round(value),
    high: round(value * (1 + fraction)),
  };
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

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]!);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows: readonly IranianAppDatasetRow[]): string {
  const headers = [
    'canonId', 'appProfileId', 'nameFa', 'nameEn', 'aliasesFa', 'aliasesEn',
    'category', 'priority', 'portionLabelFa', 'portionLabelEn', 'servingGrams',
    'servingWeightSource', 'caloriesLow', 'caloriesCentral', 'caloriesHigh',
    'proteinLow', 'proteinCentral', 'proteinHigh', 'carbsLow', 'carbsCentral',
    'carbsHigh', 'fatLow', 'fatCentral', 'fatHigh', 'per100gCalories',
    'per100gProtein', 'per100gCarbs', 'per100gFat', 'variabilityPct',
    'confidence', 'evidenceTier', 'sourceLabel', 'requiresUserConfirmation',
    'imageStatus', 'imageKey',
  ];
  const flatRows = rows.map((row) => ({
    canonId: row.canonId,
    appProfileId: row.appProfileId,
    nameFa: row.nameFa,
    nameEn: row.nameEn,
    aliasesFa: row.aliasesFa.join('|'),
    aliasesEn: row.aliasesEn.join('|'),
    category: row.category,
    priority: row.priority ?? '',
    portionLabelFa: row.portionLabelFa,
    portionLabelEn: row.portionLabelEn,
    servingGrams: row.servingGrams,
    servingWeightSource: row.servingWeightSource,
    caloriesLow: row.perServing.caloriesKcal.low,
    caloriesCentral: row.perServing.caloriesKcal.central,
    caloriesHigh: row.perServing.caloriesKcal.high,
    proteinLow: row.perServing.proteinG.low,
    proteinCentral: row.perServing.proteinG.central,
    proteinHigh: row.perServing.proteinG.high,
    carbsLow: row.perServing.carbsG.low,
    carbsCentral: row.perServing.carbsG.central,
    carbsHigh: row.perServing.carbsG.high,
    fatLow: row.perServing.fatG.low,
    fatCentral: row.perServing.fatG.central,
    fatHigh: row.perServing.fatG.high,
    per100gCalories: row.per100gCentral.caloriesKcal,
    per100gProtein: row.per100gCentral.proteinG,
    per100gCarbs: row.per100gCentral.carbsG,
    per100gFat: row.per100gCentral.fatG,
    variabilityPct: row.variabilityPct,
    confidence: row.confidence,
    evidenceTier: row.evidenceTier,
    sourceLabel: row.sourceLabel,
    requiresUserConfirmation: row.requiresUserConfirmation,
    imageStatus: row.imageStatus,
    imageKey: row.imageKey,
  }));
  return `${headers.join(',')}\n${flatRows
    .map((row) => headers.map((header) => csvEscape(row[header as keyof typeof row])).join(','))
    .join('\n')}\n`;
}

function addMapping(map: Map<string, Set<string>>, value: string, canonId: string): void {
  const key = normalizePersian(value);
  if (!key) return;
  const values = map.get(key) ?? new Set<string>();
  values.add(canonId);
  map.set(key, values);
}

function mapProfiles(canonRows: readonly CanonRow[]): Array<{ profile: Profile; canon: CanonRow }> {
  const canonIds = new Set(canonRows.map((row) => row.canon_id));
  const primary = new Map<string, Set<string>>();
  const aliases = new Map<string, Set<string>>();
  const canonById = new Map(canonRows.map((row) => [row.canon_id, row]));

  for (const row of canonRows) {
    addMapping(primary, row.name_fa, row.canon_id);
    for (const alias of (row.aliases_fa ?? '').split('|')) addMapping(aliases, alias, row.canon_id);
  }

  const output: Array<{ profile: Profile; canon: CanonRow }> = [];
  for (const profile of [...IRANIAN_FOOD_SEED, ...IRANIAN_FALLBACK_SEED]) {
    let candidates = new Set<string>();
    const fallbackMatch = profile.id.match(/^iranian-fallback-ifkb-canon-(\d{5})$/);
    if (fallbackMatch?.[1]) {
      const canonId = `IFKB-CANON-${fallbackMatch[1]}`;
      if (canonIds.has(canonId)) candidates.add(canonId);
    }
    if (candidates.size === 0) {
      const matches = primary.get(normalizePersian(profile.nameFa));
      if (matches) candidates = new Set(matches);
    }
    if (candidates.size === 0) {
      for (const alias of profile.aliasesFa) {
        for (const canonId of aliases.get(normalizePersian(alias)) ?? []) candidates.add(canonId);
      }
    }
    if (candidates.size !== 1) {
      throw new Error(
        `Iranian profile mapping failed for ${profile.id}; candidates=${[...candidates].join('|')}`,
      );
    }
    const canon = canonById.get([...candidates][0]!);
    if (!canon) throw new Error(`Missing canonical row for ${profile.id}.`);
    output.push({ profile, canon });
  }
  return output.sort((left, right) => left.canon.canon_id.localeCompare(right.canon.canon_id));
}

function loadImageCoverage(): Set<string> {
  const covered = new Set<string>();
  for (const relative of IMAGE_MANIFESTS) {
    const path = fileURLToPath(new URL(relative, import.meta.url));
    for (const row of parseCsv(readFileSync(path, 'utf8'))) {
      const canonId = (row.canon_id || row.canonId || '').trim();
      if (canonId) covered.add(canonId);
    }
  }
  return covered;
}

function loadDs2CanonIds(): Set<string> {
  const path = fileURLToPath(
    new URL('../../ifkb/digital_v0131/ds2_consensus_profiles.csv', import.meta.url),
  );
  return new Set(parseCsv(readFileSync(path, 'utf8')).map((row) => row.canon_id).filter(Boolean));
}

export function buildIranianAppDataset(outputDir: string): {
  foods: IranianAppDatasetRow[];
  manifest: Record<string, unknown>;
} {
  const databasePath = fileURLToPath(
    new URL('../assets/ifkb/ifkb-universal-v1.db', import.meta.url),
  );
  const database = new DatabaseSync(databasePath, { readOnly: true });
  let canonRows: CanonRow[];
  try {
    canonRows = database.prepare(`
      SELECT canon_id,name_fa,name_en,aliases_fa,category,priority
      FROM iranian_canon ORDER BY canon_id;
    `).all() as unknown as CanonRow[];
  } finally {
    database.close();
  }

  const ds2CanonIds = loadDs2CanonIds();
  const imageCoverage = loadImageCoverage();
  const mappings = mapProfiles(canonRows);

  const foods: IranianAppDatasetRow[] = mappings.map(({ profile, canon }) => {
    const declared = profile.portionGrams !== null;
    const servingGrams =
      profile.portionGrams ??
      DEFAULT_SERVING_GRAMS[profile.category] ??
      DEFAULT_SERVING_GRAMS.custom!;
    const isFallback = profile.id.startsWith('iranian-fallback-');
    const evidenceTier = isFallback
      ? 'broad_fallback'
      : ds2CanonIds.has(canon.canon_id)
        ? 'multi_source_identity_with_curated_nutrition'
        : 'curated_estimate';

    const perServing = {
      caloriesKcal: nutritionRange(profile.calories, profile.variabilityPct),
      proteinG: nutritionRange(profile.proteinG, profile.variabilityPct),
      carbsG: nutritionRange(profile.carbsG, profile.variabilityPct),
      fatG: nutritionRange(profile.fatG, profile.variabilityPct),
    };

    return {
      canonId: canon.canon_id,
      appProfileId: profile.id,
      nameFa: profile.nameFa,
      nameEn: profile.nameEn,
      aliasesFa: [...profile.aliasesFa],
      aliasesEn: [...profile.aliasesEn],
      category: profile.category,
      priority: canon.priority,
      portionLabelFa: profile.portionLabelFa,
      portionLabelEn: profile.portionLabelEn,
      servingGrams,
      servingWeightSource: declared ? 'declared' : 'category_default_estimate',
      perServing,
      per100gCentral: {
        caloriesKcal: round((profile.calories * 100) / servingGrams),
        proteinG: round((profile.proteinG * 100) / servingGrams),
        carbsG: round((profile.carbsG * 100) / servingGrams),
        fatG: round((profile.fatG * 100) / servingGrams),
      },
      variabilityPct: profile.variabilityPct,
      confidence: profile.confidence,
      evidenceTier,
      sourceLabel: profile.sourceLabel,
      notesFa: profile.notesFa,
      notesEn: profile.notesEn,
      requiresUserConfirmation: profile.confidence === 'low' || !declared,
      imageStatus: imageCoverage.has(canon.canon_id)
        ? 'licensed_reference_available'
        : 'placeholder_required',
      imageKey: canon.canon_id,
    };
  });

  if (foods.length !== 261 || new Set(foods.map((food) => food.canonId)).size !== 261) {
    throw new Error(`Expected 261 unique Iranian foods; found ${foods.length}.`);
  }
  for (const food of foods) {
    if (!Number.isFinite(food.servingGrams) || food.servingGrams <= 0) {
      throw new Error(`Invalid serving grams for ${food.canonId}.`);
    }
    for (const value of [
      food.perServing.caloriesKcal.central,
      food.perServing.proteinG.central,
      food.perServing.carbsG.central,
      food.perServing.fatG.central,
      food.per100gCentral.caloriesKcal,
      food.per100gCentral.proteinG,
      food.per100gCentral.carbsG,
      food.per100gCentral.fatG,
    ]) {
      if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid nutrition for ${food.canonId}.`);
    }
  }

  const evidenceCounts = foods.reduce<Record<string, number>>((result, food) => {
    result[food.evidenceTier] = (result[food.evidenceTier] ?? 0) + 1;
    return result;
  }, {});
  const manifest = {
    format: 'neofit-iranian-app-dataset',
    version: VERSION,
    releasedAt: RELEASED_AT,
    foodCount: foods.length,
    declaredServingWeightCount: foods.filter((food) => food.servingWeightSource === 'declared').length,
    estimatedServingWeightCount: foods.filter(
      (food) => food.servingWeightSource === 'category_default_estimate',
    ).length,
    evidenceCounts,
    confidenceCounts: foods.reduce<Record<string, number>>((result, food) => {
      result[food.confidence] = (result[food.confidence] ?? 0) + 1;
      return result;
    }, {}),
    licensedImageReferenceCount: foods.filter(
      (food) => food.imageStatus === 'licensed_reference_available',
    ).length,
    placeholderImageCount: foods.filter((food) => food.imageStatus === 'placeholder_required').length,
    policies: {
      everyFoodIsUsableInApp: true,
      missingServingWeightsUseCategoryDefaults: true,
      estimatedWeightsAreExplicitlyLabeled: true,
      lowConfidenceFoodsRequireUserConfirmation: true,
      providerOrLlmNutritionAccepted: false,
      imageAbsenceBlocksNutrition: false,
    },
    foodsSha256: sha256(JSON.stringify(foods)),
  };

  mkdirSync(outputDir, { recursive: true });
  const dataset = {
    format: manifest.format,
    version: VERSION,
    releasedAt: RELEASED_AT,
    manifest,
    foods,
  };
  writeFileSync(resolve(outputDir, 'iranian-foods.json'), `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');
  writeFileSync(resolve(outputDir, 'iranian-foods.csv'), toCsv(foods), 'utf8');
  writeFileSync(resolve(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  writeFileSync(
    resolve(outputDir, 'README.md'),
    [
      '# NeoFit Iranian App Dataset — Stage 3/10',
      '',
      '- 261 canonical Iranian foods.',
      '- JSON and CSV outputs.',
      '- Every row has a usable serving weight and central/range nutrition values.',
      '- Category-default serving weights are estimates and remain explicitly labeled.',
      '- Missing images use an application placeholder and never block nutrition.',
      '- This is an app dataset, not a laboratory or food-labelling database.',
      '',
    ].join('\n'),
    'utf8',
  );

  return { foods, manifest };
}

function outputDirectory(): string {
  const index = process.argv.indexOf('--output-dir');
  return resolve(
    index >= 0 && process.argv[index + 1]
      ? process.argv[index + 1]!
      : '../build/iranian-app-dataset',
  );
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  const result = buildIranianAppDataset(outputDirectory());
  console.log(JSON.stringify(result.manifest, null, 2));
}
