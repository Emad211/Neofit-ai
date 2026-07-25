'use client';

import { callAi } from '@/lib/ai-client';
import {
  GenerateNutritionProgramInput,
  GenerateNutritionProgramOutput,
  GenerateNutritionProgramInputSchema,
  GenerateNutritionProgramOutputSchema,
} from '@/ai/schemas';

export type { GenerateNutritionProgramInput, GenerateNutritionProgramOutput };
export { GenerateNutritionProgramInputSchema, GenerateNutritionProgramOutputSchema };

export async function generateNutritionProgram(
  input: GenerateNutritionProgramInput,
): Promise<GenerateNutritionProgramOutput> {
  const { userId: _ignoredUserId, ...validatedInput } = GenerateNutritionProgramInputSchema.parse(input);
  return callAi<GenerateNutritionProgramOutput>('generateNutritionProgram', validatedInput);
}
