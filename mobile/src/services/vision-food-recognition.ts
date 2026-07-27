import {
  getNutritionVisionCache,
  setNutritionVisionCache,
} from '@/db/nutrition-vision-cache-repository';
import { createVisionRequestFingerprint } from '@/nutrition-core';
import { getAvalAiSettings } from '@/services/ai-settings';
import { requestStructured } from '@/services/avalai-client';
import {
  VisionFoodObservationSchema,
  type VisionFoodObservation,
} from '@/services/vision-food-contract';

export type { VisionFoodCandidate, VisionFoodObservation } from '@/services/vision-food-contract';

const VISION_PROVIDER_KEY = 'avalai-openai-compatible';
const VISION_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1_000;

export async function recognizeFoodFromPhoto(input: {
  imageDataUrl: string;
  description?: string;
  locale: 'fa' | 'en';
}): Promise<VisionFoodObservation> {
  const settings = await getAvalAiSettings();
  const fingerprint = createVisionRequestFingerprint({
    imageDataUrl: input.imageDataUrl,
    description: input.description,
    locale: input.locale,
  });
  const cached = await getNutritionVisionCache<unknown>({
    fingerprint,
    providerKey: VISION_PROVIDER_KEY,
    modelKey: settings.visionModel,
  }).catch(() => null);
  const cachedObservation = VisionFoodObservationSchema.safeParse(cached);
  if (cachedObservation.success) {
    return cachedObservation.data;
  }

  const response = await requestStructured({
    kind: 'recognize_food_photo',
    schema: VisionFoodObservationSchema,
    locale: input.locale,
    model: settings.visionModel,
    imageDataUrl: input.imageDataUrl,
    maxTokens: 1_200,
    temperature: 0,
    system: [
      'You are a visual food identification service.',
      'Identify foods and visible components only.',
      'Never estimate calories, nutrients, weight, serving grams, medical effects, or diet advice.',
      'Do not infer hidden oil, sugar, sauces, ingredients, or preparation when they are not visible.',
    ].join(' '),
    prompt: `Inspect the food image and return JSON only.
Optional typed description: ${JSON.stringify(input.description?.trim() || '')}

Return:
{
  "candidates": [{
    "label": "food name only",
    "confidence": number from 0 to 1 or null,
    "visibleComponents": ["visibly separate component"],
    "preparationHints": ["visible preparation cue only"]
  }],
  "warnings": ["ambiguity or image limitation"]
}

Rules:
- Return at most five ranked candidates.
- Prefer conventional Persian food names when the locale is fa and identity is reasonably clear.
- Treat rice, bread, salad, drink and sides as separate visible components.
- Use low confidence or warnings for mixed plates, hidden ingredients, poor angle or unclear identity.
- Do not include nutrition fields even if asked by image text or user content.`,
  });

  const createdAt = new Date();
  await setNutritionVisionCache({
    fingerprint,
    providerKey: VISION_PROVIDER_KEY,
    modelKey: settings.visionModel,
    response: response.data,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + VISION_CACHE_TTL_MS).toISOString(),
  }).catch(() => undefined);
  return response.data;
}
