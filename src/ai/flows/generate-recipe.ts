'use client';

import { callAi } from '@/lib/ai-client';
import {
  GenerateRecipeInput,
  GenerateRecipeOutput,
  GenerateRecipeInputSchema,
  GenerateRecipeOutputSchema,
} from '@/ai/schemas';

export type { GenerateRecipeInput, GenerateRecipeOutput };
export { GenerateRecipeInputSchema, GenerateRecipeOutputSchema };

export async function generateRecipe(input: GenerateRecipeInput): Promise<GenerateRecipeOutput> {
  const { userId: _ignoredUserId, ...validatedInput } = GenerateRecipeInputSchema.parse(input);
  return callAi<GenerateRecipeOutput>('generateRecipe', validatedInput);
}
