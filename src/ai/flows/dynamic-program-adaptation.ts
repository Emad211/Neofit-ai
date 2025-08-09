
'use server';
/**
 * @fileOverview This file defines the Genkit flow for dynamically adapting a user's program.
 * It orchestrates other tools to first analyze weekly data and then generate a new plan.
 *
 * - dynamicProgramAdaptation - The main orchestration flow.
 * - DynamicProgramAdaptationInput - The input type for the flow.
 * - DynamicProgramAdaptationOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getUserDataForWeeklyReview } from '../tools/get-user-data';
import { saveWeeklyReport } from '../tools/save-weekly-report';
import { generateWorkoutProgram } from './generate-workout-program';
import { generateNutritionProgram } from './generate-nutrition-program';


// Define the input schema for the main flow
export const DynamicProgramAdaptationInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom the analysis and adaptation is being generated.'),
});
export type DynamicProgramAdaptationInput = z.infer<typeof DynamicProgramAdaptationInputSchema>;

// Define the final output schema for the main flow
export const DynamicProgramAdaptationOutputSchema = z.object({
  analysisReport: z.string().describe("A comprehensive, encouraging, and human-readable summary of the user's weekly progress, adherence, and achievements."),
  nextWeekWorkoutPlanSummary: z.string().describe("A summary of the new workout plan for the upcoming week."),
  nextWeekNutritionPlanSummary: z.string().describe("A summary of the new nutrition plan for the upcoming week."),
});
export type DynamicProgramAdaptationOutput = z.infer<typeof DynamicProgramAdaptationOutputSchema>;


/**
 * The Orchestrator Prompt
 * This prompt uses multiple tools in a chain to perform a complex, multi-step process.
 */
const dynamicAdaptationPrompt = ai.definePrompt({
  name: 'dynamicAdaptationPrompt',
  tools: [getUserDataForWeeklyReview, saveWeeklyReport, generateWorkoutProgram, generateNutritionProgram],
  input: {schema: DynamicProgramAdaptationInputSchema},
  output: {schema: DynamicProgramAdaptationOutputSchema},
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are the master AI coach for the NeoFit application. Your primary job is to conduct a thorough, data-driven weekly review for the user and then create their plans for the upcoming week.

  Follow these steps with precision for User ID: {{{userId}}}

  **Step 1: Comprehensive Data Analysis**
  - Call the 'getUserDataForWeeklyReview' tool to get a complete picture of the user's situation. This includes their core profile, all historical weekly reports, and all of their activity, meal, and weight logs from the last 7 days.

  **Step 2: Generate the User-Facing Weekly Report**
  - Based on ALL the data from Step 1, write a comprehensive, insightful, and encouraging report for the user.
  - Analyze their adherence to workout and nutrition plans.
  - Highlight progress (e.g., weight change, increased workout volume).
  - Acknowledge any logged feedback (e.g., replaced exercises, disliked meals).
  - Keep the tone positive and motivational.

  **Step 3: Create a Structured JSON Analysis for AI Specialists**
  - Synthesize your findings into a structured JSON object. This will be the 'history' parameter for the specialist AIs. It should summarize adherence, progress, and key feedback points clearly.
  
  **Step 4: Save the Report**
  - Call the 'saveWeeklyReport' tool. Pass the 'userId' and the beautiful, human-readable 'analysisReport' you just wrote in Step 2. This creates a permanent record.

  **Step 5: Generate Next Week's Plans**
  - Now, act as the orchestrator for the specialists.
  - Call the 'generateWorkoutProgram' flow. For the 'history' parameter, pass the structured JSON analysis you created in Step 3.
  - Call the 'generateNutritionProgram' flow. For the 'history' parameter, pass the same structured JSON analysis.
  
  **Step 6: Final Output**
  - Consolidate the results into the final output format.
  - The 'analysisReport' should be the full text from Step 2.
  - The 'nextWeekWorkoutPlanSummary' and 'nextWeekNutritionPlanSummary' should be the summaries from the newly generated plans in Step 5.
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
    // This prompt now handles the entire orchestration logic.
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
