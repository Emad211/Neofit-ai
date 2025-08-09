
'use server';

/**
 * @fileOverview A flow to generate a recipe for a meal.
 *
 * - generateRecipe - A function that generates cooking instructions for a meal.
 * - GenerateRecipeInput - The input type for the generateRecipe function.
 * - GenerateRecipeOutput - The return type for the generateRecipe function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRecipeInputSchema = z.object({
  userId: z.string().describe('The ID of the user requesting the recipe.'),
  mealName: z.string().describe('The name of the meal.'),
  ingredients: z.array(z.object({ name: z.string(), quantity: z.string(), category: z.string() })).describe('The list of ingredients for the meal.'),
  geminiApiKey: z.string().optional().describe('Optional Gemini API key for the user.'),
});
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeInputSchema>;

const GenerateRecipeOutputSchema = z.object({
  recipe: z.string().describe('The step-by-step cooking instructions for the meal.'),
});
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;


export async function generateRecipe(input: GenerateRecipeInput): Promise<GenerateRecipeOutput> {
  const generateRecipeFlow = ai.defineFlow(
    {
      name: 'generateRecipeFlow',
      inputSchema: GenerateRecipeInputSchema,
      outputSchema: GenerateRecipeOutputSchema,
    },
    async (input) => {
      const prompt = ai.definePrompt({
        name: 'generateRecipePrompt',
        input: {schema: GenerateRecipeInputSchema},
        output: {schema: GenerateRecipeOutputSchema},
        model: 'googleai/gemini-1.5-flash',
        config: {
            apiKey: input.geminiApiKey,
        },
        prompt: `You are an expert chef. Your task is to create a simple, clear, and delicious recipe based on the provided meal name and ingredients.

      Meal Name: {{{mealName}}}

      Ingredients:
      {{#each ingredients}}
      - {{name}} ({{quantity}})
      {{/each}}

      Please provide step-by-step cooking instructions. Format the recipe clearly with numbered steps. Be encouraging and make it sound easy to follow for a home cook.`,
      });

      const {output} = await prompt(input);
      return output!;
    }
  );

  return generateRecipeFlow(input);
}
