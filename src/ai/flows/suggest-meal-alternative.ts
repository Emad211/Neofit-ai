'use client';

import { callAi } from '@/lib/ai-client';
import {
  SuggestMealAlternativeInput,
  SuggestMealAlternativeOutput,
  SuggestMealAlternativeInputSchema,
  SuggestMealAlternativeOutputSchema,
} from '@/ai/schemas';

export type { SuggestMealAlternativeInput, SuggestMealAlternativeOutput };
export { SuggestMealAlternativeInputSchema, SuggestMealAlternativeOutputSchema };

export async function suggestMealAlternative(
  input: SuggestMealAlternativeInput,
): Promise<SuggestMealAlternativeOutput> {
  const { userId: _ignoredUserId, ...validatedInput } = SuggestMealAlternativeInputSchema.parse(input);
  return callAi<SuggestMealAlternativeOutput>('suggestMealAlternative', validatedInput);
}
