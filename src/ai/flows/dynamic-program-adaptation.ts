'use server';
/**
 * @fileOverview This file defines the Genkit flow for dynamically adapting a user's program.
 * It orchestrates other tools to first analyze weekly data and then generate a new plan.
 *
 * - dynamicProgramAdaptationFlow - The main orchestration flow.
 * - DynamicProgramAdaptationInput - The input type for the flow.
 * - DynamicProgramAdaptationOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

// Define the input schema for the main flow
const DynamicProgramAdaptationInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom the analysis and adaptation is being generated.'),
});
export type DynamicProgramAdaptationInput = z.infer<typeof DynamicProgramAdaptationInputSchema>;

// Define the final output schema for the main flow
const DynamicProgramAdaptationOutputSchema = z.object({
  analysisReport: z.string().describe("A summary of the user's weekly progress."),
  adaptationSuggestions: z.object({
    calorieAdjustment: z.string().optional(),
    cardioAdjustment: z.string().optional(),
    muscleGroupAdjustment: z.string().optional(),
  }),
  nextWeekWorkoutPlan: z.string().describe("A summary of the new workout plan for the upcoming week."),
  nextWeekNutritionPlan: z.string().describe("A summary of the new nutrition plan for the upcoming week."),
});
export type DynamicProgramAdaptationOutput = z.infer<typeof DynamicProgramAdaptationOutputSchema>;


/**
 * Tool 1: Analyzes user data and provides suggestions.
 * In a real app, this would query a database. Here we simulate it.
 */
const getWeeklyAnalysis = ai.defineTool(
  {
    name: 'getWeeklyAnalysis',
    description: 'Analyzes user workout, nutrition, and weight logs from the past week to identify trends and provide adaptation suggestions.',
    inputSchema: z.object({ userId: z.string() }),
    outputSchema: z.object({
      analysisReport: z.string().describe('A plain language report summarizing progress and relevant factors.'),
      adaptationSuggestions: z.object({
        calorieAdjustment: z.string().optional().describe('Suggested adjustment to daily calorie intake.'),
        cardioAdjustment: z.string().optional().describe('Suggested adjustment to cardio exercise.'),
        muscleGroupAdjustment: z.string().optional().describe('Suggested adjustment to muscle group focus.'),
      }),
    }),
  },
  async ({ userId }) => {
    console.log(`Analyzing data for user: ${userId}`);
    // Mock data simulates a good week of progress.
    return {
      analysisReport: "Excellent consistency this week, Sara! You nailed every workout and your weight is trending downwards perfectly. Let's keep this momentum going!",
      adaptationSuggestions: {
        calorieAdjustment: "Maintain your current calorie target. It's working perfectly.",
        cardioAdjustment: 'Consider adding 10 minutes of light walking after your strength sessions to improve recovery.',
      },
    };
  }
);


/**
 * Tool 2: Generates a new program based on adaptation suggestions.
 * In a real app, this would generate a detailed plan. Here we simulate it.
 */
const generateAdaptedProgram = ai.defineTool(
    {
        name: 'generateAdaptedProgram',
        description: 'Generates a new, adapted workout and nutrition plan for the upcoming week based on specific adaptation suggestions.',
        inputSchema: z.object({
            userId: z.string(),
            suggestions: z.object({
                calorieAdjustment: z.string().optional(),
                cardioAdjustment: z.string().optional(),
                muscleGroupAdjustment: z.string().optional(),
            }),
        }),
        outputSchema: z.object({
            nextWeekWorkoutPlan: z.string().describe("Summary of the new workout plan."),
            nextWeekNutritionPlan: z.string().describe("Summary of the new nutrition plan."),
        }),
    },
    async ({ userId, suggestions }) => {
        console.log(`Generating new plan for user ${userId} with suggestions:`, suggestions);
        // Mock response based on suggestions
        const workoutPlan = `The workout plan for next week maintains the current structure but incorporates an additional 10-minute cool-down walk after each strength session as you suggested.`;
        const nutritionPlan = `The nutrition plan for next week keeps the calorie target stable. We will continue to focus on high-protein meals to support recovery.`;
        return {
            nextWeekWorkoutPlan: workoutPlan,
            nextWeekNutritionPlan: nutritionPlan,
        };
    }
);


/**
 * The Orchestrator Prompt
 * This prompt uses the defined tools to perform a multi-step process.
 */
const dynamicAdaptationPrompt = ai.definePrompt({
  name: 'dynamicAdaptationPrompt',
  tools: [getWeeklyAnalysis, generateAdaptedProgram],
  input: {schema: DynamicProgramAdaptationInputSchema},
  output: {schema: DynamicProgramAdaptationOutputSchema},
  prompt: `You are the master AI coach for the NeoFit application. Your job is to orchestrate a weekly review for the user.
  
  Follow these steps precisely:
  1.  Call the 'getWeeklyAnalysis' tool to get a data-driven analysis of the user's past week.
  2.  Review the 'adaptationSuggestions' from the analysis.
  3.  Call the 'generateAdaptedProgram' tool, passing the user's ID and the exact suggestions you received.
  4.  Finally, consolidate all the information from both tool calls into the final JSON output format. Ensure every field in the output schema is populated.

  Start the process for User ID: {{{userId}}}
  `,
});


/**
 * The main flow that orchestrates the entire process.
 */
export const dynamicProgramAdaptationFlow = ai.defineFlow(
  {
    name: 'dynamicProgramAdaptationFlow',
    inputSchema: DynamicProgramAdaptationInputSchema,
    outputSchema: DynamicProgramAdaptationOutputSchema,
  },
  async (input) => {
    const {output} = await dynamicAdaptationPrompt(input);
    return output!;
  }
);

/**
 * Wrapper function to be called from the frontend.
 */
export async function dynamicProgramAdaptation(input: DynamicProgramAdaptationInput): Promise<DynamicProgramAdaptationOutput> {
  return dynamicProgramAdaptationFlow(input);
}
