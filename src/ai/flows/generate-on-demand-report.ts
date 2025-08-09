
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
        prompt: `You are the friendly and encouraging AI coach for the NeoFit application. Your task is to write a short, motivational on-demand progress report for the user based *only* on the data provided for the current week.

        **USER PROFILE:**
        - Name: {{{userData.userProfile.name}}}
        - Goal: {{{userData.userProfile.goal}}}

        **LOGGED DATA FOR THIS WEEK:**
        - Meal Logs: {{{json userData.mealLogs}}}
        - Activity Logs: {{{json userData.activityLogs}}}
        - Weight Logs: {{{json userData.weightLogs}}}
        - Workout Logs: {{{json userData.workoutLogs}}}

        **YOUR TASK:**
        1.  Start with a friendly greeting, using the user's name.
        2.  Analyze the provided logs for the **current week**.
        3.  **If there are logs**, praise the user for their effort. Specifically mention one or two logged items to show you've seen their data (e.g., "I see you logged a run for 20 minutes" or "That chicken salad you logged sounds delicious!").
        4.  **If there are NO logs in one or more categories**, gently encourage the user to start logging in those areas to get a better picture of their progress. For example, "I don't see any weight logs yet this week, remember to weigh in to track your progress!".
        5.  **If ALL log arrays are empty**, write a friendly and motivational message encouraging the user to start logging their meals, activities, and weight to get started on their journey.
        6.  Keep the tone positive, encouraging, and conversational.
        7.  **IMPORTANT RESTRICTION**: Do NOT mention creating new plans or that the "official weekly plan will be updated". This is only an on-demand, mid-week check-in. Just focus on the data provided for this week.

        Generate the 'analysisReport' based on these instructions.
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
