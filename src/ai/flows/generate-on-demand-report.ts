
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

// NEW: Define an intermediate schema for the AI prompt, which now directly receives the data
const ReportPromptInputSchema = z.object({
    userData: z.any().describe("A JSON object containing all of the user's data for the week: profile and logs."),
    geminiApiKey: z.string().optional(),
});


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
    async (flowInput) => {

      // STEP 1: Programmatically fetch the user data. This is now a guaranteed step.
      const userData = await getUserDataForWeeklyReview({ userId: flowInput.userId });

      // STEP 2: Define a prompt that expects the data directly.
      const onDemandReportPrompt = ai.definePrompt({
        name: 'onDemandReportPrompt',
        // Note: The prompt no longer needs tools, as data fetching is done outside.
        input: {schema: ReportPromptInputSchema},
        output: {schema: GenerateOnDemandReportOutputSchema},
        model: 'googleai/gemini-1.5-flash',
        config: {
          apiKey: flowInput.geminiApiKey,
        },
        prompt: `You are the friendly AI coach for the NeoFit application. You have been provided with a data dump of the user's progress for the current week. Your job is to provide an encouraging, on-demand summary.

        USER DATA:
        {{{json userData}}}

        **TASK**:
        - Based *only* on the provided data, write an insightful and motivational summary for the user.
        - Analyze their adherence to their plans based on the logs available. If there are few logs, that's okay, just report on what you see.
        - Highlight any progress you can see (e.g., weight changes, workouts logged).
        - Keep the tone positive and conversational. This is a check-in, not a final weekly judgment.
        - If there are no logs at all, write a friendly message encouraging the user to start logging their activities and meals to see their progress.
        - IMPORTANT: Do NOT mention creating new plans for next week. This report is only about progress so far.

        Return ONLY the 'analysisReport' text.
        `,
      });
      
      // STEP 3: Call the prompt with the fetched user data.
      const {output} = await onDemandReportPrompt({ userData, geminiApiKey: flowInput.geminiApiKey });
      
      if (!output) {
        throw new Error("The AI failed to generate a report based on the provided data.");
      }

      return output;
    }
  );
  return generateOnDemandReportFlow(input);
}
