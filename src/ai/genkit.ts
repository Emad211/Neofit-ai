import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({apiVersion: 'v1'})],
  flow: {
    model: ['googleai/gemini-1.5-pro', 'googleai/gemini-1.5-flash'],
  },
});
