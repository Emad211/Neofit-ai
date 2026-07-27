import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { IRANIAN_FOOD_SEED } from '../src/data/iranian-food-seed';
import { normalizePersianText } from '../src/nutrition-core/search';
import type { FoodCatalogItem } from '../src/domain/models';

interface CanonRow {
  readonly canon_id: string;
  readonly name_fa: string;
  readonly name_en: string;
  readonly aliases_fa: string;
  readonly category: string;
  readonly region: string;
  readonly canon_status: string;
  readonly priority: string;
}

interface CategoryPrior {
  readonly category: FoodCatalogItem['category'];
  readonly sampleCount: number;
  readonly calories: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly variabilityPct: number;
}

const SOURCE_LABEL = 'IFKB DS0 broad-fallback category prior v1 — not recipe-specific';
const UPDATED_AT = '2026-07-27T00:00:00.000Z';
const CATEGORY_MAP: Readonly<Record<string, FoodCatalogItem['category']>> = {
  stew: 'stew',
  seafood_stew: 'stew',
  abgoosht: 'soup',
  egg_dish: 'breakfast',
  fried_main: 'street_food',
  stuffed_main: 'street_food',
  roast: 'street_food',
  meat_main: 'street_food',
  vegetable_main: 'street_food',
  offal_main: 'street_food',
  dessert_main: 'dessert',
  rice: 'rice',
  grain_dish: 'rice',
  kebab: 'kebab',
  soup: 'soup',
  cold_soup: 'soup',
  porridge: 'soup',
  kuku: 'street_food',
  koofteh: 'street_food',
  meatball: 'street_food',
  dolmeh: 'street_food',
  side: 'street_food',
  salad: 'street_food',
  pickle: 'street_food',
  condiment: 'street_food',
  fried_snack: 'street_food',
  cold_dish: 'street_food',
  bread: 'bread',
  dessert: 'dessert',
  beverage: 'dairy_beverage',
};
const VARIABILITY: Readonly<Record<FoodCatalogItem['category'], number>> = {
  stew: 50,
  rice: 45,
  kebab: 45,
  soup: 55,
  breakfast: 50,
  street_food: 60,
  bread: 35,
  dessert: 60,
  dairy_beverage: 50,
  ingredient: 40,
  custom: 60,
};
const PORTIONS: Readonly<Record<FoodCatalogItem['category'], readonly [string, string]>> = {
  stew: ['یک پرس بدون برنج', '1 serving without rice'],
  rice: ['یک پرس', '1 serving'],
  kebab: ['یک پرس', '1 serving'],
  soup: ['یک کاسه', '1 bowl'],
  breakfast: ['یک پرس', '1 serving'],
  street_food: ['یک سهم', '1 serving'],
  bread: ['یک تکه متوسط', '1 medium piece'],
  dessert: ['یک سهم', '1 serving'],
  dairy_beverage: ['یک لیوان یا کاسه', '1 glass or bowl'],
  ingredient: ['یک سهم', '1 serving'],
  custom: ['یک سهم', '1 serving'],
};

function argument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value) throw new Error(`Missing required argument ${name}`);
  return value;
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < content.length; index += 1) {
    const character = content[index] ?? '';
    if (quoted) {
      if (character === '"' && content[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(cell);
      cell = '';
    } else if (character === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows;
}

function readCanon(path: string): CanonRow[] {
  const rows = parseCsv(readFileSync(path, 'utf8'));
  const headers = rows.shift();
  if (!headers) throw new Error('Iranian canon CSV is empty.');
  const index = new Map(headers.map((header, position) => [header, position]));
  const value = (row: readonly string[], key: keyof CanonRow) => row[index.get(key) ?? -1] ?? '';
  return rows
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row) => ({
      canon_id: value(row, 'canon_id'),
      name_fa: value(row, 'name_fa'),
      name_en: value(row, 'name_en'),
      aliases_fa: value(row, 'aliases_fa'),
      category: value(row, 'category'),
      region: value(row, 'region'),
      canon_status: value(row, 'canon_status'),
      priority: value(row, 'priority'),
    }));
}

function median(values: readonly number[]): number {
  if (values.length === 0) throw new Error('Cannot calculate an empty median.');
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle] ?? 0
    : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

function rounded(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function categoryPrior(category: FoodCatalogItem['category']): CategoryPrior {
  const samples = IRANIAN_FOOD_SEED.filter((item) => item.category === category);
  if (samples.length === 0) throw new Error(`No existing seed samples for category ${category}`);
  return {
    category,
    sampleCount: samples.length,
    calories: Math.round(median(samples.map((item) => item.calories)) / 5) * 5,
    proteinG: rounded(median(samples.map((item) => item.proteinG))),
    carbsG: rounded(median(samples.map((item) => item.carbsG))),
    fatG: rounded(median(samples.map((item) => item.fatG))),
    variabilityPct: VARIABILITY[category],
  };
}

function aliases(row: CanonRow): string[] {
  return row.aliases_fa.split('|').map((value) => value.trim()).filter(Boolean);
}

function existingNames(): Set<string> {
  const values = new Set<string>();
  for (const item of IRANIAN_FOOD_SEED) {
    for (const name of [item.nameFa, ...item.aliasesFa]) {
      const normalized = normalizePersianText(name);
      if (normalized) values.add(normalized);
    }
  }
  return values;
}

function mapCategory(source: string): FoodCatalogItem['category'] {
  return CATEGORY_MAP[source] ?? 'street_food';
}

const canonPath = argument('--canon');
const outputPath = argument('--output');
const manifestPath = argument('--manifest');
const canon = readCanon(canonPath);
if (canon.length !== 261) throw new Error(`Expected 261 Iranian canon rows, found ${canon.length}`);
const names = existingNames();
const priorCache = new Map<FoodCatalogItem['category'], CategoryPrior>();
const prior = (category: FoodCatalogItem['category']) => {
  const existing = priorCache.get(category);
  if (existing) return existing;
  const created = categoryPrior(category);
  priorCache.set(category, created);
  return created;
};

const fallback = canon.flatMap((row): FoodCatalogItem[] => {
  const rowNames = [row.name_fa, ...aliases(row)].map(normalizePersianText).filter(Boolean);
  if (rowNames.some((name) => names.has(name))) return [];
  const category = mapCategory(row.category);
  const values = prior(category);
  const [portionLabelFa, portionLabelEn] = PORTIONS[category];
  return [{
    id: `iranian-fallback-${row.canon_id.toLowerCase()}`,
    nameFa: row.name_fa,
    nameEn: row.name_en,
    aliasesFa: aliases(row),
    aliasesEn: [],
    category,
    portionLabelFa,
    portionLabelEn,
    portionGrams: null,
    calories: values.calories,
    proteinG: values.proteinG,
    carbsG: values.carbsG,
    fatG: values.fatG,
    variabilityPct: values.variabilityPct,
    confidence: 'low',
    sourceType: 'imported',
    sourceLabel: SOURCE_LABEL,
    notesFa: `این مقدار فقط prior پهن دستهٔ «${category}» است؛ دستور، روغن و سهم واقعی باید تأیید شود و این رکورد منبع تأییدشده نیست.`,
    notesEn: `This is only a broad ${category} category prior. Recipe, oil and actual serving must be confirmed; this is not verified evidence.`,
    updatedAt: UPDATED_AT,
  }];
});

const total = IRANIAN_FOOD_SEED.length + fallback.length;
if (total !== 261) {
  throw new Error(`Existing (${IRANIAN_FOOD_SEED.length}) + fallback (${fallback.length}) must equal 261; found ${total}`);
}
const generated = `/* AUTO-GENERATED by scripts/generate-iranian-fallback-seed.ts. */\n`
  + `import { FoodCatalogItemSchema, type FoodCatalogItem } from '@/domain/models';\n\n`
  + `const rows = ${JSON.stringify(fallback, null, 2)} as const;\n\n`
  + `export const IRANIAN_FALLBACK_SEED: FoodCatalogItem[] = rows.map((row) => FoodCatalogItemSchema.parse(row));\n`
  + `export const IRANIAN_FALLBACK_PROFILE_COUNT = ${fallback.length};\n`;
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, generated, 'utf8');

const manifest = {
  format: 'ifkb-iranian-fallback-profile-release',
  version: '1.0.0',
  generatedAtUtc: new Date().toISOString(),
  existingSeedCount: IRANIAN_FOOD_SEED.length,
  broadFallbackCount: fallback.length,
  totalAppReadyCount: total,
  evidenceTier: 'broad_fallback',
  sourceLabel: SOURCE_LABEL,
  priorCategories: Object.fromEntries([...priorCache.entries()].sort().map(([key, value]) => [key, value])),
  categoryMapping: CATEGORY_MAP,
  rules: {
    portionGrams: null,
    confidence: 'low',
    variabilityRangePct: [35, 60],
    verifiedRecordsCreated: 0,
  },
};
mkdirSync(dirname(manifestPath), { recursive: true });
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  existingSeedCount: IRANIAN_FOOD_SEED.length,
  broadFallbackCount: fallback.length,
  totalAppReadyCount: total,
  categories: [...priorCache.keys()].sort(),
}));
