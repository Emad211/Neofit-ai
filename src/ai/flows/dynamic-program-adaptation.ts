
'use server';
/**
 * @fileOverview This file defines the Genkit flow for dynamically adapting a user's program
 * AT THE END OF A 7-DAY CYCLE. It is the master orchestrator responsible for weekly analysis
 * and generating the subsequent week's plans.
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
const DynamicProgramAdaptationInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom the analysis and adaptation is being generated.'),
});
export type DynamicProgramAdaptationInput = z.infer<typeof DynamicProgramAdaptationInputSchema>;

// Define the final output schema for the main flow
const DynamicProgramAdaptationOutputSchema = z.object({
  analysisReport: z.string().describe("A comprehensive, encouraging, and human-readable summary of the user's weekly progress, adherence, and achievements."),
  nextWeekWorkoutPlanSummary: z.string().describe("A summary of the new workout plan for the upcoming week."),
  nextWeekNutritionPlanSummary: z.string().describe("A summary of the new nutrition plan for the upcoming week."),
});
export type DynamicProgramAdaptationOutput = z.infer<typeof DynamicProgramAdaptationOutputSchema>;

// NEW: Define an intermediate schema for the AI analysis prompt
const AIAnalysisInputSchema = z.object({
    userData: z.any().describe("A JSON object containing all of the user's data for the week: profile, logs, and historical reports."),
});

// NEW: Define the output for the analysis prompt, which includes the report and a structured history object
const AIAnalysisOutputSchema = z.object({
    analysisReport: z.string().describe("The human-readable report for the user."),
    structuredHistory: z.string().describe("A structured JSON string summarizing the analysis for use by other AI agents."),
});


/**
 * Wrapper function to be called from the server (e.g., a scheduled job).
 */
export async function dynamicProgramAdaptation(input: DynamicProgramAdaptationInput): Promise<DynamicProgramAdaptationOutput> {
    const dynamicProgramAdaptationFlow = ai.defineFlow(
      {
        name: 'dynamicProgramAdaptationFlow',
        inputSchema: DynamicProgramAdaptationInputSchema,
        outputSchema: DynamicProgramAdaptationOutputSchema,
      },
      async (input) => {
        
        // STEP 1: Programmatically fetch all user data first. This is guaranteed to run.
        const userData = await getUserDataForWeeklyReview({ userId: input.userId });

        // STEP 2: Define and call the AI prompt for analysis, passing the fetched data.
        const analysisPrompt = ai.definePrompt({
          name: 'weeklyAnalysisPrompt',
          input: { schema: AIAnalysisInputSchema },
          output: { schema: AIAnalysisOutputSchema },
          model: 'googleai/gemini-1.5-flash',
          prompt: `You are the master AI coach for the NeoFit application. You have been provided with a complete data dump for a user.
          
          USER DATA:
          {{{json userData}}}

          **YOUR TASKS:**
          1.  **Generate the User-Facing Weekly Report**: Based on ALL the provided data, write a comprehensive, insightful, and encouraging report for the user.
              - Analyze their adherence to workout and nutrition plans.
              - Highlight progress (e.g., weight change, increased workout volume).
              - Acknowledge any logged feedback (e.g., replaced exercises, disliked meals).
              - Keep the tone positive and motivational.

          2.  **Create a Structured JSON Analysis for AI Specialists**: Synthesize your findings into a structured JSON object string. This will be the 'history' parameter for the specialist AIs. It should summarize adherence, progress, and key feedback points clearly.
          
          Return both the human-readable 'analysisReport' and the 'structuredHistory' JSON string.
          `,
        });

        const { output: analysisResult } = await analysisPrompt({ userData });
        
        if (!analysisResult) {
            throw new Error("AI analysis failed to produce an output.");
        }

        const { analysisReport, structuredHistory } = analysisResult;

        // STEP 3: Save the generated report.
        await saveWeeklyReport({ userId: input.userId, analysisReport });

        // STEP 4: Generate the next week's plans using the structured history.
        // We need to get the user's full profile to pass to the generation flows.
        const userProfile = userData.userProfile;
        if (!userProfile) throw new Error("User profile is missing from fetched data.");

        const [workoutResult, nutritionResult] = await Promise.all([
            generateWorkoutProgram({
                userId: input.userId,
                // Pass all required fields from the user's profile
                goals: userProfile.goal,
                performanceGoals: userProfile.performanceGoals,
                fitnessLevel: userProfile.fitnessLevel,
                trainingDays: parseInt(userProfile.trainingDays, 10),
                trainingDuration: userProfile.trainingDuration,
                trainingTime: userProfile.trainingTime,
                workoutLocation: userProfile.workoutLocation,
                availableEquipment: userProfile.availableEquipment || 'Full gym equipment',
                medicalHistory: userProfile.medicalHistory || 'None',
                physicalSpecifications: `${userProfile.gender}, ${userProfile.age} years, ${userProfile.height}cm, ${userProfile.weight}kg, ${userProfile.bodyType}`,
                sleepHours: userProfile.sleepHours,
                stressLevel: userProfile.stressLevel,
                // Crucially, pass the structured history from the analysis
                history: structuredHistory,
            }),
            generateNutritionProgram({
                userId: input.userId,
                // Pass all required fields from the user's profile
                goals: userProfile.goal,
                performanceGoals: userProfile.performanceGoals,
                fitnessLevel: userProfile.fitnessLevel,
                physicalSpecifications: `${userProfile.gender}, ${userProfile.age} years, ${userProfile.height}cm, ${userProfile.weight}kg, ${userProfile.bodyType}`,
                lifestyle: userProfile.lifestyle,
                sleepHours: userProfile.sleepHours,
                stressLevel: userProfile.stressLevel,
                eatingHabits: userProfile.eatingHabits,
                cookingSkill: userProfile.cookingSkill,
                costLevel: userProfile.costLevel,
                trainingDays: parseInt(userProfile.trainingDays, 10),
                trainingDuration: userProfile.trainingDuration,
                trainingTime: userProfile.trainingTime,
                 // Crucially, pass the structured history from the analysis
                history: structuredHistory,
            })
        ]);

        // STEP 5: Consolidate and return the final output.
        return {
            analysisReport,
            nextWeekWorkoutPlanSummary: workoutResult.summary,
            nextWeekNutritionPlanSummary: nutritionResult.summary,
        };
      }
    );
  return dynamicProgramAdaptationFlow(input);
}
