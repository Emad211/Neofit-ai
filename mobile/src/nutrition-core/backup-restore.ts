import { z } from 'zod';
import { IFKB_CATALOG_RELEASE } from './catalog-release';

export const MAX_NUTRITION_BACKUP_BYTES = 20_000_000;
export const MAX_NUTRITION_BACKUP_FAVORITES = 100;

const IsoTimestampSchema = z.string().datetime();
const LocalDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const NonNegativeFiniteSchema = z.number().finite().nonnegative();
const PositiveFiniteSchema = z.number().finite().positive();

const NutritionVectorSchema = z.object({
  energyKcal: NonNegativeFiniteSchema.optional(),
  proteinG: NonNegativeFiniteSchema.optional(),
  carbsG: NonNegativeFiniteSchema.optional(),
  fatG: NonNegativeFiniteSchema.optional(),
  fiberG: NonNegativeFiniteSchema.optional(),
  sugarsG: NonNegativeFiniteSchema.optional(),
  sodiumMg: NonNegativeFiniteSchema.optional(),
  cholesterolMg: NonNegativeFiniteSchema.optional(),
  calciumMg: NonNegativeFiniteSchema.optional(),
  ironMg: NonNegativeFiniteSchema.optional(),
  potassiumMg: NonNegativeFiniteSchema.optional(),
  vitaminCMg: NonNegativeFiniteSchema.optional(),
}).strict();

const NutritionRangeSchema = z.object({
  p10: NutritionVectorSchema,
  p50: NutritionVectorSchema,
  p90: NutritionVectorSchema,
}).strict();

const DiaryEntrySchema = z.object({
  id: z.string().trim().min(1).max(240),
  localDate: LocalDateSchema,
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  label: z.string().trim().min(1).max(500),
  sourceType: z.enum(['food', 'recipe', 'custom']),
  sourceId: z.string().trim().min(1).max(500),
  estimate: z.object({
    grams: NonNegativeFiniteSchema.nullable(),
    center: NutritionVectorSchema,
    range: NutritionRangeSchema.optional(),
  }).strict(),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
}).strict();

const RecipeIngredientSchema = z.object({
  id: z.string().trim().min(1).max(240),
  sourceType: z.enum(['food', 'custom', 'recipe']),
  sourceId: z.string().trim().min(1).max(500),
  grams: NonNegativeFiniteSchema.nullable(),
  basisMultiplier: PositiveFiniteSchema.nullable(),
  consumedFraction: z.number().finite().min(0).max(1),
  sortOrder: z.number().int().min(0).max(100_000),
}).strict().superRefine((value, context) => {
  if (value.grams === null && value.basisMultiplier === null) {
    context.addIssue({
      code: 'custom',
      message: 'Recipe ingredient requires grams or basisMultiplier.',
    });
  }
});

const RecipeSchema = z.object({
  id: z.string().trim().min(1).max(240),
  name: z.string().trim().min(1).max(500),
  servingCount: PositiveFiniteSchema,
  cookedYieldGrams: PositiveFiniteSchema.nullable(),
  ingredients: z.array(RecipeIngredientSchema).min(1).max(2_000),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
}).strict();

const NutritionGoalSchema = z.object({
  id: z.string().trim().min(1).max(240),
  activeFrom: LocalDateSchema,
  goals: z.object({ daily: NutritionVectorSchema }).strict(),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
}).strict();

export const NutritionBackupFavoriteSchema = z.object({
  id: z.string().trim().min(1).max(500),
  labelFa: z.string().trim().min(1).max(500),
  labelEn: z.string().trim().min(1).max(500),
  query: z.string().trim().min(1).max(500),
  savedAt: IsoTimestampSchema,
}).strict();

const CatalogReferenceSchema = z.object({
  format: z.literal('ifkb-mobile-catalog-release'),
  version: z.string().min(1),
  databaseSha256: z.string().regex(/^[0-9a-f]{64}$/i),
}).passthrough();

export const NutritionBackupSchema = z.object({
  format: z.literal('neofit-nutrition-backup'),
  schemaVersion: z.literal(1),
  exportedAt: IsoTimestampSchema,
  publicCatalogReference: CatalogReferenceSchema,
  personalData: z.object({
    diaryEntries: z.array(DiaryEntrySchema).max(50_000),
    recipes: z.array(RecipeSchema).max(1_000),
    goals: z.array(NutritionGoalSchema).max(10_000),
    favorites: z.array(NutritionBackupFavoriteSchema).max(MAX_NUTRITION_BACKUP_FAVORITES),
  }).strict(),
  exclusions: z.array(z.string().max(1_000)).max(20),
}).strict();

export type ParsedNutritionBackup = z.infer<typeof NutritionBackupSchema>;
export type NutritionBackupFavorite = z.infer<typeof NutritionBackupFavoriteSchema>;
export type NutritionBackupRecipe = z.infer<typeof RecipeSchema>;
export type NutritionBackupRestoreMode = 'merge' | 'replace';

function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined) continue;
    bytes += codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4;
  }
  return bytes;
}

function assertUnique(values: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Backup contains a duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

export function validateNutritionBackupCrossRecords(backup: ParsedNutritionBackup): void {
  assertUnique(backup.personalData.diaryEntries.map((item) => item.id), 'Diary id');
  assertUnique(backup.personalData.recipes.map((item) => item.id), 'Recipe id');
  assertUnique(backup.personalData.goals.map((item) => item.id), 'Goal id');
  assertUnique(backup.personalData.favorites.map((item) => item.id), 'Favorite id');
  assertUnique(
    backup.personalData.recipes.flatMap((recipe) => recipe.ingredients.map((ingredient) => ingredient.id)),
    'Recipe ingredient id',
  );
}

export function assertNutritionRecipeGraphAcyclic(
  recipes: readonly NutritionBackupRecipe[],
): void {
  const byId = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (recipeId: string): void => {
    if (visited.has(recipeId)) return;
    if (visiting.has(recipeId)) throw new Error(`Backup would create a recipe cycle at ${recipeId}.`);
    const recipe = byId.get(recipeId);
    if (!recipe) return;
    visiting.add(recipeId);
    for (const ingredient of recipe.ingredients) {
      if (ingredient.sourceType === 'recipe' && byId.has(ingredient.sourceId)) visit(ingredient.sourceId);
    }
    visiting.delete(recipeId);
    visited.add(recipeId);
  };

  for (const recipe of recipes) visit(recipe.id);
}

export function mergeNutritionBackupFavorites(
  current: readonly NutritionBackupFavorite[],
  incoming: readonly NutritionBackupFavorite[],
): NutritionBackupFavorite[] {
  const incomingIds = new Set(incoming.map((item) => item.id));
  return [...incoming, ...current.filter((item) => !incomingIds.has(item.id))]
    .sort((left, right) => right.savedAt.localeCompare(left.savedAt))
    .slice(0, MAX_NUTRITION_BACKUP_FAVORITES);
}

export function isNutritionBackupCatalogCompatible(backup: ParsedNutritionBackup): boolean {
  return backup.publicCatalogReference.version === IFKB_CATALOG_RELEASE.version
    && backup.publicCatalogReference.databaseSha256.toLowerCase() === IFKB_CATALOG_RELEASE.databaseSha256;
}

export function parseNutritionBackupJson(text: string): ParsedNutritionBackup {
  if (utf8ByteLength(text) > MAX_NUTRITION_BACKUP_BYTES) {
    throw new Error(`Nutrition backup exceeds ${Math.round(MAX_NUTRITION_BACKUP_BYTES / 1_000_000)} MB.`);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }
  const parsed = NutritionBackupSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.length ? issue.path.join('.') : 'backup';
    throw new Error(`Invalid nutrition backup at ${path}: ${issue?.message ?? 'validation failed'}`);
  }
  validateNutritionBackupCrossRecords(parsed.data);
  return parsed.data;
}
