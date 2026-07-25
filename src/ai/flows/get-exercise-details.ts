'use client';

import { callAi } from '@/lib/ai-client';
import {
  GetExerciseDetailsInput,
  GetExerciseDetailsOutput,
  GetExerciseDetailsInputSchema,
  GetExerciseDetailsOutputSchema,
} from '@/ai/schemas';

export type { GetExerciseDetailsInput, GetExerciseDetailsOutput };
export { GetExerciseDetailsInputSchema, GetExerciseDetailsOutputSchema };

export async function getExerciseDetails(
  input: GetExerciseDetailsInput,
): Promise<GetExerciseDetailsOutput> {
  const validatedInput = GetExerciseDetailsInputSchema.parse(input);
  return callAi<GetExerciseDetailsOutput>('getExerciseDetails', validatedInput);
}
