import { z } from 'zod';

export const VisionFoodCandidateSchema = z.object({
  label: z.string().trim().min(1).max(160),
  confidence: z.number().min(0).max(1).nullable().default(null),
  visibleComponents: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
  preparationHints: z.array(z.string().trim().min(1).max(120)).max(8).default([]),
});
export type VisionFoodCandidate = z.infer<typeof VisionFoodCandidateSchema>;

export const VisionFoodObservationSchema = z.object({
  candidates: z.array(VisionFoodCandidateSchema).min(0).max(5),
  warnings: z.array(z.string().trim().min(1).max(300)).max(10).default([]),
});
export type VisionFoodObservation = z.infer<typeof VisionFoodObservationSchema>;
