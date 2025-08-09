
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
  medicalLimitations: z.string().optional().describe('Any medical limitations the user has that might affect exercise choice, e.g., "previous knee injury".'),
});
export type GetAlternativeExerciseInput = z.infer<typeof GetAlternativeExerciseInputSchema>;

const GetAlternativeExerciseOutputSchema = z.object({
  alternativeExercise: z.string().describe('A suggested alternative exercise.'),
  reason: z.string().describe('The reason why this exercise is a suitable alternative, considering the user\'s context.'),
});
export type GetAlternativeExerciseOutput = z.infer<typeof GetAlternativeExerciseOutputSchema>;


export async function getAlternativeExercise(
  input: GetAlternativeExerciseInput
): Promise<GetAlternativeExerciseOutput> {
  const getAlternativeExerciseFlow = ai.defineFlow(
    {
      name: 'getAlternativeExerciseFlow',
      inputSchema: GetAlternativeExerciseInputSchema,
      outputSchema: GetAlternativeExerciseOutputSchema,
    },
    async (input) => {
      const prompt = ai.definePrompt({
        name: 'getAlternativeExercisePrompt',
        input: {schema: GetAlternativeExerciseInputSchema},
        output: {schema: GetAlternativeExerciseOutputSchema},
        model: 'googleai/gemini-1.5-flash',
        prompt: `You are an expert fitness trainer specializing in creating safe and effective workout modifications. A user is unable to perform their current exercise and needs a personalized alternative.

  Analyze the user's context carefully:
  - **Original Exercise**: {{{exerciseId}}}
  - **Available Equipment**: {{{availableEquipment}}}
  - **Medical Limitations**: {{{medicalLimitations}}}

  Your task is to suggest a safe and effective alternative exercise that targets the **same primary muscle group(s)** as the original exercise.

  **Crucially, your suggestion MUST be:**
  1.  **Feasible** with the user's available equipment.
  2.  **Safe** considering their stated medical limitations. If they mention a knee injury, avoid high-impact leg exercises. If they mention shoulder pain, avoid heavy overhead presses.

  Provide a concise explanation in the 'reason' field, justifying why your suggestion is a good fit for their specific situation (equipment and limitations).
  `,
      });

      const {output} = await prompt(input);
      return output!;
    }
  );
  return getAlternativeExerciseFlow(input);
}
