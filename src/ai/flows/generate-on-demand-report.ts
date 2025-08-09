
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating an on-demand
 * progress report for a user, based on their data so far in the current week.
 *
 * - generateOnDemandReport - The main flow function.
 * - GenerateOnDemandReportInput - The input type for the flow.
 * - GenerateOnDemandReportOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getUserDataForWeeklyReview } from '../tools/get-user-data';

// Define the input schema for the flow
const GenerateOnDemandReportInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom the report is being generated.'),
  geminiApiKey: z.string().optional().describe('Optional Gemini API key for the user.'),
});
export type GenerateOnDemandReportInput = z.infer<typeof GenerateOnDemandReportInputSchema>;

// Define the final output schema for the flow
const GenerateOnDemandReportOutputSchema = z.object({
  analysisReport: z.string().describe("A comprehensive, encouraging, and human-readable summary of the user's progress so far this week."),
});
export type GenerateOnDemandReportOutput = z.infer<typeof GenerateOnDemandReportOutputSchema>;

/**
 * Wrapper function to be called from the frontend.
 */
export async function generateOnDemandReport(input: GenerateOnDemandReportInput): Promise<GenerateOnDemandReportOutput> {
  const generateOnDemandReportFlow = ai.defineFlow(
    {
      name: 'generateOnDemandReportFlow',
      inputSchema: GenerateOnDemandReportInputSchema,
      outputSchema: GenerateOnDemandReportOutputSchema,
    },
    async (input) => {
      /**
       * The Orchestrator Prompt
       * This prompt uses a tool to get user data and then generates a report.
       */
      const onDemandReportPrompt = ai.definePrompt({
        name: 'onDemandReportPrompt',
        tools: [getUserDataForWeeklyReview],
        input: {schema: GenerateOnDemandReportInputSchema},
        output: {schema: GenerateOnDemandReportOutputSchema},
        model: 'googleai/gemini-1.5-flash',
        config: {
          apiKey: input.geminiApiKey,
          // Force the model to use the tool
          tool_config: { tool_choice: 'any' },
        },
        prompt: `You are the friendly AI coach for the NeoFit application. Your job is to provide an encouraging, on-demand summary of the user's progress so far in their current week.

        Follow these steps with precision for User ID: {{{userId}}}

        **Step 1: Get Current Data**
        - Call the 'getUserDataForWeeklyReview' tool. This will fetch the user's profile and all their activity, meal, and weight logs from the last 7 days.

        **Step 2: Generate the User-Facing Progress Report**
        - Based on the data from Step 1, write an insightful and motivational summary for the user.
        - Analyze their adherence to their plans based on the logs available. If there are few logs, that's okay, just report on what you see.
        - Highlight any progress you can see (e.g., weight changes, workouts logged).
        - Keep the tone positive and conversational. This is a check-in, not a final weekly judgment.
        - IMPORTANT: Do NOT mention creating new plans for next week. This report is only about progress so far.

        Return ONLY the 'analysisReport' text.
        `,
      });
      
      const {output} = await onDemandReportPrompt(input);
      return output!;
    }
  );
  return generateOnDemandReportFlow(input);
}
