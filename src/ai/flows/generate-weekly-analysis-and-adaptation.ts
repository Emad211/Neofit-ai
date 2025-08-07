'use server';
/**
 * @fileOverview This file defines the Genkit flow for generating a weekly analysis of user progress and suggesting adaptations to their workout and nutrition plans.
 *
 * - generateWeeklyAnalysisAndAdaptation - A function that orchestrates the weekly analysis and adaptation process.
 * - GenerateWeeklyAnalysisAndAdaptationInput - The input type for the generateWeeklyAnalysisAndAdaptation function.
 * - GenerateWeeklyAnalysisAndAdaptationOutput - The return type for the generateWeeklyAnalysisAndAdaptation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Define the input schema
const GenerateWeeklyAnalysisAndAdaptationInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom the analysis is being generated.'),
});
export type GenerateWeeklyAnalysisAndAdaptationInput = z.infer<typeof GenerateWeeklyAnalysisAndAdaptationInputSchema>;

// Define the output schema
const GenerateWeeklyAnalysisAndAdaptationOutputSchema = z.object({
  analysisReport: z.string().describe('A plain language summary of the user\'s weekly progress, including feedback on progress, sleep, etc. Should be encouraging and personalized.'),
  adaptationSuggestions: z.object({
    calorieAdjustment: z.string().optional().describe('Suggested adjustment to daily calorie intake. E.g., "Slightly increase daily calories by 100-150 kcal to fuel muscle growth."'),
    cardioAdjustment: z.string().optional().describe('Suggested adjustment to cardio exercise frequency or intensity. E.g., "Add one 20-minute light cardio session for better recovery."'),
    muscleGroupAdjustment: z.string().optional().describe('Suggested adjustment to muscle group focus in workouts. E.g., "Increase focus on shoulder exercises to break plateaus."'),
  }).describe('Specific, actionable suggestions for adapting the user\'s nutrition and workout plans.'),
});
export type GenerateWeeklyAnalysisAndAdaptationOutput = z.infer<typeof GenerateWeeklyAnalysisAndAdaptationOutputSchema>;


// This tool simulates fetching and analyzing user data from a database.
const progressAnalyzerAgent = ai.defineTool(
  {
    name: 'progressAnalyzerAgent',
    description:
      'Analyzes user workout, nutrition, weight, and sleep logs from the past week to identify trends and provide a summary report and adaptation suggestions.',
    inputSchema: z.object({
      userId: z.string().describe('The ID of the user.'),
    }),
    outputSchema: z.object({
      analysisReport: z
        .string()
        .describe(
          'A plain language report summarizing progress, sleep, and other relevant factors. Example: "Great work on staying consistent this week! You hit all your workouts and your weight is trending down nicely. I see your sleep was a bit inconsistent, which we should watch."'
        ),
      adaptationSuggestions: z
        .object({
          calorieAdjustment: z
            .string()
            .optional()
            .describe('Suggested adjustment to daily calorie intake.'),
          cardioAdjustment: z
            .string()
            .optional()
            .describe(
              'Suggested adjustment to cardio exercise frequency or intensity.'
            ),
          muscleGroupAdjustment: z
            .string()
            .optional()
            .describe(
              'Suggested adjustment to muscle group focus in workouts.'
            ),
        })
        .describe(
          'Specific, actionable suggestions for adapting the user\'s nutrition and workout plans to optimize results.'
        ),
    }),
  },
  async ({ userId }) => {
    // In a real application, this would query a database for the user's logs.
    // For now, we return mock data that simulates a good week of progress.
    console.log(`Analyzing data for user: ${userId}`);
    return {
      analysisReport:
        'Excellent consistency this week, Sara! You nailed every workout and your weight is trending downwards perfectly. Your strength on the bench press has increased. Let\'s keep this momentum going!',
      adaptationSuggestions: {
        calorieAdjustment: "Maintain your current calorie target. It's working perfectly for your weight loss goal.",
        cardioAdjustment: 'Consider adding 10 minutes of light walking after your strength sessions to improve recovery.',
      },
    };
  }
);


const weeklyAnalysisPrompt = ai.definePrompt({
  name: 'weeklyAnalysisPrompt',
  tools: [progressAnalyzerAgent],
  input: {schema: GenerateWeeklyAnalysisAndAdaptationInputSchema},
  output: {schema: GenerateWeeklyAnalysisAndAdaptationOutputSchema},
  prompt: `You are the Progress Analyzer Agent. Your role is to provide a clear, encouraging, and actionable weekly report for the user.
  
  1. First, call the 'progressAnalyzerAgent' tool to get a data-driven analysis of the user's past week.
  2. Then, use the output from the tool to populate the 'analysisReport' and 'adaptationSuggestions' fields in the final output.
  
  Do not make up any data. Base your entire response on the information provided by the tool.

  Analyze the progress for User ID: {{{userId}}}
  `,
});


const generateWeeklyAnalysisAndAdaptationFlow = ai.defineFlow(
  {
    name: 'generateWeeklyAnalysisAndAdaptationFlow',
    inputSchema: GenerateWeeklyAnalysisAndAdaptationInputSchema,
    outputSchema: GenerateWeeklyAnalysisAndAdaptationOutputSchema,
  },
  async (input) => {
    const {output} = await weeklyAnalysisPrompt(input);
    
    // In a real scenario, these suggestions would be used to automatically
    // update the user's plan for the following week.
    
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
