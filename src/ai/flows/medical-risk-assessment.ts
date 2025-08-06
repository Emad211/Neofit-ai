'use server';

/**
 * @fileOverview This file defines a Genkit flow for medical risk assessment.
 *
 * - medicalRiskAssessment - A function that takes user medical data as input and returns a risk assessment.
 * - MedicalRiskAssessmentInput - The input type for the medicalRiskAssessment function.
 * - MedicalRiskAssessmentOutput - The return type for the medicalRiskAssessment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MedicalRiskAssessmentInputSchema = z.object({
  medicalData: z
    .string()
    .describe('The user medical data including history, conditions, and medications.'),
});
export type MedicalRiskAssessmentInput = z.infer<typeof MedicalRiskAssessmentInputSchema>;

const MedicalRiskAssessmentOutputSchema = z.object({
  medical_flags: z.object({
    risk_level: z.string().describe('The overall risk level assessment (low, medium, high).'),
    contraindications: z
      .string()
      .describe('Any contraindications based on the medical data provided.'),
  }),
});
export type MedicalRiskAssessmentOutput = z.infer<typeof MedicalRiskAssessmentOutputSchema>;

export async function medicalRiskAssessment(input: MedicalRiskAssessmentInput): Promise<MedicalRiskAssessmentOutput> {
  return medicalRiskAssessmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'medicalRiskAssessmentPrompt',
  input: {schema: MedicalRiskAssessmentInputSchema},
  output: {schema: MedicalRiskAssessmentOutputSchema},
  prompt: `You are a medical advisor AI agent. Analyze the provided medical data to assess potential risks and contraindications for fitness recommendations.

Medical Data: {{{medicalData}}}

Based on this data, provide a risk assessment and highlight any contraindications.

Consider the following:
- Identify any pre-existing conditions.
- Evaluate potential interactions with exercise or dietary changes.
- Determine an overall risk level (low, medium, high).
- List specific contraindications.
`,
});

const medicalRiskAssessmentFlow = ai.defineFlow(
  {
    name: 'medicalRiskAssessmentFlow',
    inputSchema: MedicalRiskAssessmentInputSchema,
    outputSchema: MedicalRiskAssessmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
