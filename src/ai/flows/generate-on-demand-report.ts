'use client';

import { callAi } from '@/lib/ai-client';
import {
  GenerateOnDemandReportInput,
  GenerateOnDemandReportOutput,
  GenerateOnDemandReportInputSchema,
  GenerateOnDemandReportOutputSchema,
} from '@/ai/schemas';

export type { GenerateOnDemandReportInput, GenerateOnDemandReportOutput };
export { GenerateOnDemandReportInputSchema, GenerateOnDemandReportOutputSchema };

export async function generateOnDemandReport(
  input: GenerateOnDemandReportInput,
): Promise<GenerateOnDemandReportOutput> {
  const validatedInput = GenerateOnDemandReportInputSchema.parse(input);
  return callAi<GenerateOnDemandReportOutput>('generateOnDemandReport', validatedInput);
}
