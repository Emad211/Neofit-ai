
'use server';

/**
 * @fileOverview A flow to generate a personalized weekly workout program.
 *
 * - generateWorkoutProgram - A function that creates a 7-day workout plan.
 * - GenerateWorkoutProgramInput - The input type for the function.
 * - GenerateWorkoutProgramOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWorkoutProgramInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  goals: z.string().describe('The fitness goals of the user (e.g., "lose_weight", "gain_muscle").'),
  performanceGoals: z.string().optional().describe('Specific performance goals, like "run a 5k" or "increase bench press".'),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).describe('The fitness level of the user.'),
  trainingDays: z.number().int().min(2).max(6).describe('The number of days the user wants to train per week.'),
  trainingDuration: z.string().describe("The user's preferred workout duration per session (e.g., '30-45 minutes')."),
  trainingTime: z.string().describe("The user's preferred time of day to work out (e.g., 'morning', 'evening')."),
  workoutLocation: z.enum(['gym', 'home']).describe('Where the user plans to work out.'),
  availableEquipment: z.string().describe('A comma-separated list of equipment available to the user.'),
  medicalHistory: z.string().describe('Any medical history or injuries the user has reported.'),
  physicalSpecifications: z.string().describe('Physical specs of the user such as height, weight, gender, age, and body type.'),
  sleepHours: z.string().describe('Average hours of sleep per night.'),
  stressLevel: z.string().describe('Average stress level (e.g., "low", "medium", "high").'),
  history: z.string().optional().describe("A JSON string containing the summary of the user's past performance, adherence, and feedback. This is crucial for long-term planning and adaptation."),
});
export type GenerateWorkoutProgramInput = z.infer<typeof GenerateWorkoutProgramInputSchema>;


const ExerciseSchema = z.object({
    name: z.string().describe("The name of the exercise."),
    sets: z.string().describe("The number of sets to perform (e.g., '3', '3-4')."),
    reps: z.string().describe("The target repetition range (e.g., '8-12', 'AMRAP', '30s')."),
});

const DailyWorkoutSchema = z.object({
    id: z.string().describe("A unique ID for the workout (e.g., 'full-body-a')."),
    day: z.string().describe("The designated day for the workout (e.g., 'Day 1', 'Day 2')."),
    title: z.string().describe("A title for the workout session."),
    focus: z.string().describe("The primary focus of the workout (e.g., 'Strength Training', 'Cardiovascular', 'Flexibility')."),
    duration: z.string().describe("Estimated duration of the workout in minutes (e.g., '45-60 min')."),
    calories: z.string().describe("Estimated calories burned (e.g., '350 kcal')."),
    exercises: z.array(ExerciseSchema),
});

const GenerateWorkoutProgramOutputSchema = z.object({
    weeklyWorkoutPlan: z.array(DailyWorkoutSchema),
    summary: z.string().describe("A brief, encouraging summary of the generated workout plan."),
});
export type GenerateWorkoutProgramOutput = z.infer<typeof GenerateWorkoutProgramOutputSchema>;

export async function generateWorkoutProgram(input: GenerateWorkoutProgramInput): Promise<GenerateWorkoutProgramOutput> {
    const generateWorkoutProgramFlow = ai.defineFlow(
      {
        name: 'generateWorkoutProgramFlow',
        inputSchema: GenerateWorkoutProgramInputSchema,
        outputSchema: GenerateWorkoutProgramOutputSchema,
      },
      async (input) => {

        const prompt = ai.definePrompt({
            name: 'generateWorkoutProgramPrompt',
            input: { schema: GenerateWorkoutProgramInputSchema },
            output: { schema: GenerateWorkoutProgramOutputSchema },
            model: 'googleai/gemini-1.5-flash',
            prompt: `You are an elite-level Strength and Conditioning Coach AI. Your mission is to create a safe, effective, and engaging weekly workout program that adapts to the user's progress over time.

            **USER PROFILE:**
            - Main Goal: {{{goals}}}
            - Specific Performance Goal: {{{performanceGoals}}}
            - Fitness Level: {{{fitnessLevel}}}
            - Physical Specs (Height, Weight, Gender, Age, Body Type): {{{physicalSpecifications}}}
            - Training Days Per Week: {{{trainingDays}}}
            - Preferred Session Duration: {{{trainingDuration}}}
            - Preferred Training Time: {{{trainingTime}}}
            - Workout Location: {{{workoutLocation}}}
            - Available Equipment: {{{availableEquipment}}}
            - Medical History/Injuries: {{{medicalHistory}}}
            - Recovery Metrics: {{{sleepHours}}} of sleep, {{{stressLevel}}} stress.

            **CRITICAL HISTORICAL CONTEXT & ANALYSIS (from the Master AI Coach):**
            {{#if history}}
            - Past Performance & Feedback: {{{history}}}
            {{else}}
            - Past Performance & Feedback: No history provided. This is the first plan.
            {{/if}}

            **YOUR TASKS:**
            1.  **Synthesize All Data**: Your primary task is to integrate the user's core profile with the 'history' data. The history tells you about their actual performance, adherence, and any pain points or replaced exercises. Use this to make intelligent, long-term decisions.
            2.  **Design an Adaptive Weekly Split**: Based on the 'Training Days Per Week' and 'history', create or adjust the workout split.
                - For a new user, a 'Full Body' or 'Upper/Lower' split is great.
                - For an advancing user, consider progressing to a 'Push/Pull/Legs' split.
                - **CRUCIAL**: If the 'history' shows the user is struggling with recovery (low adherence, high stress), maybe add an extra rest day. If they are progressing well, you can increase volume or intensity.
                - Include active recovery or rest days. For every training day, create a corresponding workout object. Rest days should not have a workout object.
            3.  **Create Daily Workouts**: For each training day:
                - Define a clear 'title' and 'focus'.
                - Select exercises based on the 'Preferred Session Duration' and available equipment.
                - **CRUCIAL**: Do NOT include exercises the user has previously replaced due to pain, as noted in their 'history' or 'medicalHistory'.
                - If progress on an exercise has stalled (based on history), consider swapping it for a variation or alternative.
                - For each exercise, specify 'sets' and 'reps'. Consider principles of progressive overload.
            4.  **Provide Metadata**: For each daily workout, estimate the 'duration' and 'calories' burned.
            5.  **Summarize**: Write a brief, motivational summary. Highlight HOW this new plan is an intelligent adaptation based on their previous week's performance and feedback from the 'history'.

            Return a single, valid JSON object containing the list of daily workout objects and the summary.
            `,
        });

        const {output} = await prompt(input);
        return output!;
      }
    );
    return await generateWorkoutProgramFlow(input);
}


export function getGenerateWorkoutProgramTool() {
    return ai.defineTool(
        {
            name: 'generateWorkoutProgram',
            description: 'Generates a personalized 7-day workout program based on user profile and history.',
            inputSchema: GenerateWorkoutProgramInputSchema,
            outputSchema: GenerateWorkoutProgramOutputSchema,
        },
        generateWorkoutProgram
    );
}
