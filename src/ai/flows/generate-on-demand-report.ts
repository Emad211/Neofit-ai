
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
        prompt: `You are the friendly, encouraging, and analytical AI coach for the NeoFit application. Your task is to write a short, motivational on-demand progress report for the user based *only* on the data provided for the current week. This is a mid-week check-in, not the final weekly summary.

        **USER DATA (Full JSON Dump):**
        {{{json userData}}}

        ---

        **YOUR TASK: Write an insightful and human-readable report.**

        1.  **Start with a friendly and encouraging greeting.** Use the user's name: **{{userData.userProfile.name}}**.

        2.  **Analyze Workout Adherence:**
            *   Compare the number of logged workouts (count of items in \`workoutLogs\`) to the number of planned workouts (count of items in \`baseWorkoutPlan\`).
            *   **If adherence is good**, praise them (e.g., "Amazing job on completing X out of Y workouts so far!").
            *   **If workouts were missed**, be encouraging (e.g., "You've completed X workout(s) so far. Let's try to hit the next one!").
            *   **If no workouts were logged**, gently remind them (e.g., "I don't see any logged workouts yet this week. Let's try to get one in soon!").

        3.  **Analyze Nutrition Adherence:**
            *   Calculate the average daily calorie intake from the \`mealLogs\`.
            *   Compare this to the average target calories from the \`baseNutritionPlan\`.
            *   Comment on their progress (e.g., "You're doing a great job staying close to your calorie targets," or "I noticed we're a bit over our calorie goal on average, let's keep an eye on that for the rest of the week.").
            *   Mention one or two logged meals by name to show you're paying attention (e.g., "The 'Lentil Soup' and 'Scrambled Tofu' looked great!").

        4.  **Analyze Weight Trend:**
            *   Look at the \`weightLogs\`. Is the weight trending in the right direction based on their goal (\`userProfile.goal\`)?
            *   **If it's trending well (e.g., down for weight loss)**, celebrate it! (e.g., "Great news! The scale is moving in the right direction, showing a drop from START to END kg.").
            *   **If it's stagnant or going the wrong way**, be encouraging and focus on the process (e.g., "Weight can fluctuate, so let's stay consistent with the plan.").
            *   **If only one log exists**, just state the latest weight (e.g., "Thanks for logging your weight! Your latest weigh-in was X kg.").

        5.  **Acknowledge Other Activities:**
            *   Briefly mention any other activities from \`activityLogs\` (e.g., "Awesome job on that 30-minute Light Jog!").

        6.  **End with a Motivational Summary:**
            *   Provide a strong, positive closing statement to encourage them for the rest of the week.

        **IMPORTANT RESTRICTION**: Do NOT mention creating new plans or that the "official weekly plan will be updated". This is only an on-demand, mid-week check-in. Just focus on analyzing the data provided.

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
