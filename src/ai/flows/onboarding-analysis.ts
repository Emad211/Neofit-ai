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
    .describe('The medical history of the user.'),
  fitnessLevel: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .describe('The fitness level of the user.'),
  goals: z.string().describe('The fitness goals of the user.'),
  physicalSpecifications: z
    .string()
    .describe('Physical specs of the user such as height, weight and body type'),
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
    .enum(['beginner', 'intermediate'])
    .describe('The initial fitness level of the user.'),
  training_split: z
    .string()
    .describe('The recommended training split for the user.'),
});
export type OnboardingAnalysisOutput = z.infer<typeof OnboardingAnalysisOutputSchema>;

export async function onboardingAnalysis(input: OnboardingAnalysisInput): Promise<OnboardingAnalysisOutput> {
  return onboardingAnalysisFlow(input);
}

const medicalAdvisorAgent = ai.defineTool({
  name: 'medicalAdvisorAgent',
  description: 'Scans user medical data, outputs medical_flags object (risk_level, contraindications).',
  inputSchema: z.object({
    medicalHistory: z.string().describe('The medical history of the user.'),
  }),
  outputSchema: z.object({
    risk_level: z
      .string()
      .describe('The risk level of the user based on medical history.'),
    contraindications: z
      .string()
      .describe('Any contraindications for the user based on medical history.'),
  }),
  async (input) => {
    // TODO: Implement the medical advisor agent logic here
    // For now, return a placeholder object
    return {
      risk_level: 'low',
      contraindications: 'None',
    };
  },
});

const nutritionExpertAgent = ai.defineTool({
  name: 'nutritionExpertAgent',
  description: 'Calculates basic calories (TDEE) and macro ranges.',
  inputSchema: z.object({
    physicalSpecifications: z
      .string()
      .describe('Physical specs of the user such as height, weight and body type'),
    lifestyle: z
      .string()
      .describe('Lifestyle information of the user such as occupation and activity levels'),
    eatingHabits: z
      .string()
      .describe('Eating habits of the user including disliked foods'),
  }),
  outputSchema: z.object({
    caloric_needs: z.number().describe('The estimated caloric needs of the user.'),
    macro_targets: z
      .string()
      .describe('The recommended macro targets for the user.'),
  }),
  async (input) => {
    // TODO: Implement the nutrition expert agent logic here
    // For now, return a placeholder object
    return {
      caloric_needs: 2000,
      macro_targets: '50% carbs, 30% protein, 20% fat',
    };
  },
});

const fitnessTrainerAgent = ai.defineTool({
  name: 'fitnessTrainerAgent',
  description: 'Determines initial level (beginner, intermediate) and training split (full_body, upper_lower).',
  inputSchema: z.object({
    fitnessLevel: z
      .enum(['beginner', 'intermediate', 'advanced'])
      .describe('The fitness level of the user.'),
    goals: z.string().describe('The fitness goals of the user.'),
    trainingDays: z
      .string()
      .describe('The number of training days that the user wants to workout'),
  }),
  outputSchema: z.object({
    initial_level: z
      .enum(['beginner', 'intermediate'])
      .describe('The initial fitness level of the user.'),
    training_split: z
      .string()
      .describe('The recommended training split for the user.'),
  }),
  async (input) => {
    // TODO: Implement the fitness trainer agent logic here
    // For now, return a placeholder object
    return {
      initial_level: 'beginner',
      training_split: 'full_body',
    };
  },
});

const onboardingAnalysisPrompt = ai.definePrompt({
  name: 'onboardingAnalysisPrompt',
  tools: [
    medicalAdvisorAgent,
    nutritionExpertAgent,
    fitnessTrainerAgent,
  ],
  input: {schema: OnboardingAnalysisInputSchema},
  output: {schema: OnboardingAnalysisOutputSchema},
  prompt: `Analyze the onboarding data for user {{{userId}}} to personalize and ensure the safety of their fitness programs.\n\nConsider the user's medical history: {{{medicalHistory}}}.\n\nBased on their fitness level ({{{fitnessLevel}}}) and goals ({{{goals}}}), determine an appropriate initial fitness level and training split.\n\nAlso, considering the user's physical specifications ({{{physicalSpecifications}}}), lifestyle ({{{lifestyle}}}), eating habits ({{{eatingHabits}}}), and preferred training days ({{{trainingDays}}}), provide personalized recommendations.\n\nUse the medicalAdvisorAgent tool to assess medical risks and contraindications.\nUse the nutritionExpertAgent tool to calculate caloric needs and macro targets.\nUse the fitnessTrainerAgent tool to determine the initial fitness level and training split.\n`,
});

const onboardingAnalysisFlow = ai.defineFlow(
  {
    name: 'onboardingAnalysisFlow',
    inputSchema: OnboardingAnalysisInputSchema,
    outputSchema: OnboardingAnalysisOutputSchema,
  },
  async input => {
    const {output} = await onboardingAnalysisPrompt(input);
    return output!;
  }
);

