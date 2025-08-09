
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
    userData: z.any().describe("A JSON object containing all of the user's data for the week: profile, base plans, logs, and historical reports."),
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
          prompt: `You are the master AI coach for the NeoFit application, acting as an expert analyst and motivational guide. Your task is to conduct a comprehensive weekly review based on the user's data and generate two outputs: a user-facing report and a structured JSON history for other AI agents.

**USER DATA (Full JSON Dump):**
{{{json userData}}}

---

**PART 1: GENERATE THE USER-FACING WEEKLY REPORT**

Write an insightful, encouraging, and actionable report for the user. Your tone should be that of a supportive and knowledgeable coach. Address the following points by deeply analyzing and comparing the 'base' plans with the 'logged' data.

*   **Greeting:** Start with a positive and personalized greeting. Use the user's name: **{{userData.userProfile.name}}**.

*   **Workout Adherence Analysis:**
    *   Compare the number of logged workouts (count of items in \`workoutLogs\`) to the number of planned workouts (count of items in \`baseWorkoutPlan\`).
    *   Calculate and state their adherence percentage.
    *   **If adherence is high (e.g., >80%),** celebrate their consistency (e.g., "Amazing consistency this week, you completed X out of Y workouts!").
    *   **If adherence is low,** be encouraging, not critical (e.g., "Life gets busy, but you still managed to complete X out of Y workouts. Let's aim for one more next week!").

*   **Nutrition Adherence Analysis:**
    *   Calculate the average daily calorie intake from the \`mealLogs\`.
    *   Compare this average to the average target daily calories from the \`baseNutritionPlan\`.
    *   Comment on how well they adhered to their calorie targets.
    *   **If they were close to their target,** praise their discipline (e.g., "You did a fantastic job with your nutrition, staying very close to your daily calorie goals.").
    *   **If they were consistently over/under,** provide a gentle, actionable tip (e.g., "I noticed we were a bit over our calorie target on a few days. For the upcoming week, perhaps we can focus on pre-planning our evening snacks to stay on track.").

*   **Performance & Progress Analysis:**
    *   **Weight Trend:** Analyze the \`weightLogs\`. Is their weight trending in the right direction based on their primary goal (\`userProfile.goal\`)? (e.g., "Great news! The scale is moving down, showing a loss of Z kg this week, which is perfect for our weight loss goal."). Be specific about the change.
    *   **Strength Trend:** Analyze the \`totalVolume\` in the \`workoutLogs\`. Is there an increase in strength? (e.g., "Your strength is clearly increasing! Your total lifting volume went up this week, which is a great sign of progress.").
    *   Celebrate any and all victories, no matter how small.

*   **User Feedback & Adaptations Insights:**
    *   Scan the \`workoutLogs\` for exercise names that differ from the \`baseWorkoutPlan\`. Acknowledge this as user feedback (e.g., "I see you swapped out Barbell Rows for Goblet Squats. Noted! We'll consider this preference for your next plan.").
    *   Check if there are patterns in the \`mealLogs\` that suggest preferences (e.g., "It looks like you're enjoying the high-protein breakfasts. We'll keep that in mind!").

*   **Closing & Forward Look:**
    *   End with a strong, motivational summary and set a positive tone for the week ahead.

---

**PART 2: CREATE A STRUCTURED JSON ANALYSIS FOR AI SPECIALISTS**

Synthesize your findings into a structured JSON object string. This will be the 'history' parameter for the specialist AIs (Nutrition and Workout). This JSON is for machines, so be concise and data-driven. **It MUST be a valid JSON string.**

*   **Format:**
    \`\`\`json
    {
      "workout_adherence": "X out of Y workouts completed",
      "nutrition_adherence": "User was on average X calories over/under the daily target of Y calories.",
      "performance_summary": "Weight trended down/up by Z kg, from START_WEIGHT to END_WEIGHT. Strength volume showed a positive/negative/stagnant trend.",
      "user_feedback_summary": "User replaced [Exercise A] with [Exercise B]. Seems to prefer simpler/quicker meals at lunchtime based on logs.",
      "key_takeaway_for_next_plan": "User is highly consistent with workouts but struggles with late-night snacking. Suggest increasing protein at dinner to improve satiety and maintain workout intensity for next week's plan."
    }
    \`\`\`
*   **Content:** Fill this JSON with the specific, data-driven insights from your analysis above. This history is CRITICAL for generating an adapted and improved plan for the next week.

Return both the human-readable 'analysisReport' and the 'structuredHistory' JSON string in the output.
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
