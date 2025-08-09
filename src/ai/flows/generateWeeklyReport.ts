
'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating an on-demand weekly report for a user.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { getUserDataForWeeklyReview } from '../tools/get-user-data';

// Define the input schema for the flow
const GenerateWeeklyReportInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom the report is being generated.'),
});
export type GenerateWeeklyReportInput = z.infer<typeof GenerateWeeklyReportInputSchema>;

// Define the output schema for the flow
const GenerateWeeklyReportOutputSchema = z.object({
  analysisReport: z.string().describe("A comprehensive, encouraging, and human-readable summary of the user's progress for the week so far."),
});
export type GenerateWeeklyReportOutput = z.infer<typeof GenerateWeeklyReportOutputSchema>;

/**
 * The prompt for generating the on-demand report.
 */
const reportPrompt = ai.definePrompt({
  name: 'generateWeeklyReportPrompt',
  tools: [getUserDataForWeeklyReview],
  input: {schema: GenerateWeeklyReportInputSchema},
  output: {schema: GenerateWeeklyReportOutputSchema},
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are a motivating and insightful AI fitness coach. Your job is to provide a user with an on-demand progress report for their week so far.

  Follow these steps with precision for User ID: {{{userId}}}

  **Step 1: Get User Data**
  - Call the 'getUserDataForWeeklyReview' tool to get all available data for the user for the last 7 days. This will include their profile, past reports (for context), and all logs from the current week.

  **Step 2: Write the Progress Report**
  - Based on the data from Step 1, write a comprehensive, insightful, and encouraging report for the user's week *so far*.
  - Analyze their adherence to workout and nutrition plans.
  - Highlight any progress you can see (e.g., consistency, weight changes, workout volume).
  - Acknowledge any logged feedback (e.g., replaced exercises, disliked meals).
  - Keep the tone positive and motivational. Do NOT mention generating a new plan, as that happens automatically later.
  - Frame the report as a mid-week check-in or a summary of the week to date.
  
  Return the report in the 'analysisReport' field.
  `,
});


/**
 * The main flow for generating the report.
 */
const generateWeeklyReportFlow = ai.defineFlow(
  {
    name: 'generateWeeklyReportFlow',
    inputSchema: GenerateWeeklyReportInputSchema,
    outputSchema: GenerateWeeklyReportOutputSchema,
  },
  async (input) => {
    const {output} = await reportPrompt(input);
    return output!;
  }
);

/**
 * Wrapper function to be called from the frontend.
 */
export async function generateWeeklyReport(input: GenerateWeeklyReportInput): Promise<GenerateWeeklyReportOutput> {
  return generateWeeklyReportFlow(input);
}
