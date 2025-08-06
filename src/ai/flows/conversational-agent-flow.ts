'use server';
/**
 * @fileOverview This file defines the conversational agent flow for the NeoFit AI application.
 *
 * - conversationalAgentFlow - A function that handles the conversational flow with the AI agent.
 * - ConversationalAgentInput - The input type for the conversationalAgentFlow function.
 * - ConversationalAgentOutput - The return type for the conversationalAgentFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConversationalAgentInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  agentType: z.string().describe('The type of AI agent (e.g., fitness, nutrition).'),
  messageHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).describe('The conversation history between the user and the agent.'),
  newMessage: z.string().describe('The latest message from the user.'),
});
export type ConversationalAgentInput = z.infer<typeof ConversationalAgentInputSchema>;

const ConversationalAgentOutputSchema = z.object({
  response: z.string().describe('The AI agent response to the user message.'),
});
export type ConversationalAgentOutput = z.infer<typeof ConversationalAgentOutputSchema>;

export async function conversationalAgentFlow(
    input: ConversationalAgentInput
): Promise<ConversationalAgentOutput> {
  return conversationalAgent(input);
}

const prompt = ai.definePrompt({
  name: 'conversationalAgentPrompt',
  input: {
    schema: ConversationalAgentInputSchema,
  },
  output: {
    schema: ConversationalAgentOutputSchema,
  },
  prompt: `You are an AI expert specializing in {{{agentType}}}. Use the conversation history and the latest user message to provide a personalized and helpful response.

Conversation History:
{{#each messageHistory}}
  {{role}}: {{content}}
{{/each}}

New Message: {{{newMessage}}}

Response:`,
});

const conversationalAgent = ai.defineFlow(
  {
    name: 'conversationalAgentFlow',
    inputSchema: ConversationalAgentInputSchema,
    outputSchema: ConversationalAgentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
