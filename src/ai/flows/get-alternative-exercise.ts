'use server';

/**
 * @fileOverview Suggests a safe and effective alternative exercise that targets the same muscle group,
 * considering equipment unavailability or physical limitations.
 *
 * - getAlternativeExercise - A function that handles the alternative exercise suggestion process.
 * - GetAlternativeExerciseInput - The input type for the getAlternativeExercise function.
 * - GetAlternativeExerciseOutput - The return type for the getAlternativeExercise function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetAlternativeExerciseInputSchema = z.object({
  userId: z.string().describe('The ID of the user requesting an alternative exercise.'),
  exerciseId: z.string().describe('The ID of the original exercise that needs an alternative.'),
  availableEquipment: z
    .string()
    .describe(
      'A comma-separated list of equipment available to the user. Example: dumbbells, resistance band'
    ),
  medicalLimitations: z.string().optional().describe('Any medical limitations the user has.'),
});
export type GetAlternativeExerciseInput = z.infer<typeof GetAlternativeExerciseInputSchema>;

const GetAlternativeExerciseOutputSchema = z.object({
  alternativeExercise: z.string().describe('A suggested alternative exercise.'),
  reason: z.string().describe('The reason why this exercise is a suitable alternative.'),
});
export type GetAlternativeExerciseOutput = z.infer<typeof GetAlternativeExerciseOutputSchema>;

export async function getAlternativeExercise(
  input: GetAlternativeExerciseInput
): Promise<GetAlternativeExerciseOutput> {
  return getAlternativeExerciseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getAlternativeExercisePrompt',
  input: {schema: GetAlternativeExerciseInputSchema},
  output: {schema: GetAlternativeExerciseOutputSchema},
  prompt: `You are an expert fitness trainer. A user is unable to perform their current exercise and has requested an alternative.

  The user has the following equipment available: {{{availableEquipment}}}

  Original Exercise ID: {{{exerciseId}}}

  The user has the following medical limitations (if any): {{{medicalLimitations}}}

  Suggest a safe and effective alternative exercise that targets the same muscle group, considering the available equipment and any medical limitations.
  Explain why this exercise is a suitable alternative. Return the alternativeExercise and reason in the proper JSON format.
  `,
});

const getAlternativeExerciseFlow = ai.defineFlow(
  {
    name: 'getAlternativeExerciseFlow',
    inputSchema: GetAlternativeExerciseInputSchema,
    outputSchema: GetAlternativeExerciseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
