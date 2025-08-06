'use server';

/**
 * @fileOverview A conversational AI agent for fitness and nutrition coaching.
 *
 * - conversationalAgentFlow - A function that handles the conversation with the AI coach.
 * - ConversationalAgentInput - The input type for the conversationalAgentFlow function.
 * - ConversationalAgentOutput - The return type for the conversationalAgentFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConversationalAgentInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  agentType: z.enum(['fitness', 'nutrition']).describe('The type of AI agent (fitness or nutrition).'),
  messageHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).describe('The history of messages in the conversation.'),
  newMessage: z.string().describe('The latest message from the user.'),
});

export type ConversationalAgentInput = z.infer<typeof ConversationalAgentInputSchema>;

const ConversationalAgentOutputSchema = z.object({
  response: z.string().describe('The AI agent response to the user message.'),
});

export type ConversationalAgentOutput = z.infer<typeof ConversationalAgentOutputSchema>;

export async function conversationalAgent(input: ConversationalAgentInput): Promise<ConversationalAgentOutput> {
  return conversationalAgentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'conversationalAgentPrompt',
  input: {schema: ConversationalAgentInputSchema},
  output: {schema: ConversationalAgentOutputSchema},
  prompt: `You are an AI-powered fitness and nutrition coach. Your goal is to provide personalized guidance and answers to the user's questions in real-time.

You are a helpful, friendly, and knowledgeable coach that helps the user achieve their fitness and nutrition goals.

Agent Type: {{{agentType}}}

User ID: {{{userId}}}

Message History:
{{#each messageHistory}}
  {{role}}: {{{content}}}
{{/each}}

New Message: {{{newMessage}}}

Response:`,
});

const conversationalAgentFlow = ai.defineFlow(
  {
    name: 'conversationalAgentFlow',
    inputSchema: ConversationalAgentInputSchema,
    outputSchema: ConversationalAgentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      response: output!.response,
    };
  }
);
