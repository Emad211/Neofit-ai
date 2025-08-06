'use server';

/**
 * @fileOverview An AI flow to calculate the calories burned during a physical activity.
 *
 * - calculateActivityCalories - A function that estimates calories burned.
 * - CalculateActivityCaloriesInput - The input type for the function.
 * - CalculateActivityCaloriesOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateActivityCaloriesInputSchema = z.object({
  activityType: z.string().describe('The type of physical activity performed (e.g., Running, Weightlifting, Yoga).'),
  durationMinutes: z.number().describe('The duration of the activity in minutes.'),
  weightKg: z.number().describe('The weight of the user in kilograms.'),
  age: z.number().describe('The age of the user in years.'),
});
export type CalculateActivityCaloriesInput = z.infer<typeof CalculateActivityCaloriesInputSchema>;

const CalculateActivityCaloriesOutputSchema = z.object({
  caloriesBurned: z.number().int().describe('The estimated number of calories burned during the activity.'),
});
export type CalculateActivityCaloriesOutput = z.infer<typeof CalculateActivityCaloriesOutputSchema>;

export async function calculateActivityCalories(input: CalculateActivityCaloriesInput): Promise<CalculateActivityCaloriesOutput> {
  return calculateActivityCaloriesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculateActivityCaloriesPrompt',
  input: {schema: CalculateActivityCaloriesInputSchema},
  output: {schema: CalculateActivityCaloriesOutputSchema},
  prompt: `You are an expert exercise physiologist. Your task is to accurately estimate the number of calories a person has burned during a specific physical activity.

Use the user's data and the activity details to perform the calculation. Consider the MET (Metabolic Equivalent of Task) value for the given activity.

User Information:
- Weight: {{{weightKg}}} kg
- Age: {{{age}}} years

Activity Information:
- Type: {{{activityType}}}
- Duration: {{{durationMinutes}}} minutes

Based on this information, calculate the total calories burned. Return the result as an integer in the 'caloriesBurned' field. Do not include any other text or explanation in your response.
`,
});

const calculateActivityCaloriesFlow = ai.defineFlow(
  {
    name: 'calculateActivityCaloriesFlow',
    inputSchema: CalculateActivityCaloriesInputSchema,
    outputSchema: CalculateActivityCaloriesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
