'use server';

/**
 * @fileOverview Flow for analyzing user onboarding data to personalize and ensure the safety of fitness programs.
 *
 * - onboardingAnalysis - Analyzes user onboarding data.
 * - OnboardingAnalysisInput - The input type for onboardingAnalysis.
 * - OnboardingAnalysisOutput - The output type for onboardingAnalysis.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OnboardingAnalysisInputSchema = z.object({
  userId: z.string().describe('The ID of the user undergoing onboarding.'),
  medicalHistory: z
    .string()
    .describe('The medical history of the user, including any selected injured body parts.'),
  fitnessLevel: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .describe('The fitness level of the user.'),
  goals: z.string().describe('The fitness goals of the user.'),
  physicalSpecifications: z
    .string()
    .describe('Physical specs of the user such as height, weight, gender, age and body type'),
  lifestyle: z
    .string()
    .describe('Lifestyle information of the user such as occupation and activity levels'),
  eatingHabits: z
    .string()
    .describe('Eating habits of the user including disliked foods'),
  trainingDays: z
    .string()
    .describe('The number of training days that the user wants to workout'),
});
export type OnboardingAnalysisInput = z.infer<typeof OnboardingAnalysisInputSchema>;

const OnboardingAnalysisOutputSchema = z.object({
  medical_flags: z.object({
    risk_level: z
      .string()
      .describe('The risk level of the user based on medical history.'),
    contraindications: z
      .string()
      .describe('Any contraindications for the user based on medical history.'),
  }),
  caloric_needs: z.number().describe('The estimated caloric needs of the user.'),
  macro_targets: z
    .string()
    .describe('The recommended macro targets for the user.'),
  initial_level: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .describe('The initial fitness level of the user.'),
  training_split: z
    .string()
    .describe('The recommended training split for the user.'),
});
export type OnboardingAnalysisOutput = z.infer<typeof OnboardingAnalysisOutputSchema>;

export async function onboardingAnalysis(input: OnboardingAnalysisInput): Promise<OnboardingAnalysisOutput> {
  return onboardingAnalysisFlow(input);
}

const analysisPrompt = ai.definePrompt({
    name: 'onboardingAnalysisMasterPrompt',
    input: { schema: OnboardingAnalysisInputSchema },
    output: { schema: OnboardingAnalysisOutputSchema },
    prompt: `You are a master AI system composed of three expert agents: a medical advisor, a nutrition expert, and a fitness trainer. Your goal is to conduct a comprehensive analysis of a new user's onboarding data to create a safe, effective, and hyper-personalized fitness and nutrition plan.

Analyze the complete user profile below and return a single, consolidated JSON object containing the results from all three areas of expertise.

USER ONBOARDING DATA:
- User ID: {{{userId}}}
- Goal: {{{goals}}}
- Fitness Level: {{{fitnessLevel}}}
- Preferred Training Days: {{{trainingDays}}}
- Physical Specifications: {{{physicalSpecifications}}}
- Daily Lifestyle/Activity: {{{lifestyle}}}
- Medical History & Injuries: {{{medicalHistory}}}
- Disliked Foods / Allergies: {{{eatingHabits}}}

YOUR TASKS:

1.  **Medical Advisor:**
    - Scan the 'Medical History & Injuries' data.
    - Determine a 'risk_level' ('low', 'medium', 'high').
    - List any specific 'contraindications' (e.g., "high-impact jumping", "deep squats", "avoid heavy overhead pressing"). If none, return "None".
    - Populate the 'medical_flags' object.

2.  **Nutrition Expert:**
    - Analyze 'Physical Specifications', 'Daily Lifestyle/Activity', and 'goals'.
    - Calculate the user's Total Daily Energy Expenditure (TDEE) and assign it to 'caloric_needs'. Adjust this value based on their goal (e.g., a 300-500 calorie deficit for weight loss, a 300-500 surplus for muscle gain).
    - Determine appropriate macronutrient targets (protein, carbs, fat) based on their goal and caloric needs. Present this as a user-friendly string (e.g., "Protein: 150g, Carbs: 200g, Fat: 65g") for the 'macro_targets' field.

3.  **Fitness Trainer:**
    - Based on 'Fitness Level', 'goals', and 'Preferred Training Days', determine the 'initial_level'. Note: This might be the same as their self-reported level, but you can adjust it (e.g., an 'advanced' user who hasn't trained in years might be better starting at 'intermediate').
    - Recommend the most suitable 'training_split' (e.g., "Full Body", "Upper/Lower", "Push/Pull/Legs").

Return a single, valid JSON object that strictly follows the output schema.
`,
});


const onboardingAnalysisFlow = ai.defineFlow(
  {
    name: 'onboardingAnalysisFlow',
    inputSchema: OnboardingAnalysisInputSchema,
    outputSchema: OnboardingAnalysisOutputSchema,
  },
  async input => {
    const {output} = await analysisPrompt(input);
    
    // The initial_level in the schema is more constrained than the fitnessLevel input
    const validInitialLevel = ['beginner', 'intermediate', 'advanced'].includes(output!.initial_level)
    ? output!.initial_level as 'beginner' | 'intermediate' | 'advanced'
    : 'beginner';
    
    return {
        ...output!,
        initial_level: validInitialLevel
    };
  }
);
