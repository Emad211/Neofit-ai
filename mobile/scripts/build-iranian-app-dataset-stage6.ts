import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import {
  STAGE6_ANALOG_RULES,
  STAGE6_ANALOG_TARGET_COUNT,
  type Stage6AnalogRule,
  type Stage6AnalogTier,
} from '../src/data/iranian-generic-analog-rules';
import { buildIranianAppDatasetStage5 } from './build-iranian-app-dataset-stage5';

const VERSION = '0.17.0-stage6';
const RELEASED_AT = '2026-08-01T03:00:00.000Z';
const MAX_ANALOGS_PER_FOOD = 8;

type Stage5Row = ReturnType<typeof buildIranianAppDatasetStage5>['foods'][number];
type Range = { low: number; central: number; high: number };
type MacroVector = {
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

interface GenericFoodRow {
  id: string;
  source_type: string;
  name_en: string;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  portion_count: number;
}

interface PortionRow {
  food_id: string;
  label: string;
  gram_weight: number;
}

interface SelectedAnalog {
  row: GenericFoodRow;
  score: number;
}

interface AnalogResolution {
  canonId: string;
  ruleNote: string;
  status: 'selected' | 'no_safe_analog';
  tierIndex: number | null;
  candidates: SelectedAnalog[];
  analogWeight: number;
  medianPer100g: MacroVector | null;
  officialPortionWeights: number[];
}

type Stage6Row = Omit<
  Stage5Row,
  'evidenceTier' | 'estimateModelId' | 'servingWeightSource'
> & {
  evidenceTier:
    | 'generic_analog_fallback'
    | 'archetype_fallback'
    | 'curated_estimate'
    | 'multi_source_identity_with_curated_nutrition';
  estimateModelId:
    | 'ifkb-generic-analog-v1'
    | 'ifkb-archetype-prior-v2'
    | 'legacy-curated-profile'
    | 'ds2-identity-curated-nutrition';
  servingWeightSource:
    | 'declared'
    | 'category_default_estimate'
    | 'archetype_default_estimate';
  analogStatus: 'selected' | 'no_safe_analog' | null;
  analogSupportCount: number | null;
  analogWeight: number | null;
  analogTierIndex: number | null;
  analogRuleNote: string | null;
  analogSourceIds: string[];
  analogSourceNames: string[];
  analogSourceTypes: string[];
  analogMedianPer100g: MacroVector | null;
  genericPortionSupportCount: number | null;
  genericPortionMedianGrams: number | null;
};

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function median(values: readonly number[]): number {
  if (values.length === 0) throw new Error('Cannot calculate an empty median.');
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function nutritionRange(value: number, variabilityPct: number): Range {
  const fraction = variabilityPct / 100;
  return {
    low: round(Math.max(0, value * (1 - fraction))),
    central: round(value),
    high: round(value * (1 + fraction)),
  };
}

function normalizeEnglish(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasPhrase(normalizedName: string, phrase: string): boolean {
  const target = normalizeEnglish(phrase);
  if (!target) return false;
  return ` ${normalizedName} `.includes(` ${target} `)
    || normalizedName.startsWith(`${target} `)
    || normalizedName.endsWith(` ${target}`);
}

function matchesTier(row: GenericFoodRow, tier: Stage6AnalogTier): boolean {
  const name = normalizeEnglish(row.name_en);
  if (!tier.includeAny.some((phrase) => hasPhrase(name, phrase))) return false;
  if ((tier.excludeAny ?? []).some((phrase) => hasPhrase(name, phrase))) return false;
  return true;
}

function scoreCandidate(row: GenericFoodRow, tier: Stage6AnalogTier): number {
  const name = normalizeEnglish(row.name_en);
  let score = 0;
  for (const phrase of tier.includeAny) {
    const normalized = normalizeEnglish(phrase);
    if (name === normalized) score += 100;
    else if (hasPhrase(name, phrase)) score += 35 + Math.min(20, normalized.length);
  }
  for (const phrase of tier.preferAny ?? []) {
    if (hasPhrase(name, phrase)) score += 20;
  }
  if (/fndds/i.test(row.source_type)) score += 8;
  if (/sr.?legacy/i.test(row.source_type)) score += 4;
  score += Math.min(6, Math.max(0, row.portion_count));
  score -= Math.max(0, name.split(' ').length - 12);
  return score;
}

function uniqueCandidates(candidates: SelectedAnalog[]): SelectedAnalog[] {
  const seenNames = new Set<string>();
  const seenTuples = new Set<string>();
  const output: SelectedAnalog[] = [];
  for (const candidate of candidates.sort(
    (left, right) => right.score - left.score || left.row.id.localeCompare(right.row.id),
  )) {
    const name = normalizeEnglish(candidate.row.name_en);
    const tuple = [
      round(candidate.row.calories_kcal, 1),
      round(candidate.row.protein_g, 1),
      round(candidate.row.carbs_g, 1),
      round(candidate.row.fat_g, 1),
    ].join('|');
    if (seenNames.has(name) || seenTuples.has(tuple)) continue;
    seenNames.add(name);
    seenTuples.add(tuple);
    output.push(candidate);
    if (output.length >= MAX_ANALOGS_PER_FOOD) break;
  }
  return output;
}

function selectCandidates(
  genericRows: readonly GenericFoodRow[],
  rule: Stage6AnalogRule,
): { tierIndex: number | null; candidates: SelectedAnalog[] } {
  let firstNonEmpty: { tierIndex: number; candidates: SelectedAnalog[] } | null = null;
  for (let tierIndex = 0; tierIndex < rule.tiers.length; tierIndex += 1) {
    const tier = rule.tiers[tierIndex]!;
    const candidates = uniqueCandidates(
      genericRows
        .filter((row) => matchesTier(row, tier))
        .map((row) => ({ row, score: scoreCandidate(row, tier) })),
    );
    if (candidates.length >= 2) return { tierIndex, candidates };
    if (candidates.length > 0 && !firstNonEmpty) firstNonEmpty = { tierIndex, candidates };
  }
  return firstNonEmpty ?? { tierIndex: null, candidates: [] };
}

function medianMacros(candidates: readonly SelectedAnalog[]): MacroVector {
  return {
    caloriesKcal: round(median(candidates.map((candidate) => candidate.row.calories_kcal))),
    proteinG: round(median(candidates.map((candidate) => candidate.row.protein_g))),
    carbsG: round(median(candidates.map((candidate) => candidate.row.carbs_g))),
    fatG: round(median(candidates.map((candidate) => candidate.row.fat_g))),
  };
}

function analogWeight(supportCount: number, tierIndex: number | null): number {
  const base = supportCount >= 6 ? 0.6
    : supportCount >= 3 ? 0.5
      : supportCount === 2 ? 0.4
        : supportCount === 1 ? 0.3
          : 0;
  return Math.min(0.65, base + (tierIndex === 0 && supportCount > 0 ? 0.05 : 0));
}

function clampRatio(analog: number, baseline: number, low: number, high: number): number {
  if (baseline <= 0) return Math.max(0, analog);
  return Math.min(baseline * high, Math.max(baseline * low, analog));
}

function blendMacros(
  stage5: MacroVector,
  analog: MacroVector,
  weight: number,
): MacroVector {
  const bounded = {
    caloriesKcal: clampRatio(analog.caloriesKcal, stage5.caloriesKcal, 0.5, 2),
    proteinG: clampRatio(analog.proteinG, stage5.proteinG, 0.25, 3),
    carbsG: clampRatio(analog.carbsG, stage5.carbsG, 0.25, 3),
    fatG: clampRatio(analog.fatG, stage5.fatG, 0.25, 3),
  };
  return {
    caloriesKcal: round(stage5.caloriesKcal * (1 - weight) + bounded.caloriesKcal * weight),
    proteinG: round(stage5.proteinG * (1 - weight) + bounded.proteinG * weight),
    carbsG: round(stage5.carbsG * (1 - weight) + bounded.carbsG * weight),
    fatG: round(stage5.fatG * (1 - weight) + bounded.fatG * weight),
  };
}

function countBy<T>(values: readonly T[], selector: (value: T) => string): Record<string, number> {
  const output: Record<string, number> = {};
  for (const value of values) {
    const key = selector(value);
    output[key] = (output[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(output).sort(([left], [right]) => left.localeCompare(right)));
}

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function analogRegistryCsv(
  foodsByCanon: ReadonlyMap<string, Stage5Row>,
  resolutions: readonly AnalogResolution[],
): string {
  const headers = [
    'canonId','nameFa','nameEn','archetypeId','archetypeSampleCount','ruleNote',
    'status','tierIndex','supportCount','analogWeight','sourceIds','sourceNames',
    'sourceTypes','analogCaloriesPer100g','analogProteinPer100g','analogCarbsPer100g',
    'analogFatPer100g','officialPortionSupportCount','officialPortionMedianGrams',
  ] as const;
  const rows = resolutions.map((resolution) => {
    const food = foodsByCanon.get(resolution.canonId);
    const sourceTypes = [...new Set(resolution.candidates.map((candidate) => candidate.row.source_type))];
    return {
      canonId: resolution.canonId,
      nameFa: food?.nameFa ?? '',
      nameEn: food?.nameEn ?? '',
      archetypeId: food?.archetypeId ?? '',
      archetypeSampleCount: food?.archetypeSampleCount ?? '',
      ruleNote: resolution.ruleNote,
      status: resolution.status,
      tierIndex: resolution.tierIndex ?? '',
      supportCount: resolution.candidates.length,
      analogWeight: resolution.analogWeight,
      sourceIds: resolution.candidates.map((candidate) => candidate.row.id).join('|'),
      sourceNames: resolution.candidates.map((candidate) => candidate.row.name_en).join('|'),
      sourceTypes: sourceTypes.join('|'),
      analogCaloriesPer100g: resolution.medianPer100g?.caloriesKcal ?? '',
      analogProteinPer100g: resolution.medianPer100g?.proteinG ?? '',
      analogCarbsPer100g: resolution.medianPer100g?.carbsG ?? '',
      analogFatPer100g: resolution.medianPer100g?.fatG ?? '',
      officialPortionSupportCount: resolution.officialPortionWeights.length,
      officialPortionMedianGrams: resolution.officialPortionWeights.length > 0
        ? round(median(resolution.officialPortionWeights))
        : '',
    };
  });
  return `${headers.join(',')}\n${rows.map((row) =>
    headers.map((header) => csvEscape(row[header])).join(',')).join('\n')}\n`;
}

function datasetCsv(rows: readonly Stage6Row[]): string {
  const headers = [
    'canonId','appProfileId','nameFa','nameEn','category','priority','portionLabelFa',
    'portionLabelEn','servingGrams','servingWeightSource','caloriesLow','caloriesCentral',
    'caloriesHigh','proteinCentral','carbsCentral','fatCentral','per100gCalories',
    'per100gProtein','per100gCarbs','per100gFat','variabilityPct','confidence',
    'evidenceTier','estimateModelId','archetypeId','archetypeSampleCount','analogStatus',
    'analogSupportCount','analogWeight','analogTierIndex','analogRuleNote','analogSourceIds',
    'analogSourceNames','analogSourceTypes','genericPortionSupportCount',
    'genericPortionMedianGrams','sourceLabel','requiresUserConfirmation','imageStatus','imageKey',
  ] as const;
  const flat = rows.map((row) => ({
    canonId: row.canonId,
    appProfileId: row.appProfileId,
    nameFa: row.nameFa,
    nameEn: row.nameEn,
    category: row.category,
    priority: row.priority ?? '',
    portionLabelFa: row.portionLabelFa,
    portionLabelEn: row.portionLabelEn,
    servingGrams: row.servingGrams,
    servingWeightSource: row.servingWeightSource,
    caloriesLow: row.perServing.caloriesKcal.low,
    caloriesCentral: row.perServing.caloriesKcal.central,
    caloriesHigh: row.perServing.caloriesKcal.high,
    proteinCentral: row.perServing.proteinG.central,
    carbsCentral: row.perServing.carbsG.central,
    fatCentral: row.perServing.fatG.central,
    per100gCalories: row.per100gCentral.caloriesKcal,
    per100gProtein: row.per100gCentral.proteinG,
    per100gCarbs: row.per100gCentral.carbsG,
    per100gFat: row.per100gCentral.fatG,
    variabilityPct: row.variabilityPct,
    confidence: row.confidence,
    evidenceTier: row.evidenceTier,
    estimateModelId: row.estimateModelId,
    archetypeId: row.archetypeId ?? '',
    archetypeSampleCount: row.archetypeSampleCount ?? '',
    analogStatus: row.analogStatus ?? '',
    analogSupportCount: row.analogSupportCount ?? '',
    analogWeight: row.analogWeight ?? '',
    analogTierIndex: row.analogTierIndex ?? '',
    analogRuleNote: row.analogRuleNote ?? '',
    analogSourceIds: row.analogSourceIds.join('|'),
    analogSourceNames: row.analogSourceNames.join('|'),
    analogSourceTypes: row.analogSourceTypes.join('|'),
    genericPortionSupportCount: row.genericPortionSupportCount ?? '',
    genericPortionMedianGrams: row.genericPortionMedianGrams ?? '',
    sourceLabel: row.sourceLabel,
    requiresUserConfirmation: row.requiresUserConfirmation,
    imageStatus: row.imageStatus,
    imageKey: row.imageKey,
  }));
  return `${headers.join(',')}\n${flat.map((row) =>
    headers.map((header) => csvEscape(row[header])).join(',')).join('\n')}\n`;
}

export function buildIranianAppDatasetStage6(outputDir: string): {
  foods: Stage6Row[];
  manifest: Record<string, unknown>;
  resolutions: AnalogResolution[];
} {
  const temporary = mkdtempSync(resolve(tmpdir(), 'neofit-stage5-baseline-'));
  let stage5: ReturnType<typeof buildIranianAppDatasetStage5>;
  try {
    stage5 = buildIranianAppDatasetStage5(temporary);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }

  const targetRows = stage5.foods.filter(
    (food) => food.evidenceTier === 'archetype_fallback'
      && (food.archetypeSampleCount ?? Number.POSITIVE_INFINITY) <= 1,
  );
  if (targetRows.length !== STAGE6_ANALOG_TARGET_COUNT || targetRows.length !== 69) {
    throw new Error(
      `Stage 6 target registry mismatch: dataset=${targetRows.length}, rules=${STAGE6_ANALOG_TARGET_COUNT}.`,
    );
  }
  const targetIds = new Set(targetRows.map((food) => food.canonId));
  const missingRules = targetRows.filter((food) => !STAGE6_ANALOG_RULES[food.canonId]);
  const extraRules = Object.keys(STAGE6_ANALOG_RULES).filter((canonId) => !targetIds.has(canonId));
  if (missingRules.length > 0 || extraRules.length > 0) {
    throw new Error(
      `Stage 6 analog rules do not match targets. missing=${missingRules.map((food) => food.canonId).join('|')}; extra=${extraRules.join('|')}`,
    );
  }

  const databasePath = fileURLToPath(
    new URL('../assets/ifkb/ifkb-universal-v1.db', import.meta.url),
  );
  const database = new DatabaseSync(databasePath, { readOnly: true });
  let genericRows: GenericFoodRow[];
  try {
    genericRows = database.prepare(`
      SELECT id,source_type,name_en,calories_kcal,protein_g,carbs_g,fat_g,portion_count
      FROM generic_foods
      WHERE macro_completeness=1
        AND calories_kcal IS NOT NULL
        AND protein_g IS NOT NULL
        AND carbs_g IS NOT NULL
        AND fat_g IS NOT NULL
      ORDER BY id;
    `).all() as unknown as GenericFoodRow[];
  } finally {
    database.close();
  }

  const initialResolutions = targetRows.map((food): AnalogResolution => {
    const rule = STAGE6_ANALOG_RULES[food.canonId]!;
    const selected = selectCandidates(genericRows, rule);
    const medianPer100g = selected.candidates.length > 0
      ? medianMacros(selected.candidates)
      : null;
    return {
      canonId: food.canonId,
      ruleNote: rule.note,
      status: selected.candidates.length > 0 ? 'selected' : 'no_safe_analog',
      tierIndex: selected.tierIndex,
      candidates: selected.candidates,
      analogWeight: analogWeight(selected.candidates.length, selected.tierIndex),
      medianPer100g,
      officialPortionWeights: [],
    };
  });

  const selectedIds = [...new Set(initialResolutions.flatMap(
    (resolution) => resolution.candidates.map((candidate) => candidate.row.id),
  ))];
  const portionRows: PortionRow[] = [];
  const portionsDatabase = new DatabaseSync(databasePath, { readOnly: true });
  try {
    for (let offset = 0; offset < selectedIds.length; offset += 300) {
      const chunk = selectedIds.slice(offset, offset + 300);
      if (chunk.length === 0) continue;
      const placeholders = chunk.map(() => '?').join(',');
      portionRows.push(...portionsDatabase.prepare(`
        SELECT food_id,label,gram_weight
        FROM generic_portions
        WHERE food_id IN (${placeholders})
          AND gram_weight BETWEEN 10 AND 1000
        ORDER BY food_id,id;
      `).all(...chunk) as unknown as PortionRow[]);
    }
  } finally {
    portionsDatabase.close();
  }
  const portionsByFood = new Map<string, number[]>();
  for (const portion of portionRows) {
    const label = normalizeEnglish(portion.label);
    if (label === '100 g' || label === '1 g' || label.includes('quantity not specified')) continue;
    const values = portionsByFood.get(portion.food_id) ?? [];
    values.push(portion.gram_weight);
    portionsByFood.set(portion.food_id, values);
  }

  const resolutions = initialResolutions.map((resolution): AnalogResolution => ({
    ...resolution,
    officialPortionWeights: resolution.candidates.flatMap(
      (candidate) => portionsByFood.get(candidate.row.id) ?? [],
    ),
  }));
  const resolutionByCanon = new Map(
    resolutions.map((resolution) => [resolution.canonId, resolution] as const),
  );

  const foods: Stage6Row[] = stage5.foods.map((food): Stage6Row => {
    const resolution = resolutionByCanon.get(food.canonId);
    if (!resolution) {
      return {
        ...food,
        analogStatus: null,
        analogSupportCount: null,
        analogWeight: null,
        analogTierIndex: null,
        analogRuleNote: null,
        analogSourceIds: [],
        analogSourceNames: [],
        analogSourceTypes: [],
        analogMedianPer100g: null,
        genericPortionSupportCount: null,
        genericPortionMedianGrams: null,
      };
    }
    if (!resolution.medianPer100g || resolution.candidates.length === 0) {
      return {
        ...food,
        analogStatus: 'no_safe_analog',
        analogSupportCount: 0,
        analogWeight: 0,
        analogTierIndex: null,
        analogRuleNote: resolution.ruleNote,
        analogSourceIds: [],
        analogSourceNames: [],
        analogSourceTypes: [],
        analogMedianPer100g: null,
        genericPortionSupportCount: 0,
        genericPortionMedianGrams: null,
        notesFa: `${food.notesFa} در مرحله ۶ analog عمومی امنی در USDA/FNDDS پیدا نشد؛ مقدار مرحله ۵ بدون تغییر باقی ماند.`,
        notesEn: `${food.notesEn} Stage 6 found no safe USDA/FNDDS generic analog, so the Stage 5 value remains unchanged.`,
      };
    }

    const blendedPer100g = blendMacros(
      food.per100gCentral,
      resolution.medianPer100g,
      resolution.analogWeight,
    );
    const scale = food.servingGrams / 100;
    const perServingCentral = {
      caloriesKcal: round(blendedPer100g.caloriesKcal * scale),
      proteinG: round(blendedPer100g.proteinG * scale),
      carbsG: round(blendedPer100g.carbsG * scale),
      fatG: round(blendedPer100g.fatG * scale),
    };
    const variabilityPct = Math.max(
      35,
      food.variabilityPct - (resolution.candidates.length >= 3 ? 5 : 0),
    );
    const sourceTypes = [...new Set(
      resolution.candidates.map((candidate) => candidate.row.source_type),
    )];
    const sourceIds = resolution.candidates.map((candidate) => candidate.row.id);
    const sourceNames = resolution.candidates.map((candidate) => candidate.row.name_en);
    const portionMedian = resolution.officialPortionWeights.length > 0
      ? round(median(resolution.officialPortionWeights))
      : null;

    return {
      ...food,
      perServing: {
        caloriesKcal: nutritionRange(perServingCentral.caloriesKcal, variabilityPct),
        proteinG: nutritionRange(perServingCentral.proteinG, variabilityPct),
        carbsG: nutritionRange(perServingCentral.carbsG, variabilityPct),
        fatG: nutritionRange(perServingCentral.fatG, variabilityPct),
      },
      per100gCentral: blendedPer100g,
      variabilityPct,
      evidenceTier: 'generic_analog_fallback',
      estimateModelId: 'ifkb-generic-analog-v1',
      sourceLabel: `IFKB generic analog fallback v1; exactGenericRecords=${sourceIds.join('|')}; analogWeight=${resolution.analogWeight}; not exact-food evidence`,
      notesFa: `برآورد مرحله ۶ با ${sourceIds.length} رکورد عمومی USDA/FNDDS (${resolution.ruleNote}) و prior مرحله ۵ به‌صورت محافظه‌کارانه ترکیب شده است. این رکوردها analog هستند، نه مدرک تغذیه‌ای دقیق برای خود غذا.`,
      notesEn: `Stage 6 conservatively blends ${sourceIds.length} USDA/FNDDS generic records (${resolution.ruleNote}) with the Stage 5 prior. These are analogs, not exact-food nutrition evidence.`,
      requiresUserConfirmation: true,
      analogStatus: 'selected',
      analogSupportCount: sourceIds.length,
      analogWeight: resolution.analogWeight,
      analogTierIndex: resolution.tierIndex,
      analogRuleNote: resolution.ruleNote,
      analogSourceIds: sourceIds,
      analogSourceNames: sourceNames,
      analogSourceTypes: sourceTypes,
      analogMedianPer100g: resolution.medianPer100g,
      genericPortionSupportCount: resolution.officialPortionWeights.length,
      genericPortionMedianGrams: portionMedian,
    };
  });

  const analogRows = foods.filter((food) => food.evidenceTier === 'generic_analog_fallback');
  const unresolvedRows = foods.filter((food) => food.analogStatus === 'no_safe_analog');
  if (analogRows.length < 50) {
    throw new Error(`Stage 6 requires at least 50 safely selected analog rows; found ${analogRows.length}.`);
  }
  for (const food of analogRows) {
    if (!food.analogSourceIds.length || food.analogSupportCount !== food.analogSourceIds.length) {
      throw new Error(`Analog provenance incomplete for ${food.canonId}.`);
    }
    if (food.confidence !== 'low' || !food.requiresUserConfirmation) {
      throw new Error(`Analog fallback ${food.canonId} escaped low-confidence confirmation policy.`);
    }
    for (const value of Object.values(food.per100gCentral)) {
      if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid Stage 6 nutrition for ${food.canonId}.`);
    }
  }

  const stage5ByCanon = new Map(stage5.foods.map((food) => [food.canonId, food] as const));
  const calorieChanges = analogRows.map((food) => Math.abs(
    food.perServing.caloriesKcal.central
      - (stage5ByCanon.get(food.canonId)?.perServing.caloriesKcal.central ?? 0),
  ));
  const manifest = {
    format: 'neofit-iranian-app-dataset',
    version: VERSION,
    releasedAt: RELEASED_AT,
    foodCount: foods.length,
    stage6TargetCount: targetRows.length,
    genericAnalogFallbackCount: analogRows.length,
    noSafeAnalogCount: unresolvedRows.length,
    retainedStage5ArchetypeFallbackCount: foods.filter(
      (food) => food.evidenceTier === 'archetype_fallback',
    ).length,
    analogRuleCount: STAGE6_ANALOG_TARGET_COUNT,
    analogSupportCounts: countBy(analogRows, (food) => String(food.analogSupportCount ?? 0)),
    analogSourceTypeCounts: countBy(
      analogRows.flatMap((food) => food.analogSourceTypes),
      (value) => value,
    ),
    analogTierCounts: countBy(analogRows, (food) => String(food.analogTierIndex ?? 'none')),
    analogPortionSupport: {
      foodsWithOfficialPortionSupport: analogRows.filter(
        (food) => (food.genericPortionSupportCount ?? 0) > 0,
      ).length,
      totalOfficialPortionRows: analogRows.reduce(
        (total, food) => total + (food.genericPortionSupportCount ?? 0),
        0,
      ),
    },
    improvementAgainstStage5: {
      calorieChangedFoodCount: calorieChanges.filter((value) => value > 0).length,
      medianAbsoluteCalorieChange: calorieChanges.length > 0 ? round(median(calorieChanges)) : 0,
      maximumAbsoluteCalorieChange: calorieChanges.length > 0 ? round(Math.max(...calorieChanges)) : 0,
    },
    evidenceCounts: countBy(foods, (food) => food.evidenceTier),
    confidenceCounts: countBy(foods, (food) => food.confidence),
    policies: {
      exactGenericRecordIdsRetained: true,
      genericAnalogsAreNotExactFoodEvidence: true,
      targetFoodsRemainLowConfidence: true,
      everyAnalogFallbackRequiresUserConfirmation: true,
      importedAndUserFoodsRemainProtected: true,
      providerOrLlmNutritionAccepted: false,
      visionAndLlmIdentityPipelineChanged: false,
      noSafeAnalogFallsBackExplicitlyToStage5: true,
    },
    stage5FoodsSha256: stage5.manifest.foodsSha256,
    analogRegistrySha256: sha256(JSON.stringify(resolutions.map((resolution) => ({
      canonId: resolution.canonId,
      status: resolution.status,
      tierIndex: resolution.tierIndex,
      sourceIds: resolution.candidates.map((candidate) => candidate.row.id),
      analogWeight: resolution.analogWeight,
    })))),
    foodsSha256: sha256(JSON.stringify(foods)),
  };

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(resolve(outputDir, 'iranian-foods.json'), `${JSON.stringify({
    format: manifest.format,
    version: VERSION,
    releasedAt: RELEASED_AT,
    manifest,
    foods,
  }, null, 2)}\n`, 'utf8');
  writeFileSync(resolve(outputDir, 'iranian-foods.csv'), datasetCsv(foods), 'utf8');
  writeFileSync(resolve(outputDir, 'generic-analog-registry.csv'),
    analogRegistryCsv(new Map(stage5.foods.map((food) => [food.canonId, food])), resolutions),
    'utf8');
  writeFileSync(resolve(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  writeFileSync(resolve(outputDir, 'README.md'), [
    '# NeoFit Iranian App Dataset — Stage 6/10',
    '',
    '- Targets the 44 zero-sample and 25 one-sample Stage 5 fallback foods.',
    '- Uses exact macro-complete USDA/FNDDS generic record IDs from the bundled immutable catalog.',
    '- Generic analog medians are conservatively blended with Stage 5 values.',
    '- Analog records are never described as exact Iranian-food evidence.',
    '- Low confidence, user confirmation and non-promotable status remain enforced.',
    '- generic-analog-registry.csv preserves every query rule and selected source record.',
    '- Vision and LLM remain identity-only and never provide nutrition values.',
    '',
  ].join('\n'), 'utf8');

  return { foods, manifest, resolutions };
}

function outputDirectory(): string {
  const index = process.argv.indexOf('--output-dir');
  return resolve(
    index >= 0 && process.argv[index + 1]
      ? process.argv[index + 1]!
      : '../build/iranian-app-dataset-stage6',
  );
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  const result = buildIranianAppDatasetStage6(outputDirectory());
  console.log(JSON.stringify(result.manifest, null, 2));
}
