
import {genkit, Genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// This prevents re-initialization during hot-reloading in development.
if (!(global as any).genkit) {
  
  (global as any).genkit = genkit({
    plugins: [googleAI({
      apiVersion: 'v1beta',
    })],
    // Let flows specify the model, as some might need different versions.
  });

  // IMPORTANT: Tools and flows are now loaded dynamically within the flows
  // themselves to prevent premature initialization of the Firebase Admin SDK.
  // Do NOT require them here.
}

export const ai: Genkit = (global as any).genkit;
