'use client';

import { callAi } from '@/lib/ai-client';
import {
  GetAlternativeExerciseInput,
  GetAlternativeExerciseOutput,
  GetAlternativeExerciseInputSchema,
  GetAlternativeExerciseOutputSchema,
} from '@/ai/schemas';

export type { GetAlternativeExerciseInput, GetAlternativeExerciseOutput };
export { GetAlternativeExerciseInputSchema, GetAlternativeExerciseOutputSchema };

export async function getAlternativeExercise(
  input: GetAlternativeExerciseInput,
): Promise<GetAlternativeExerciseOutput> {
  const { userId: _ignoredUserId, ...validatedInput } = GetAlternativeExerciseInputSchema.parse(input);
  return callAi<GetAlternativeExerciseOutput>('getAlternativeExercise', validatedInput);
}
