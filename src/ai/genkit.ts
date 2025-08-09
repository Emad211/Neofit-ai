
import {genkit, Genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import admin from 'firebase-admin';
import { getFirestore, doc, getDoc } from 'firebase-admin/firestore';


// This prevents re-initialization during hot-reloading in development.
if (!(global as any).genkit) {
  
  // Initialize Firebase Admin SDK only if it hasn't been initialized yet.
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin SDK initialized successfully in genkit.ts');
    } catch (error: any) {
      console.error('Firebase Admin SDK initialization error in genkit.ts:', error.message);
    }
  }

  (global as any).genkit = genkit({
    plugins: [googleAI({
      apiVersion: 'v1',
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
  require('@/ai/flows/generate-workout-program');
  require('@/ai/flows/generate-nutrition-program');
}

export const ai: Genkit = (global as any).genkit;
