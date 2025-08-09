
'use server';

/**
 * @fileOverview A flow to generate a personalized weekly nutrition program.
 *
 * - generateNutritionProgram - A function that creates a 7-day meal plan.
 * - GenerateNutritionProgramInput - The input type for the function.
 * - GenerateNutritionProgramOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNutritionProgramInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  goals: z.string().describe('The fitness goals of the user (e.g., "lose_weight", "gain_muscle").'),
  performanceGoals: z.string().optional().describe('Specific performance goals, like "run a 5k" or "increase bench press".'),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).describe('The fitness level of the user.'),
  physicalSpecifications: z.string().describe('Physical specs of the user such as height, weight, gender, age, and body type.'),
  lifestyle: z.string().describe('General daily activity level, e.g., "sedentary office job".'),
  sleepHours: z.string().describe('Average hours of sleep per night.'),
  stressLevel: z.string().describe('Average stress level (e.g., "low", "medium", "high").'),
  eatingHabits: z.string().describe('Eating habits including disliked foods, allergies, or specific dietary preferences like vegetarian.'),
  cookingSkill: z.enum(['beginner', 'intermediate', 'advanced']).describe("The user's cooking skill level."),
  costLevel: z.enum(['low', 'medium', 'high']).describe("The user's preferred budget for food."),
  trainingDays: z.number().describe('The number of days the user plans to train per week.'),
  trainingDuration: z.string().describe("The user's preferred workout duration per session (e.g., '30-45 minutes')."),
  trainingTime: z.string().describe("The user's preferred time of day to work out (e.g., 'morning', 'evening')."),
  history: z.string().optional().describe("A JSON string containing the summary of the user's past performance, adherence, and feedback. This is crucial for long-term planning and adaptation."),
});
export type GenerateNutritionProgramInput = z.infer<typeof GenerateNutritionProgramInputSchema>;


const MealSchema = z.object({
    type: z.string().describe("The type of meal (e.g., Breakfast, Lunch, Dinner, Snack)."),
    name: z.string().describe("The name of the meal."),
    calories: z.number().int().describe("Estimated calories for the meal."),
    image: z.string().describe("A placeholder image URL for the meal. This must be a valid URL, for example: https://placehold.co/600x400.png."),
    dataAiHint: z.string().describe("One or two keywords for a relevant image search, like 'chicken salad'."),
    ingredients: z.array(z.object({
        name: z.string(),
        quantity: z.string(),
        category: z.enum(["Produce", "Fruits", "Protein", "Dairy & Alternatives", "Pantry"]),
    })),
});

const DailyMealPlanSchema = z.object({
    day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
    meals: z.array(MealSchema),
    totalCalories: z.number().int().describe("The total estimated calories for the day."),
});

const GenerateNutritionProgramOutputSchema = z.object({
    weeklyMealPlan: z.array(DailyMealPlanSchema),
    summary: z.string().describe("A brief, encouraging summary of the generated nutrition plan."),
});
export type GenerateNutritionProgramOutput = z.infer<typeof GenerateNutritionProgramOutputSchema>;

async function callTool(input: GenerateNutritionProgramInput): Promise<GenerateNutritionProgramOutput> {
    return await generateNutritionProgram(input);
}


export const generateNutritionProgram = ai.defineTool(
    {
        name: 'generateNutritionProgram',
        description: 'Generates a personalized 7-day nutrition plan based on user profile and history.',
        inputSchema: GenerateNutritionProgramInputSchema,
        outputSchema: GenerateNutritionProgramOutputSchema,
    },
    async (input) => {
        const generateNutritionProgramFlow = ai.defineFlow(
          {
            name: 'generateNutritionProgramFlow',
            inputSchema: GenerateNutritionProgramInputSchema,
            outputSchema: GenerateNutritionProgramOutputSchema,
          },
          async (input) => {
            const prompt = ai.definePrompt({
                name: 'generateNutritionProgramPrompt',
                input: { schema: GenerateNutritionProgramInputSchema },
                output: { schema: GenerateNutritionProgramOutputSchema },
                model: 'googleai/gemini-1.5-flash',
                prompt: `You are a world-class AI Nutritionist. Your task is to create a hyper-personalized, 7-day nutrition plan for a user based on their detailed profile and historical data. The plan must be realistic, sustainable, and aligned with their long-term goals.

                **USER PROFILE:**
                - Main Goal: {{{goals}}}
                - Specific Performance Goal: {{{performanceGoals}}}
                - Fitness Level: {{{fitnessLevel}}}
                - Physical Specs (Height, Weight, Gender, Age, Body Type): {{{physicalSpecifications}}}
                - Daily Activity (Lifestyle): {{{lifestyle}}}
                - Sleep & Stress: {{{sleepHours}}} of sleep, {{{stressLevel}}} stress.
                - Dietary Info (Dislikes, Allergies, Preferences): {{{eatingHabits}}}
                - Cooking Skill: {{{cookingSkill}}}
                - Food Budget: {{{costLevel}}}
                - Weekly Training Schedule: {{{trainingDays}}} days per week, for {{{trainingDuration}}} per session, usually in the {{{trainingTime}}}.

                **CRITICAL HISTORICAL CONTEXT & ANALYSIS (from the Master AI Coach):**
                {{#if history}}
                - Past Performance & Feedback: {{{history}}}
                {{else}}
                - Past Performance & Feedback: No history provided. This is the first plan.
                {{/if}}


                **YOUR TASKS:**
                1.  **Synthesize All Data**: You MUST consider both the user's core profile AND the historical context. The 'history' provides vital information on what worked, what didn't, adherence levels, and specific user feedback (like disliked meals). Use this to make intelligent adjustments.
                2.  **Calculate Caloric Needs**: Based on the user's entire profile, estimate their daily caloric needs. Adjust for their goal (e.g., slight deficit for weight loss, slight surplus for muscle gain). Use the 'history' to refine this calculation. If they are progressing well, maybe the calories are perfect. If they are stalling, adjust.
                3.  **Design a 7-Day Plan**: Create a meal plan for every day of the week (Monday to Sunday).
                    - Each day should have 2-4 meals (e.g., Breakfast, Lunch, Dinner, and optionally a Snack).
                    - Distribute calories appropriately. Pay special attention to the user's preferred training time to plan pre- and post-workout meals.
                    - **CRUCIAL**: The meal choices MUST reflect the user's budget, cooking skill, and avoid their disliked foods/allergies mentioned in both their profile and the historical feedback. Do not repeat meals the user has indicated they dislike.
                4.  **Detail Each Meal**: For every meal, provide:
                    - A descriptive name (e.g., "Grilled Chicken Salad with Avocado").
                    - Estimated calories (as an integer).
                    - A list of simple ingredients with quantities and a category.
                    - A placeholder image URL: ALWAYS use \`https://placehold.co/600x400.png\`.
                    - A \`dataAiHint\` with one or two keywords for image generation (e.g., "grilled chicken").
                5.  **Summarize**: Write a brief, encouraging summary of the plan you've created. In the summary, specifically mention how the plan is tailored to the user's goal ({{{goals}}}), budget ({{{costLevel}}}), cooking skill ({{{cookingSkill}}}), and how it adapts based on their recent progress from the 'history'.

                Return the complete, valid JSON object containing the 7-day meal plan and the summary.
                `,
            });
            
            const {output} = await prompt(input);
            return output!;
          }
        );
        return await generateNutritionProgramFlow(input);
    }
);
