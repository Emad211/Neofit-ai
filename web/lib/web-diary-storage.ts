import {
  NUTRIENT_KEYS,
  type NutritionEstimate,
  type NutritionRange,
  type NutritionVector,
} from '@neofit/nutrition-core';
import {
  mealTypeLabelFa,
  webMacrosFromEstimate,
  type WebDiaryEntry,
} from '@/lib/nutrition-adapter';

const STORAGE_SCHEMA_VERSION = 1;
const MAX_STORED_ENTRIES = 1_000;
const MAX_TEXT_LENGTH = 240;

interface StoredDiaryEnvelope {
  readonly version: typeof STORAGE_SCHEMA_VERSION;
  readonly diary: readonly WebDiaryEntry[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function safeText(value: unknown, maxLength = MAX_TEXT_LENGTH): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized && normalized.length <= maxLength ? normalized : null;
}

function parseNutritionVector(value: unknown): NutritionVector | null {
  if (!isRecord(value)) return null;
  const parsed: Partial<Record<(typeof NUTRIENT_KEYS)[number], number>> = {};

  for (const key of NUTRIENT_KEYS) {
    const nutrient = value[key];
    if (nutrient === undefined) continue;
    if (!finiteNonNegative(nutrient)) return null;
    parsed[key] = nutrient;
  }

  return parsed;
}

function parseNutritionRange(value: unknown): NutritionRange | undefined | null {
  if (value === undefined) return undefined;
  if (!isRecord(value)) return null;
  const p10 = parseNutritionVector(value.p10);
  const p50 = parseNutritionVector(value.p50);
  const p90 = parseNutritionVector(value.p90);
  if (!p10 || !p50 || !p90) return null;
  return { p10, p50, p90 };
}

function parseEstimate(value: unknown): NutritionEstimate | null {
  if (!isRecord(value)) return null;
  const grams = value.grams === null
    ? null
    : finiteNonNegative(value.grams)
      ? value.grams
      : undefined;
  if (grams === undefined) return null;

  const center = parseNutritionVector(value.center);
  if (!center) return null;
  const range = parseNutritionRange(value.range);
  if (range === null) return null;
  return range ? { grams, center, range } : { grams, center };
}

function parseIsoTimestamp(value: unknown): string | null {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return null;
  return value;
}

function parseEntry(value: unknown): WebDiaryEntry | null {
  if (!isRecord(value) || !isRecord(value.core)) return null;
  const core = value.core;
  const id = safeText(core.id, 200);
  const localDate = typeof core.localDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(core.localDate)
    ? core.localDate
    : null;
  const mealType = core.mealType;
  const sourceType = core.sourceType;
  const label = safeText(core.label, 160);
  const sourceId = safeText(core.sourceId, 200);
  const estimate = parseEstimate(core.estimate);
  const createdAt = parseIsoTimestamp(core.createdAt);
  const updatedAt = parseIsoTimestamp(core.updatedAt);
  const portionText = safeText(value.portionText, 160);

  if (
    !id ||
    !localDate ||
    !label ||
    !sourceId ||
    !estimate ||
    !createdAt ||
    !updatedAt ||
    !portionText ||
    !['breakfast', 'lunch', 'dinner', 'snack'].includes(String(mealType)) ||
    !['food', 'recipe', 'custom'].includes(String(sourceType))
  ) {
    return null;
  }

  const normalizedMealType = mealType as WebDiaryEntry['core']['mealType'];
  let macros: ReturnType<typeof webMacrosFromEstimate>;
  try {
    macros = webMacrosFromEstimate(estimate);
  } catch {
    return null;
  }

  return {
    core: {
      id,
      localDate,
      mealType: normalizedMealType,
      label,
      sourceType: sourceType as WebDiaryEntry['core']['sourceType'],
      sourceId,
      estimate,
      createdAt,
      updatedAt,
    },
    mealLabelFa: mealTypeLabelFa(normalizedMealType),
    portionText,
    macros,
  };
}

function parseEntries(value: unknown): WebDiaryEntry[] | null {
  if (!Array.isArray(value) || value.length > MAX_STORED_ENTRIES) return null;
  const parsed: WebDiaryEntry[] = [];
  for (const entry of value) {
    const valid = parseEntry(entry);
    if (!valid) return null;
    parsed.push(valid);
  }
  return parsed;
}

export function parseStoredWebDiary(serialized: string): WebDiaryEntry[] | null {
  try {
    const value: unknown = JSON.parse(serialized);
    if (Array.isArray(value)) return parseEntries(value); // Legacy v1 array.
    if (!isRecord(value) || value.version !== STORAGE_SCHEMA_VERSION) return null;
    return parseEntries(value.diary);
  } catch {
    return null;
  }
}

export function serializeStoredWebDiary(
  diary: readonly WebDiaryEntry[],
): string {
  const envelope: StoredDiaryEnvelope = {
    version: STORAGE_SCHEMA_VERSION,
    diary,
  };
  return JSON.stringify(envelope);
}
