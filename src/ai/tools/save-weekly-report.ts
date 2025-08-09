/**
 * @fileOverview A Genkit tool to save the generated weekly report to Firestore.
 */
import { getFirestore, collection, addDoc, Timestamp } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Ensure Firebase is initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin SDK initialized successfully IN SAVE-WEEKLY-REPORT.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error IN SAVE-WEEKLY-REPORT:', error.message);
  }
}

export const saveWeeklyReport = ai.defineTool(
  {
    name: 'saveWeeklyReport',
    description: 'Saves the generated human-readable weekly report to the database for historical tracking.',
    inputSchema: z.object({ 
        userId: z.string(),
        analysisReport: z.string().describe("The full, human-readable text of the weekly analysis report."),
    }),
    outputSchema: z.object({
        reportId: z.string().describe("The ID of the newly saved report document."),
        status: z.string().describe("The status of the save operation."),
    }),
  },
  async ({ userId, analysisReport }) => {
    const db = getFirestore();
    console.log(`Saving weekly report for user: ${userId}`);
    
    try {
        const reportsCollectionRef = collection(db, `profiles/${userId}/weekly_reports`);
        const newReport = {
            reportDate: Timestamp.now(),
            reportText: analysisReport,
        };
        const docRef = await addDoc(reportsCollectionRef, newReport);
        
        console.log(`Report saved with ID: ${docRef.id}`);
        return {
            reportId: docRef.id,
            status: 'success',
        };
    } catch (error) {
        console.error("Error saving weekly report to Firestore:", error);
        throw new Error(`Failed to save weekly report. Details: ${error}`);
    }
  }
);
