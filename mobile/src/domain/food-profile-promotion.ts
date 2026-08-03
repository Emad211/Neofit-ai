import { z } from 'zod';
import { FoodCatalogItemSchema } from '@/domain/models';

export const PROMOTABLE_FOOD_EVIDENCE_TIERS = [
  'verified_source',
  'digital_consensus',
] as const;

export const PromotableFoodEvidenceTierSchema = z.enum(PROMOTABLE_FOOD_EVIDENCE_TIERS);
export type PromotableFoodEvidenceTier = z.infer<typeof PromotableFoodEvidenceTierSchema>;

const PromotedFoodProfileSchema = FoodCatalogItemSchema.omit({
  sourceType: true,
  sourceLabel: true,
  updatedAt: true,
}).superRefine((food, context) => {
  if (food.portionGrams === null) {
    context.addIssue({
      code: 'custom',
      path: ['portionGrams'],
      message: 'A promoted food profile requires a defensible serving weight.',
    });
  }
  if (food.confidence === 'low') {
    context.addIssue({
      code: 'custom',
      path: ['confidence'],
      message: 'A promoted food profile cannot remain low confidence.',
    });
  }
});

const PromotionRecordSchema = z.object({
  sourceRecordId: z.string().trim().min(1).max(300),
  food: PromotedFoodProfileSchema,
}).strict();

export const FoodProfilePromotionBundleSchema = z.object({
  format: z.literal('neofit-food-profile-promotion'),
  schemaVersion: z.literal(1),
  source: z.object({
    label: z.string().trim().min(2).max(300),
    version: z.string().trim().min(1).max(120),
    evidenceTier: PromotableFoodEvidenceTierSchema,
  }).strict(),
  records: z.array(PromotionRecordSchema).min(1).max(10_000),
}).strict().superRefine((bundle, context) => {
  const foodIds = new Set<string>();
  for (let index = 0; index < bundle.records.length; index += 1) {
    const record = bundle.records[index]!;
    if (foodIds.has(record.food.id)) {
      context.addIssue({
        code: 'custom',
        path: ['records', index, 'food', 'id'],
        message: `Duplicate promoted food id: ${record.food.id}`,
      });
    }
    foodIds.add(record.food.id);
  }
  if (/\bDS0\b|broad[ -]?fallback/i.test(bundle.source.label)) {
    context.addIssue({
      code: 'custom',
      path: ['source', 'label'],
      message: 'A broad fallback source cannot be used as promoted evidence.',
    });
  }
});

export type FoodProfilePromotionBundle = z.infer<typeof FoodProfilePromotionBundleSchema>;

export function parseFoodProfilePromotionJson(text: string): FoodProfilePromotionBundle {
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    throw new Error('Food profile promotion bundle is not valid JSON.');
  }
  const parsed = FoodProfilePromotionBundleSchema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.length ? issue.path.join('.') : 'bundle';
    throw new Error(`Invalid food profile promotion at ${path}: ${issue?.message ?? 'validation failed'}`);
  }
  return parsed.data;
}
