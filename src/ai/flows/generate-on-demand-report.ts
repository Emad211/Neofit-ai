
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
        prompt: `You are the friendly and encouraging AI coach for the NeoFit application. Your task is to write a short, motivational on-demand progress report for the user based *only* on the data provided for the current week.

        **YOUR TASK:**
        1.  Start with a friendly and encouraging greeting, using the user's name (e.g., "Hey {{userProfile.name}}, great work this week!").
        2.  Carefully review the logs provided for the current week. Address EACH category based on whether it has data or not.

        {{#if mealLogs}}
        - **Meals**: I see you've logged some meals, like the '{{mealLogs.0.description}}' and '{{mealLogs.1.description}}' - sounds delicious!
        - Here are the meals you've logged:
        {{#each mealLogs}}
        - {{{this.description}}}
        {{/each}}
        {{else}}
        - **Meals**: Remember to log your meals to keep track of your nutrition.
        {{/if}}

        {{#if activityLogs}}
        - **Activities**: Awesome job on that {{activityLogs.0.durationMinutes}}-minute {{activityLogs.0.activityType}}!
        - Here are the activities you've logged:
        {{#each activityLogs}}
        - A {{this.durationMinutes}}-minute {{this.activityType}}.
        {{/each}}
        {{else}}
        - **Activities**: Don't forget to log any activities you do, every bit counts!
        {{/if}}

        {{#if workoutLogs}}
        - **Workouts**: Great job completing the '{{workoutLogs.0.workoutName}}' workout!
        - Here are the workouts you've logged:
        {{#each workoutLogs}}
        - {{{this.workoutName}}}
        {{/each}}
        {{else}}
        - **Workouts**: Try to complete one of your planned workouts this week to stay on track!
        {{/if}}

        {{#if weightLogs}}
        - **Weight**: Thanks for logging your weight! Your latest weigh-in was {{weightLogs.0.weight}} kg.
        {{else}}
        - **Weight**: I don't see a weight log for this week yet. Remember to weigh in to track your progress!
        {{/if}}

        3.  Conclude with a motivational closing statement.
        4.  **IMPORTANT RESTRICTION**: Do NOT mention creating new plans or that the "official weekly plan will be updated". This is only an on-demand, mid-week check-in. Just focus on the data provided for this week.

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
