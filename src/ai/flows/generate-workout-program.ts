
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
  goals: z.string().describe('The fitness goals of the user (e.g., "lose_weight", "gain_muscle", "run a 5k").'),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).describe('The fitness level of the user.'),
  trainingDays: z.number().int().min(2).max(6).describe('The number of days the user wants to train per week.'),
  trainingDuration: z.string().describe("The user's preferred workout duration per session (e.g., '30-45 minutes')."),
  trainingTime: z.string().describe("The user's preferred time of day to work out (e.g., 'morning', 'evening')."),
  workoutLocation: z.enum(['gym', 'home']).describe('Where the user plans to work out.'),
  availableEquipment: z.string().describe('A comma-separated list of equipment available to the user.'),
  medicalHistory: z.string().describe('Any medical history or injuries the user has reported.'),
  physicalSpecifications: z.string().describe('Physical specs of the user such as height, weight, gender, age, and body type.'),
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
  return generateWorkoutProgramFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateWorkoutProgramPrompt',
    input: { schema: GenerateWorkoutProgramInputSchema },
    output: { schema: GenerateWorkoutProgramOutputSchema },
    model: 'googleai/gemini-1.5-flash',
    prompt: `You are an elite-level Strength and Conditioning Coach AI. Your mission is to create a safe, effective, and engaging weekly workout program based on the user's profile. The program should be structured and easy to follow.

    USER PROFILE:
    - Goal: {{{goals}}}
    - Fitness Level: {{{fitnessLevel}}}
    - Physical Specs (Height, Weight, Body Type, etc.): {{{physicalSpecifications}}}
    - Training Days Per Week: {{{trainingDays}}}
    - Preferred Session Duration: {{{trainingDuration}}}
    - Preferred Training Time: {{{trainingTime}}}
    - Workout Location: {{{workoutLocation}}}
    - Available Equipment: {{{availableEquipment}}}
    - Medical History/Injuries: {{{medicalHistory}}}

    YOUR TASKS:
    1.  **Design a Weekly Split**: Based on the 'Training Days Per Week', create a logical workout split.
        - For 2-3 days, a 'Full Body' split is effective.
        - For 4 days, an 'Upper/Lower' split is a great choice.
        - For 5-6 days, a 'Push/Pull/Legs' or Body Part split works well.
        - Consider the user's body type. Ectomorphs might benefit from more rest days, while Endomorphs might need more frequent cardio sessions.
        - Include active recovery or rest days. For every training day, create a corresponding workout object. Rest days should not have a workout object.
    2.  **Create Daily Workouts**: For each training day in the split:
        - Define a clear 'title' and 'focus'.
        - Select an appropriate number of exercises based on the 'Preferred Session Duration'. A 60-minute session should have about 5-7 exercises.
        - The exercises MUST be feasible with the user's 'availableEquipment' and 'workoutLocation'.
        - Avoid exercises that could be contraindicated by the 'medicalHistory' (e.g., no high-impact exercises for knee pain).
        - For each exercise, specify the number of 'sets' and a target 'reps' range.
    3.  **Provide Metadata**: For each daily workout, estimate the 'duration' and 'calories' burned. The duration should align with the user's preference.
    4.  **Summarize**: Write a brief, motivational summary of the plan.

    Return a single, valid JSON object containing the list of daily workout objects and the summary.
    `,
});

const generateWorkoutProgramFlow = ai.defineFlow(
  {
    name: 'generateWorkoutProgramFlow',
    inputSchema: GenerateWorkoutProgramInputSchema,
    outputSchema: GenerateWorkoutProgramOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
