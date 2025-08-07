import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({apiVersion: 'v1'})],
});

// Set a default model for all generate calls.
ai.configure({
  model: 'googleai/gemini-1.5-pro'
});
