
import {genkit, Genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { adminApp } from '@/lib/firebase-admin';
import { getFirestore, doc, getDoc } from 'firebase-admin/firestore';

// This prevents re-initialization during hot-reloading in development.
if (!(global as any).genkit) {
  
  (global as any).genkit = genkit({
    plugins: [googleAI({
      apiVersion: 'v1beta',
    })],
    // Let flows specify the model, as some might need different versions.
  });

  // Import all flows and tools here to register them with the initialized Genkit instance.
  require('@/ai/tools/get-user-data');
  require('@/ai/tools/save-weekly-report');
  require('@/ai/flows/get-alternative-exercise.ts');
  require('@/ai/flows/dynamic-program-adaptation.ts');
  require('@/ai/flows/generate-on-demand-report.ts');
  require('@/ai/flows/suggest-meal-alternative.ts');
  require('@/ai/flows/calculate-activity-calories.ts');
  require('@/ai/flows/food-lookup.ts');
  require('@/ai/flows/generate-recipe.ts');
  // Note: We don't require the tool-defining files directly anymore
  // to prevent circular dependencies. They are loaded at runtime
  // by the flows that need them.
}

export const ai: Genkit = (global as any).genkit;
