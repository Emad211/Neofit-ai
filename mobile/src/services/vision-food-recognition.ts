import { z } from 'zod';
import { getAvalAiSettings } from '@/services/ai-settings';
import { requestStructured } from '@/services/avalai-client';

export const VisionFoodCandidateSchema = z.object({
  label: z.string().trim().min(1).max(160),
  confidence: z.number().min(0).max(1).nullable().default(null),
  visibleComponents: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
  preparationHints: z.array(z.string().trim().min(1).max(120)).max(8).default([]),
});
export type VisionFoodCandidate = z.infer<typeof VisionFoodCandidateSchema>;

export const VisionFoodObservationSchema = z.object({
  candidates: z.array(VisionFoodCandidateSchema).min(0).max(5),
  warnings: z.array(z.string().trim().min(1).max(300)).max(10).default([]),
});
export type VisionFoodObservation = z.infer<typeof VisionFoodObservationSchema>;

export async function recognizeFoodFromPhoto(input: {
  imageDataUrl: string;
  description?: string;
  locale: 'fa' | 'en';
}): Promise<VisionFoodObservation> {
  const settings = await getAvalAiSettings();
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
  return response.data;
}
