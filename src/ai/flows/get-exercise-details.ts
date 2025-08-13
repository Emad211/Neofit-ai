
'use server';

/**
 * @fileOverview A flow to get detailed information for a specific exercise.
 *
 * - getExerciseDetails - A function that returns a description for an exercise.
 * - GetExerciseDetailsInput - The input type for the function.
 * - GetExerciseDetailsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetExerciseDetailsInputSchema = z.object({
  exerciseName: z.string().describe('The name of the exercise to look up.'),
  geminiApiKey: z.string().optional().describe('Optional Gemini API key for the user.'),
});
export type GetExerciseDetailsInput = z.infer<typeof GetExerciseDetailsInputSchema>;

const GetExerciseDetailsOutputSchema = z.object({
  description: z.string().describe('A detailed, step-by-step guide on how to perform the exercise correctly and safely. This should be formatted with clear paragraphs.'),
});
export type GetExerciseDetailsOutput = z.infer<typeof GetExerciseDetailsOutputSchema>;

export async function getExerciseDetails(input: GetExerciseDetailsInput): Promise<GetExerciseDetailsOutput> {
  const getExerciseDetailsFlow = ai.defineFlow(
    {
      name: 'getExerciseDetailsFlow',
      inputSchema: GetExerciseDetailsInputSchema,
      outputSchema: GetExerciseDetailsOutputSchema,
    },
    async (input) => {
      const prompt = ai.definePrompt({
        name: 'getExerciseDetailsPrompt',
        input: {schema: GetExerciseDetailsInputSchema},
        output: {schema: GetExerciseDetailsOutputSchema},
        model: 'googleai/gemini-1.5-flash',
        config: {
            apiKey: input.geminiApiKey,
        },
        prompt: `You are an expert Strength and Conditioning Coach. Your task is to provide a detailed guide for a given exercise.

        Exercise Name: {{{exerciseName}}}

        **YOUR TASK:**
        **Write a Detailed Description**:
            *   Provide a clear, step-by-step guide on how to perform the exercise.
            *   Start with the initial setup (e.g., "Stand with your feet shoulder-width apart...").
            *   Describe the execution of the movement in detail.
            *   Include key tips for maintaining proper form and avoiding common mistakes.
            *   Mention the primary muscles targeted by the exercise.
            *   The tone should be encouraging and informative. Use paragraphs for readability.

        Return a single, valid JSON object with the 'description'.
        `,
      });

      const {output} = await prompt(input);
      return output!;
    }
  );

  return getExerciseDetailsFlow(input);
}
