'use client';

import { callAi } from '@/lib/ai-client';
import {
  CalculateActivityCaloriesInput,
  CalculateActivityCaloriesOutput,
  CalculateActivityCaloriesInputSchema,
  CalculateActivityCaloriesOutputSchema,
} from '@/ai/schemas';

export type { CalculateActivityCaloriesInput, CalculateActivityCaloriesOutput };
export { CalculateActivityCaloriesInputSchema, CalculateActivityCaloriesOutputSchema };

export async function calculateActivityCalories(
  input: CalculateActivityCaloriesInput,
): Promise<CalculateActivityCaloriesOutput> {
  const { userId: _ignoredUserId, ...validatedInput } = CalculateActivityCaloriesInputSchema.parse(input);
  return callAi<CalculateActivityCaloriesOutput>('calculateActivityCalories', validatedInput);
}
