
import { config } from 'dotenv';
config();

import '@/lib/firebase-admin'; // Ensures Firebase Admin is initialized first

import '@/ai/flows/get-alternative-exercise.ts';
// import '@/ai/flows/onboarding-analysis.ts'; // This seems to be deprecated or not in use
import '@/ai/flows/dynamic-program-adaptation.ts';
import '@/ai/flows/suggest-meal-alternative.ts';
import '@/ai/flows/calculate-activity-calories.ts';
import '@/ai/flows/food-lookup.ts';
import '@/ai/flows/generate-recipe.ts';
import '@/ai/flows/generate-workout-program';
import '@/ai/flows/generate-nutrition-program';
import '@/ai/tools/get-user-data';
import '@/ai/tools/save-weekly-report';
