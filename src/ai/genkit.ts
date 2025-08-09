
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
      // The API key is now determined dynamically based on the user's profile.
      // We pass the userId in the flow's input, and use this function
      // to retrieve their key from Firestore.
      apiKey: async (flow) => {
        // Use 'any' for input to accommodate different flow input schemas
        const userId = (flow.input as any)?.userId;
        if (!userId) {
          // Fallback to environment variable if no user context is provided
          return process.env.GEMINI_API_KEY || '';
        }
        try {
          const db = getFirestore();
          const profileRef = doc(db, 'profiles', userId);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            // Use the user's key if it exists, otherwise fallback to the global key
            return profileData.geminiApiKey || process.env.GEMINI_API_KEY || '';
          }
        } catch (error) {
           console.error(`Failed to retrieve API key for user ${userId}:`, error);
        }
        // Fallback if user profile or key is not found
        return process.env.GEMINI_API_KEY || '';
      }
    })],
    // Set a default model for all generate calls directly in the main config.
    // NOTE: Individual prompts can and should override this for clarity.
    model: 'googleai/gemini-1.5-flash',
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
