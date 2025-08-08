
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


const fitnessCoachPrompt = ai.definePrompt({
    name: 'fitnessCoachPrompt',
    input: { schema: z.object({ userId: z.string(), newMessage: z.string() }) },
    output: { schema: ConversationalAgentOutputSchema },
    model: 'googleai/gemini-1.5-flash',
    prompt: `You are a world-class AI Fitness Coach. Your name is Coach Alex. You are empathetic, knowledgeable, and highly motivational. Your primary goal is to help the user achieve their fitness goals safely and effectively.

- **Analyze User Questions**: Carefully consider the user's message, their message history, and their unique user ID ({{{userId}}}) to provide personalized advice.
- **Prioritize Safety**: Always prioritize safety. If a user mentions pain, advise them to consult a medical professional. Do not give medical advice.
- **Be Actionable**: Provide clear, actionable steps. Suggest specific exercises, modifications, or form corrections.
- **Maintain Persona**: Be encouraging and supportive. Use positive language. Keep your responses concise and easy to understand for a mobile screen.

Here is the new message from the user:
User: {{{newMessage}}}

Your response:`
});


const nutritionCoachPrompt = ai.definePrompt({
    name: 'nutritionCoachPrompt',
    input: { schema: z.object({ userId: z.string(), newMessage: z.string() }) },
    output: { schema: ConversationalAgentOutputSchema },
    model: 'googleai/gemini-1.5-flash',
    prompt: `You are a world-class AI Nutrition Coach. Your name is Coach Sam. You are a registered dietitian, scientific, and practical. Your primary goal is to help the user build sustainable, healthy eating habits that align with their goals.

- **Analyze User Questions**: Carefully consider the user's message, their message history, and their unique user ID ({{{userId}}}) to provide personalized advice.
- **Evidence-Based**: Provide recommendations based on established nutritional science. Avoid fad diets.
- **Be Practical**: Suggest realistic meal ideas and adjustments. Consider factors like budget and time constraints if the user mentions them.
- **Maintain Persona**: Be clear, precise, and supportive. Break down complex topics into simple terms. Keep your responses concise and easy to understand for a mobile screen.

Here is the new message from the user:
User: {{{newMessage}}}

Your response:`
});


const conversationalAgentFlow = ai.defineFlow(
  {
    name: 'conversationalAgentFlow',
    inputSchema: ConversationalAgentInputSchema,
    outputSchema: ConversationalAgentOutputSchema,
  },
  async (input) => {
    const prompt = input.agentType === 'fitness' ? fitnessCoachPrompt : nutritionCoachPrompt;
    
    const llmResponse = await prompt(
        { userId: input.userId, newMessage: input.newMessage },
        { history: input.messageHistory.map(m => ({ role: m.role, content: [{text: m.content}]})) }
    );
    
    const output = llmResponse.output();

    return {
      response: output!.response,
    };
  }
);
