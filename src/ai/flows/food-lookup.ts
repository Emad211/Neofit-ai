'use client';

import { callAi } from '@/lib/ai-client';
import {
  FoodLookupInput,
  FoodLookupOutput,
  FoodLookupInputSchema,
  FoodLookupOutputSchema,
} from '@/ai/schemas';

export type { FoodLookupInput, FoodLookupOutput };
export { FoodLookupInputSchema, FoodLookupOutputSchema };

export async function foodLookup(input: FoodLookupInput): Promise<FoodLookupOutput> {
  const { userId: _ignoredUserId, ...validatedInput } = FoodLookupInputSchema.parse(input);
  return callAi<FoodLookupOutput>('foodLookup', validatedInput);
}
