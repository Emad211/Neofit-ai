import { z } from 'zod';

export const FoodIdentityInterpretationSchema = z.object({
  primaryQuery: z.string().trim().min(1).max(160),
  alternateQueries: z.array(z.string().trim().min(1).max(160)).max(5).default([]),
  explicitAmountText: z.string().trim().min(1).max(80).nullable().default(null),
  confidence: z.number().min(0).max(1),
  needsUserConfirmation: z.boolean().default(true),
  clarificationQuestion: z.string().trim().min(1).max(240).nullable().default(null),
  warnings: z.array(z.string().trim().min(1).max(300)).max(8).default([]),
});
export type FoodIdentityInterpretation = z.infer<typeof FoodIdentityInterpretationSchema>;

function normalized(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('fa')
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[\u200c\u200f\u202a-\u202e]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

export function buildCatalogQueries(interpretation: FoodIdentityInterpretation): string[] {
  const amount = interpretation.explicitAmountText?.trim() || '';
  const output: string[] = [];
  const seen = new Set<string>();
  for (const raw of [interpretation.primaryQuery, ...interpretation.alternateQueries]) {
    const query = raw.trim();
    if (!query) continue;
    const withAmount = amount && !normalized(query).includes(normalized(amount)) ? `${amount} ${query}` : query;
    const key = normalized(withAmount);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(withAmount);
    if (output.length >= 6) break;
  }
  return output;
}
