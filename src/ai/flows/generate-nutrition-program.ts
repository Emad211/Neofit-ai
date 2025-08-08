
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
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).describe('The fitness level of the user.'),
  physicalSpecifications: z.string().describe('Physical specs of the user such as height, weight, gender, and age.'),
  lifestyle: z.string().describe('Lifestyle information of the user such as occupation and activity levels.'),
  eatingHabits: z.string().describe('Eating habits of the user including disliked foods or allergies.'),
  costLevel: z.enum(['low', 'medium', 'high']).describe('The user\'s preferred budget for food.'),
  trainingDays: z.number().describe('The number of days the user plans to train per week.'),
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


export async function generateNutritionProgram(input: GenerateNutritionProgramInput): Promise<GenerateNutritionProgramOutput> {
  return generateNutritionProgramFlow(input);
}


const prompt = ai.definePrompt({
    name: 'generateNutritionProgramPrompt',
    input: { schema: GenerateNutritionProgramInputSchema },
    output: { schema: GenerateNutritionProgramOutputSchema },
    model: 'googleai/gemini-1.5-flash',
    prompt: `You are a world-class AI Nutritionist. Your task is to create a hyper-personalized, 7-day nutrition plan for a user based on their detailed profile. The plan must be realistic, sustainable, and aligned with their goals.

    USER PROFILE:
    - Goal: {{{goals}}}
    - Fitness Level: {{{fitnessLevel}}}
    - Physical Specs: {{{physicalSpecifications}}}
    - Daily Activity: {{{lifestyle}}}
    - Disliked Foods/Allergies: {{{eatingHabits}}}
    - Food Budget: {{{costLevel}}}
    - Weekly Training Days: {{{trainingDays}}}

    YOUR TASKS:
    1.  **Calculate Caloric Needs**: Based on the user's profile, estimate their daily caloric needs. Adjust for their goal (e.g., slight deficit for weight loss, slight surplus for muscle gain).
    2.  **Design a 7-Day Plan**: Create a meal plan for each day of the week (Monday to Sunday).
        - Each day should have 2-4 meals (e.g., Breakfast, Lunch, Dinner, and optionally a Snack).
        - Distribute calories appropriately throughout the day.
        - The meal choices should reflect the user's budget (costLevel) and avoid their disliked foods.
    3.  **Detail Each Meal**: For every meal, provide:
        - A descriptive name (e.g., "Grilled Chicken Salad with Avocado").
        - Estimated calories (as an integer).
        - A list of simple ingredients with quantities and a category.
        - A placeholder image URL: ALWAYS use \`https://placehold.co/600x400.png\`.
        - A \`dataAiHint\` with one or two keywords for image generation (e.g., "grilled chicken").
    4.  **Summarize**: Write a brief, encouraging summary of the plan you've created.

    Return the complete, valid JSON object containing the 7-day meal plan and the summary.
    `,
});

const generateNutritionProgramFlow = ai.defineFlow(
  {
    name: 'generateNutritionProgramFlow',
    inputSchema: GenerateNutritionProgramInputSchema,
    outputSchema: GenerateNutritionProgramOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
