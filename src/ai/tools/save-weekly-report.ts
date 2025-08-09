/**
 * @fileOverview A Genkit tool to save the generated weekly report to Firestore.
 */
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

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
    // Ensure Firebase is initialized before proceeding
    const adminApp = getFirebaseAdmin();
    const db = getFirestore(adminApp);

    console.log(`Saving weekly report for user: ${userId}`);
    
    try {
        const reportsCollectionRef = db.collection(`profiles/${userId}/weekly_reports`);
        const newReport = {
            reportDate: Timestamp.now(),
            reportText: analysisReport,
        };
        const docRef = await reportsCollectionRef.add(newReport);
        
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
