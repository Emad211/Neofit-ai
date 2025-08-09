
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

        **YOUR TASK:**
        1.  Start with a friendly and encouraging greeting, using the user's name (e.g., "Hey {{{userData.userProfile.name}}}, great work this week!").
        2.  Carefully review the logs provided for the current week. Address EACH category based on whether it has data or not.
        
        {{#if userData.mealLogs}}
        - **Meals**: Acknowledge the meals they've logged. Mention one or two specific items. For example: "I see you've logged some meals, like the '{{{userData.mealLogs.0.description}}}' - sounds delicious!"
        {{else}}
        - **Meals**: Gently encourage them to log their meals. For example: "Remember to log your meals to keep track of your nutrition."
        {{/if}}

        {{#if userData.activityLogs}}
        - **Activities**: Praise their logged activities. Mention a specific one. For example: "Awesome job on that {{{userData.activityLogs.0.durationMinutes}}}-minute {{{userData.activityLogs.0.activityType}}}!"
        {{else}}
        - **Activities**: If no separate activities are logged, gently encourage it. For example: "Don't forget to log any activities you do, every bit counts!"
        {{/if}}
        
        {{#if userData.workoutLogs}}
        - **Workouts**: Commend them for completing their workouts. For example: "Great job completing the '{{{userData.workoutLogs.0.workoutName}}}' workout!"
        {{else}}
        - **Workouts**: If no full workouts are logged, encourage them. For example: "Try to complete one of your planned workouts this week to stay on track!"
        {{/if}}

        {{#if userData.weightLogs}}
        - **Weight**: Mention their latest weight log. For example: "Thanks for logging your weight! Your latest weigh-in was {{{userData.weightLogs.0.weight}}} kg."
        {{else}}
        - **Weight**: Gently remind them to log their weight. For example: "I don't see a weight log for this week yet. Remember to weigh in to track your progress!"
        {{/if}}

        3.  Conclude with a motivational closing statement.
        4.  **IMPORTANT RESTRICTION**: Do NOT mention creating new plans or that the "official weekly plan will be updated". This is only an on-demand, mid-week check-in. Just focus on the data provided for this week.

        Generate the 'analysisReport' based on these explicit instructions.
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
