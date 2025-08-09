
'use server';

/**
 * @fileOverview An AI flow to look up nutritional information for a given food item, either from text or a photo.
 *
 * - foodLookup - A function that returns nutritional data for a food query.
 * - FoodLookupInput - The input type for the function.
 * - FoodLookupOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FoodLookupInputSchema = z.object({
  userId: z.string().describe('The ID of the user performing the lookup.'),
  foodName: z.string().describe('The name of the food to look up (e.g., "1 large banana", "100g chicken breast"). This can be empty if a photo is provided.'),
  photoDataUri: z.string().optional().describe(
      "A photo of a food item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  geminiApiKey: z.string().optional().describe('Optional Gemini API key for the user.'),
});
export type FoodLookupInput = z.infer<typeof FoodLookupInputSchema>;

const FoodLookupOutputSchema = z.object({
    itemName: z.string().describe('The name of the food item that was looked up.'),
    servingSize: z.string().describe('The serving size for the nutritional information provided.'),
    calories: z.number().int().describe('The number of calories in the serving.'),
    protein: z.number().int().describe('The amount of protein in grams.'),
    carbohydrates: z.number().int().describe('The amount of carbohydrates in grams.'),
    fat: z.number().int().describe('The amount of fat in grams.'),
});
export type FoodLookupOutput = z.infer<typeof FoodLookupOutputSchema>;


export async function foodLookup(input: FoodLookupInput): Promise<FoodLookupOutput> {
  const foodLookupFlow = ai.defineFlow(
    {
      name: 'foodLookupFlow',
      inputSchema: FoodLookupInputSchema,
      outputSchema: FoodLookupOutputSchema,
    },
    async (input) => {
      const prompt = ai.definePrompt({
        name: 'foodLookupPrompt',
        input: {schema: FoodLookupInputSchema},
        output: {schema: FoodLookupOutputSchema},
        model: 'googleai/gemini-1.5-flash',
        config: {
            apiKey: input.geminiApiKey,
        },
        prompt: `You are a nutritional database expert. The user will provide either a food name, a photo of food, or both. 
        
      Your task is to provide accurate nutritional information for a standard serving of that food.
      - If a photo is provided, prioritize identifying the food in the photo.
      - If the user provides a quantity (e.g., "1 cup of milk", "100g of chicken"), use that. Otherwise, use a common single serving size.
      
      Food query: {{{foodName}}}
      {{#if photoDataUri}}
      Photo: {{media url=photoDataUri}}
      {{/if}}
      
      Return the item name, serving size, and nutritional information (calories, protein, carbohydrates, fat) as a JSON object. Ensure all nutritional values are integers.
      `,
      });
      
      const {output} = await prompt(input);
      return output!;
    }
  );

  return foodLookupFlow(input);
}
