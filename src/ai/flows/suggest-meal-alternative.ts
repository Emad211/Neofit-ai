
// src/ai/flows/suggest-meal-alternative.ts
'use server';

/**
 * @fileOverview Suggests alternative meals based on dietary restrictions, available ingredients, and time constraints.
 *
 * - suggestMealAlternative - A function that handles the meal alternative suggestion process.
 * - SuggestMealAlternativeInput - The input type for the suggestMealAlternative function.
 * - SuggestMealAlternativeOutput - The return type for the suggestMealAlternative function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMealAlternativeInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  mealId: z.string().describe('The ID of the meal to be replaced.'),
  context: z
    .string()
    .describe(
      'Contextual information, including dietary restrictions, available ingredients, and time constraints.'
    ),
});
export type SuggestMealAlternativeInput = z.infer<
  typeof SuggestMealAlternativeInputSchema
>;

const SuggestMealAlternativeOutputSchema = z.object({
  alternativeMeal: z
    .string()
    .describe('A suggested alternative meal based on the provided context.'),
});
export type SuggestMealAlternativeOutput = z.infer<
  typeof SuggestMealAlternativeOutputSchema
>;

const suggestMealAlternativeFlow = ai.defineFlow(
  {
    name: 'suggestMealAlternativeFlow',
    inputSchema: SuggestMealAlternativeInputSchema,
    outputSchema: SuggestMealAlternativeOutputSchema,
  },
  async (input) => {
    const prompt = ai.definePrompt({
      name: 'suggestMealAlternativePrompt',
      input: {schema: SuggestMealAlternativeInputSchema},
      output: {schema: SuggestMealAlternativeOutputSchema},
      model: 'googleai/gemini-1.5-flash',
      prompt: `You are a nutrition expert. A user is looking for an alternative meal suggestion.

      Original Meal ID: {{{mealId}}}
      Context: {{{context}}}

      Suggest an alternative meal, taking into account any dietary restrictions, available ingredients, and time constraints provided in the context.
      Return ONLY the suggested meal; do not include any additional text or explanation.`,
    });
    
    const {output} = await prompt(input);
    return output!;
  }
);


export async function suggestMealAlternative(
  input: SuggestMealAlternativeInput
): Promise<SuggestMealAlternativeOutput> {
  return suggestMealAlternativeFlow(input);
}
