import { IFKB_CATALOG_RELEASE } from './catalog-release';
import { NUTRIENT_KEYS } from './types';
import type { DiaryEntry, NutrientKey } from './types';

export interface NutritionBackupInput {
  readonly exportedAt: string;
  readonly diaryEntries: readonly DiaryEntry[];
  readonly recipes: readonly unknown[];
  readonly goals: readonly unknown[];
  readonly favorites: readonly unknown[];
}

export interface NutritionBackupBundle {
  readonly format: 'neofit-nutrition-backup';
  readonly schemaVersion: 1;
  readonly exportedAt: string;
  readonly publicCatalogReference: typeof IFKB_CATALOG_RELEASE;
  readonly personalData: {
    readonly diaryEntries: readonly DiaryEntry[];
    readonly recipes: readonly unknown[];
    readonly goals: readonly unknown[];
    readonly favorites: readonly unknown[];
  };
  readonly exclusions: readonly string[];
}

function assertIsoTimestamp(value: string): void {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) throw new Error('exportedAt must be a valid ISO timestamp');
}

export function buildNutritionBackup(input: NutritionBackupInput): NutritionBackupBundle {
  assertIsoTimestamp(input.exportedAt);
  return {
    format: 'neofit-nutrition-backup',
    schemaVersion: 1,
    exportedAt: input.exportedAt,
    publicCatalogReference: IFKB_CATALOG_RELEASE,
    personalData: {
      diaryEntries: input.diaryEntries,
      recipes: input.recipes,
      goals: input.goals,
      favorites: input.favorites,
    },
    exclusions: [
      'The public IFKB SQLite catalog is not duplicated in this personal backup.',
      'API keys, Vision images, cache files, and provider responses are not exported.',
    ],
  };
}

export function stringifyNutritionBackup(input: NutritionBackupInput): string {
  return `${JSON.stringify(buildNutritionBackup(input), null, 2)}\n`;
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

function nutrientCell(entry: DiaryEntry, nutrient: NutrientKey): string {
  const value = entry.estimate.center[nutrient];
  return value === undefined || !Number.isFinite(value) ? '' : String(value);
}

export function diaryEntriesToCsv(entries: readonly DiaryEntry[]): string {
  const headers = [
    'id',
    'localDate',
    'mealType',
    'label',
    'sourceType',
    'sourceId',
    'grams',
    ...NUTRIENT_KEYS,
    'createdAt',
    'updatedAt',
  ];
  const rows = entries.map((entry) => [
    entry.id,
    entry.localDate,
    entry.mealType,
    entry.label,
    entry.sourceType,
    entry.sourceId,
    entry.estimate.grams,
    ...NUTRIENT_KEYS.map((nutrient) => nutrientCell(entry, nutrient)),
    entry.createdAt,
    entry.updatedAt,
  ]);
  return `${[headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}
