'use server';
/**
 * @fileOverview This file defines the Genkit flow for generating a weekly analysis of user progress and suggesting adaptations to their workout and nutrition plans.
 *
 * - generateWeeklyAnalysisAndAdaptation - A function that orchestrates the weekly analysis and adaptation process.
 * - GenerateWeeklyAnalysisAndAdaptationInput - The input type for the generateWeeklyAnalysisAndAdaptation function.
 * - GenerateWeeklyAnalysisAndAdaptationOutput - The return type for the generateWeeklyAnalysisAndAdaptation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const GenerateWeeklyAnalysisAndAdaptationInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom the analysis is being generated.'),
});
export type GenerateWeeklyAnalysisAndAdaptationInput = z.infer<typeof GenerateWeeklyAnalysisAndAdaptationInputSchema>;

// Define the output schema
const GenerateWeeklyAnalysisAndAdaptationOutputSchema = z.object({
  analysisReport: z.string().describe('A plain language summary of the user\'s weekly progress, including feedback on progress, sleep, etc.'),
  adaptationSuggestions: z.object({
    calorieAdjustment: z.string().optional().describe('Suggested adjustment to daily calorie intake.'),
    cardioAdjustment: z.string().optional().describe('Suggested adjustment to cardio exercise frequency or intensity.'),
    muscleGroupAdjustment: z.string().optional().describe('Suggested adjustment to muscle group focus in workouts.'),
  }).describe('Suggestions for adapting the user\'s nutrition and workout plans.'),
});
export type GenerateWeeklyAnalysisAndAdaptationOutput = z.infer<typeof GenerateWeeklyAnalysisAndAdaptationOutputSchema>;

// Define the tool for analyzing progress
const progressAnalyzerAgent = ai.defineTool({
  name: 'progressAnalyzerAgent',
  description: 'Analyzes user workout, nutrition, weight, and sleep logs from the past week to identify trends and provide feedback.',
  inputSchema: z.object({
    userId: z.string().describe('The ID of the user.'),
  }),
  outputSchema: z.object({
    trendAnalysis: z.string().describe('An analysis of trends (weight decrease, strength increase, program adherence).'),
    textReport: z.string().describe('A plain language report summarizing progress, sleep, and other relevant factors.'),
    adaptationSuggestions: z.object({
      calorieAdjustment: z.string().optional().describe('Suggested adjustment to daily calorie intake.'),
      cardioAdjustment: z.string().optional().describe('Suggested adjustment to cardio exercise frequency or intensity.'),
      muscleGroupAdjustment: z.string().optional().describe('Suggested adjustment to muscle group focus in workouts.'),
    }).describe('Specific, actionable suggestions for adapting the user\'s nutrition and workout plans to optimize results.'),
  }),
  async (input) => {
    // TODO: Implement the progress analysis logic here.  This is a placeholder.
    //  In a real application, this would involve querying the database for user data,
    //  analyzing the data, and generating a report and adaptation suggestions.
    return {
      trendAnalysis: 'No significant trends identified this week.',
      textReport: 'Keep up the good work!  Maintain your current workout and nutrition plan.',
      adaptationSuggestions: {},
    };
  },
});

// Define the prompt for generating the weekly analysis and adaptation
const weeklyAnalysisPrompt = ai.definePrompt({
  name: 'weeklyAnalysisPrompt',
  tools: [progressAnalyzerAgent],
  input: {schema: GenerateWeeklyAnalysisAndAdaptationInputSchema},
  output: {schema: GenerateWeeklyAnalysisAndAdaptationOutputSchema},
  prompt: `Analyze the user's progress over the past week and provide a plain language summary of their performance, along with suggestions for adapting their nutrition and workout plans.

  Use the progressAnalyzerAgent tool to analyze the user's data and generate adaptation suggestions.

  User ID: {{{userId}}}
  `,
});

// Define the Genkit flow
const generateWeeklyAnalysisAndAdaptationFlow = ai.defineFlow(
  {
    name: 'generateWeeklyAnalysisAndAdaptationFlow',
    inputSchema: GenerateWeeklyAnalysisAndAdaptationInputSchema,
    outputSchema: GenerateWeeklyAnalysisAndAdaptationOutputSchema,
  },
  async (input) => {
    const {output} = await weeklyAnalysisPrompt(input);
    return output!;
  }
);

/**
 * Generates a weekly analysis of user progress and suggests adaptations to their workout and nutrition plans.
 * @param input - The input containing the user ID.
 * @returns The analysis report and adaptation suggestions.
 */
export async function generateWeeklyAnalysisAndAdaptation(input: GenerateWeeklyAnalysisAndAdaptationInput): Promise<GenerateWeeklyAnalysisAndAdaptationOutput> {
  return generateWeeklyAnalysisAndAdaptationFlow(input);
}

export type { GenerateWeeklyAnalysisAndAdaptationFlow };
