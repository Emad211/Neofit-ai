
'use server';

/**
 * @fileOverview A flow that generates a daily motivational quote for a user.
 *
 * - getDailyMotivationalQuote - A function that generates a daily motivational quote for a user.
 * - DailyMotivationalQuoteInput - The input type for the getDailyMotivationalQuote function.
 * - DailyMotivationalQuoteOutput - The return type for the getDailyMotivationalQuote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DailyMotivationalQuoteInputSchema = z.object({
  userId: z.string().describe('The ID of the user to generate a quote for.'),
});
export type DailyMotivationalQuoteInput = z.infer<typeof DailyMotivationalQuoteInputSchema>;

const DailyMotivationalQuoteOutputSchema = z.object({
  quote: z.string().describe('A motivational quote personalized for the user.'),
});
export type DailyMotivationalQuoteOutput = z.infer<typeof DailyMotivationalQuoteOutputSchema>;

export async function getDailyMotivationalQuote(input: DailyMotivationalQuoteInput): Promise<DailyMotivationalQuoteOutput> {
  return dailyMotivationalQuoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dailyMotivationalQuotePrompt',
  input: {schema: DailyMotivationalQuoteInputSchema},
  output: {schema: DailyMotivationalQuoteOutputSchema},
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are a motivational coach providing daily quotes to users to keep them engaged and motivated towards their fitness goals.

  Generate a motivational quote for user with ID: {{{userId}}}. The quote should be short, personalized, and relevant to fitness and health goals.`,
});

const dailyMotivationalQuoteFlow = ai.defineFlow(
  {
    name: 'dailyMotivationalQuoteFlow',
    inputSchema: DailyMotivationalQuoteInputSchema,
    outputSchema: DailyMotivationalQuoteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
