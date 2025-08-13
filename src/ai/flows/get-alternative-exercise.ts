
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
  exerciseName: z.string().describe('The name of the original exercise that needs an alternative.'),
  availableEquipment: z
    .string()
    .describe(
      'A comma-separated list of equipment available to the user. Example: dumbbells, resistance band'
    ),
  medicalLimitations: z.string().optional().describe('Any medical limitations the user has that might affect exercise choice, e.g., "previous knee injury".'),
  reasonForChange: z.enum(['no_equipment', 'causes_pain']).describe("The user's primary reason for needing an alternative."),
  geminiApiKey: z.string().optional().describe('Optional Gemini API key for the user.'),
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
        config: {
            apiKey: input.geminiApiKey,
        },
        prompt: `You are an expert fitness trainer specializing in creating safe and effective workout modifications. A user needs a personalized alternative for an exercise.

          **User's Context:**
          - **Original Exercise**: {{{exerciseName}}}
          - **Reason for Change**: {{{reasonForChange}}}
          - **Available Equipment**: {{{availableEquipment}}}
          - **User's Medical Limitations**: {{{medicalLimitations}}}

          **Your Task:**
          Suggest a safe and effective alternative exercise that targets the **same primary muscle group(s)** as the original exercise.

          **CRITICAL INSTRUCTIONS:**

          1.  **Analyze the Reason for Change**:
              *   If \`reasonForChange\` is **'no_equipment'**: Your primary goal is to find an alternative that **DOES NOT** require the equipment needed for the '{{{exerciseName}}}' but **CAN** be performed with the 'Available Equipment'. For example, if the original is 'Barbell Squat' and the user only has 'dumbbells, bodyweight', suggest 'Dumbbell Goblet Squat'.
              *   If \`reasonForChange\` is **'causes_pain'**: Your primary goal is **SAFETY**. Suggest a lower-impact, joint-friendly alternative. For example, if 'Running' causes knee pain, suggest 'Cycling' or 'Swimming'. If a user reports general pain for an exercise, avoid variations of that same movement pattern.
          
          2.  **Respect Medical Limitations**: Always consider the 'User's Medical Limitations'. If they mention a knee injury, avoid high-impact leg exercises, even if they have the equipment. If they mention shoulder pain, avoid heavy overhead presses.

          3.  **Provide a Justification**: In the 'reason' field, provide a concise explanation justifying *why* your suggestion is a good fit.
              *   For 'no_equipment': "This targets the same muscles as {{{exerciseName}}} but can be done with the equipment you have."
              *   For 'causes_pain': "This is a lower-impact alternative that works the same muscles but puts less stress on your joints."

          Return a single, valid JSON object with the 'alternativeExercise' and 'reason'.
          `,
      });

      const {output} = await prompt(input);
      return output!;
    }
  );
  return getAlternativeExerciseFlow(input);
}
