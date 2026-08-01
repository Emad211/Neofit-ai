import { requestStructured } from '@/services/avalai-client';
import {
  FoodIdentityInterpretationSchema,
  type FoodIdentityInterpretation,
} from '@/services/food-language-contract';
import type { VisionFoodCandidate } from '@/services/vision-food-contract';

export {
  FoodIdentityInterpretationSchema,
  buildCatalogQueries,
  type FoodIdentityInterpretation,
} from '@/services/food-language-contract';

export async function interpretFoodIdentityWithLlm(input: {
  description: string;
  locale: 'fa' | 'en';
  visionCandidates?: readonly VisionFoodCandidate[];
  visionWarnings?: readonly string[];
}): Promise<FoodIdentityInterpretation> {
  const description = input.description.trim();
  const visionCandidates = (input.visionCandidates ?? []).slice(0, 5).map((candidate) => ({
    label: candidate.label,
    confidence: candidate.confidence,
    visibleComponents: candidate.visibleComponents,
    preparationHints: candidate.preparationHints,
  }));
  if (!description && visionCandidates.length === 0) {
    throw new Error('Food identity interpretation requires text or Vision candidates.');
  }

  const response = await requestStructured({
    kind: 'interpret_food_identity',
    schema: FoodIdentityInterpretationSchema,
    locale: input.locale,
    temperature: 0,
    maxTokens: 900,
    system: [
      'You are a semantic food-name interpreter for a local nutrition catalog.',
      'Your only job is to turn user wording and optional Vision observations into conventional searchable food names.',
      'Never provide or estimate calories, nutrients, grams, serving weights, medical effects, diet advice, recipes, or hidden ingredients.',
      'Do not treat Vision labels as ground truth. Prefer the user text when it is explicit and compatible with visible evidence.',
      'For mixed plates or close alternatives, require user confirmation instead of pretending certainty.',
    ].join(' '),
    prompt: `Interpret the food identity and return JSON only.

User description:
${JSON.stringify(description)}

Vision candidates:
${JSON.stringify(visionCandidates)}

Vision warnings:
${JSON.stringify(input.visionWarnings ?? [])}

Return:
{
  "primaryQuery": "one conventional food name suitable for catalog search",
  "alternateQueries": ["up to five genuine alternative names or spellings"],
  "explicitAmountText": "copy an amount phrase only when explicitly present in user text, otherwise null",
  "confidence": 0.0,
  "needsUserConfirmation": true,
  "clarificationQuestion": "one short question when identity is ambiguous, otherwise null",
  "warnings": ["identity limitations only"]
}

Rules:
- Never create an amount that the user did not state.
- Never output nutrition fields or numeric nutrition claims.
- Do not merge visibly separate plate components into a made-up dish.
- Use Persian conventional names first when locale is fa.
- Keep queries short; they are search terms, not explanations.
- Set needsUserConfirmation=true for mixed plates, conflicting text/Vision, low confidence, or close food variants.`,
  });

  return response.data;
}
