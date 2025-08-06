'use server';

/**
 * @fileOverview Analyzes user performance and suggests weekly workout plan adaptations.
 *
 * - generateWeeklyAnalysisAndAdaptation - Analyzes user data and suggests adaptations.
 * - AdaptationSuggestions - The output type for the generateWeeklyAnalysisAndAdaptation function.
 * - GenerateWeeklyAnalysisAndAdaptationInput - The input type for the generateWeeklyAnalysisAndAdaptation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWeeklyAnalysisAndAdaptationInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  workoutLogs: z.array(z.any()).describe('Workout logs from the past week.'),
  nutritionLogs: z.array(z.any()).describe('Nutrition logs from the past week.'),
  weightData: z.array(z.number()).describe('Weight data from the past week.'),
  sleepData: z.array(z.number()).describe('Sleep data from the past week.'),
  userFeedback: z.string().describe('User feedback on the current program.'),
});
export type GenerateWeeklyAnalysisAndAdaptationInput = z.infer<
  typeof GenerateWeeklyAnalysisAndAdaptationInputSchema
>;

const AdaptationSuggestionsSchema = z.object({
  calorieAdjustment: z
    .string()
    .describe('Suggested adjustment to calorie intake.'),
  cardioAdjustment: z
    .string()
    .describe('Suggested adjustment to cardio exercise.'),
  muscleGroupAdjustment: z
    .string()
    .describe('Suggested adjustment to muscle group training.'),
  textReport: z.string().describe('Plain language summary of the analysis.'),
});
export type AdaptationSuggestions = z.infer<typeof AdaptationSuggestionsSchema>;

export async function generateWeeklyAnalysisAndAdaptation(
  input: GenerateWeeklyAnalysisAndAdaptationInput
): Promise<AdaptationSuggestions> {
  return generateWeeklyAnalysisAndAdaptationFlow(input);
}

const progressAnalyzerPrompt = ai.definePrompt({
  name: 'progressAnalyzerPrompt',
  input: {schema: GenerateWeeklyAnalysisAndAdaptationInputSchema},
  output: {schema: AdaptationSuggestionsSchema},
  prompt: `You are an AI fitness and nutrition coach. Analyze the user's data from the past week and suggest personalized adaptations to their workout plan.

  Consider the following data:
  Workout Logs: {{{workoutLogs}}}
  Nutrition Logs: {{{nutritionLogs}}}
  Weight Data: {{{weightData}}}
  Sleep Data: {{{sleepData}}}
  User Feedback: {{{userFeedback}}}

  Provide a plain language summary of your analysis in the textReport field.
  Suggest adjustments to calorie intake, cardio exercise, and muscle group training in the corresponding fields.
  Be specific and actionable in your suggestions.
`,
});

const generateWeeklyAnalysisAndAdaptationFlow = ai.defineFlow(
  {
    name: 'generateWeeklyAnalysisAndAdaptationFlow',
    inputSchema: GenerateWeeklyAnalysisAndAdaptationInputSchema,
    outputSchema: AdaptationSuggestionsSchema,
  },
  async input => {
    const {output} = await progressAnalyzerPrompt(input);
    return output!;
  }
);
