
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
  userId: z.string().describe('The ID of the user performing the activity.'),
  activityType: z.string().describe('The type of physical activity performed (e.g., Running, Weightlifting, Yoga).'),
  durationMinutes: z.number().int().describe('The duration of the activity in minutes.'),
  intensity: z.enum(['low', 'medium', 'high']).describe('The subjective intensity level of the activity.'),
  userProfile: z.object({
      weightKg: z.number().describe('The weight of the user in kilograms.'),
      heightCm: z.number().int().describe('The height of the user in centimeters.'),
      age: z.number().int().describe('The age of the user in years.'),
      gender: z.enum(['male', 'female', 'other']).describe('The gender of the user.'),
  }),
  averageHeartRate: z.number().int().optional().describe('The user\'s average heart rate during the activity, if available. This provides a more accurate calculation.'),
  geminiApiKey: z.string().optional().describe('Optional Gemini API key for the user.'),
});
export type CalculateActivityCaloriesInput = z.infer<typeof CalculateActivityCaloriesInputSchema>;

const CalculateActivityCaloriesOutputSchema = z.object({
  caloriesBurned: z.number().int().describe('The estimated number of calories burned during the activity.'),
});
export type CalculateActivityCaloriesOutput = z.infer<typeof CalculateActivityCaloriesOutputSchema>;


export async function calculateActivityCalories(input: CalculateActivityCaloriesInput): Promise<CalculateActivityCaloriesOutput> {
  const calculateActivityCaloriesFlow = ai.defineFlow(
    {
      name: 'calculateActivityCaloriesFlow',
      inputSchema: CalculateActivityCaloriesInputSchema,
      outputSchema: CalculateActivityCaloriesOutputSchema,
    },
    async (input) => {
      const prompt = ai.definePrompt({
        name: 'calculateActivityCaloriesPrompt',
        input: {schema: CalculateActivityCaloriesInputSchema},
        output: {schema: CalculateActivityCaloriesOutputSchema},
        model: 'googleai/gemini-1.5-flash',
        config: {
            apiKey: input.geminiApiKey,
        },
        prompt: `You are an expert exercise physiologist. Your task is to accurately estimate the number of calories a person has burned during a specific physical activity.

  Use the user's detailed data and the activity information to perform a precise calculation. 

  USER PROFILE:
  - Weight: {{{userProfile.weightKg}}} kg
  - Height: {{{userProfile.heightCm}}} cm
  - Age: {{{userProfile.age}}} years
  - Gender: {{{userProfile.gender}}}

  ACTIVITY INFORMATION:
  - Type: {{{activityType}}}
  - Duration: {{{durationMinutes}}} minutes
  - Subjective Intensity: {{{intensity}}}
  {{#if averageHeartRate}}
  - Average Heart Rate: {{{averageHeartRate}}} bpm
  {{/if}}

  Based on this comprehensive information, calculate the total calories burned. 
  - Use the MET (Metabolic Equivalent of Task) value appropriate for the given activity AND its intensity.
  - If the average heart rate is provided, use it to refine your calculation, as it's a strong indicator of metabolic cost.
  - Consider the user's BMR (Basal Metabolic Rate) derived from their profile.

  Return the result as an integer in the 'caloriesBurned' field. Do not include any other text or explanation in your response.
  `,
      });

      const {output} = await prompt(input);
      return output!;
    }
  );

  return calculateActivityCaloriesFlow(input);
}
