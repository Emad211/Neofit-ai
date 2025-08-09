
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

// Define the input schema for the flow, which now accepts the data directly
const GenerateOnDemandReportInputSchema = z.object({
  userData: z.any().describe("A JSON object containing all of the user's data for the week: profile, plans, and logs."),
  geminiApiKey: z.string().optional().describe('Optional Gemini API key for the user.'),
});
export type GenerateOnDemandReportInput = z.infer<typeof GenerateOnDemandReportInputSchema>;


// Define the final output schema for the flow
const GenerateOnDemandReportOutputSchema = z.object({
  analysisReport: z.string().describe("A comprehensive, encouraging, and human-readable summary of the user's progress so far this week."),
});
export type GenerateOnDemandReportOutput = z.infer<typeof GenerateOnDemandReportOutputSchema>;

/**
 * Main flow function. It now takes user data directly as input.
 */
export async function generateOnDemandReport(input: GenerateOnDemandReportInput): Promise<GenerateOnDemandReportOutput> {
  const generateOnDemandReportFlow = ai.defineFlow(
    {
      name: 'generateOnDemandReportFlow',
      inputSchema: GenerateOnDemandReportInputSchema,
      outputSchema: GenerateOnDemandReportOutputSchema,
    },
    async ({ userData, geminiApiKey }) => {

      const onDemandReportPrompt = ai.definePrompt({
        name: 'onDemandReportPrompt',
        input: {schema: z.any()},
        output: {schema: GenerateOnDemandReportOutputSchema},
        model: 'googleai/gemini-1.5-flash',
        config: {
          apiKey: geminiApiKey,
        },
        prompt: `You are an encouraging and analytical AI coach. Your task is to write a short, motivational on-demand progress report for the user based *only* on the data provided for the current week. This is a mid-week check-in.

        **YOUR TASK: Write an insightful and human-readable report by following these steps precisely.**

        1.  **Greeting:** Start with a friendly greeting. Use the user's name, which is **{{userData.userProfile.name}}**. Do not use any other name.

        2.  **Workout Adherence Analysis:**
            *   Compare the number of logged workouts (count of items in \`workoutLogs\`) to the number of planned workouts (count of items in \`baseWorkoutPlan\`).
            *   State this clearly, for example: "You've completed X out of Y planned workouts".
            *   Then, list the names of the completed workouts from the \`workoutLogs\`. Use a loop for this.

        3.  **Nutrition Adherence Analysis:**
            *   Acknowledge the user's meal logging.
            *   List the specific meals logged by their 'description' field from the \`mealLogs\`. Use a loop for this and list every single one.

        4.  **Other Activities:**
            *   Check the \`activityLogs\`. If there are any, list them by their 'activityType' and 'durationMinutes'.

        5.  **Weight Trend Analysis:**
            *   Look at the \`weightLogs\`.
            *   If there is more than one entry, state the trend by mentioning the change from the first weight log to the most recent one.
            *   If there is only one entry, just state the latest weight.

        6.  **Closing:** End with a short, positive, and motivational summary.

        **IMPORTANT RESTRICTION**: Do NOT mention creating new plans or that the "official weekly plan will be updated". Do not invent or "hallucinate" any information, names, meals, or activities that are not explicitly present in the provided data. Stick strictly to the data in the JSON.

        Generate the 'analysisReport' based on these explicit instructions.
        `,
      });
      
      const {output} = await onDemandReportPrompt(userData);
      
      if (!output) {
        throw new Error("The AI failed to generate a report based on the provided data.");
      }

      return output;
    }
  );
  return generateOnDemandReportFlow(input);
}
