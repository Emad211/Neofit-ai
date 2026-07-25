'use client';

import { callAi } from '@/lib/ai-client';
import {
  GenerateWorkoutProgramInput,
  GenerateWorkoutProgramOutput,
  GenerateWorkoutProgramInputSchema,
  GenerateWorkoutProgramOutputSchema,
} from '@/ai/schemas';

export type { GenerateWorkoutProgramInput, GenerateWorkoutProgramOutput };
export { GenerateWorkoutProgramInputSchema, GenerateWorkoutProgramOutputSchema };

export async function generateWorkoutProgram(
  input: GenerateWorkoutProgramInput,
): Promise<GenerateWorkoutProgramOutput> {
  const { userId: _ignoredUserId, ...validatedInput } = GenerateWorkoutProgramInputSchema.parse(input);
  return callAi<GenerateWorkoutProgramOutput>('generateWorkoutProgram', validatedInput);
}
