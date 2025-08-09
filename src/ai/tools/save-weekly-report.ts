/**
 * @fileOverview A Genkit tool to save the generated weekly report to Firestore.
 */
import { getFirestore, collection, addDoc, Timestamp } from 'firebase-admin/firestore';
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminApp } from '@/lib/firebase-admin';

const db = getFirestore(adminApp);

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
