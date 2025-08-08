
import {genkit, Genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// This prevents re-initialization during hot-reloading in development.
if (!(global as any).genkit) {
  (global as any).genkit = genkit({
    plugins: [googleAI({apiVersion: 'v1'})],
    // Set a default model for all generate calls directly in the main config.
    model: 'googleai/gemini-1.5-flash',
  });
}

export const ai: Genkit = (global as any).genkit;
