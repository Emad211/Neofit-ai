/**
 * @fileOverview This file contains tools for fetching data from Firestore for Genkit flows.
 */
import { getFirestore, collection, getDocs, query, where, orderBy, limit,Timestamp, doc, getDoc } from 'firebase-admin/firestore';
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminApp } from '@/lib/firebase-admin';

export const getUserDataForWeeklyReview = ai.defineTool(
  {
    name: 'getUserDataForWeeklyReview',
    description: 'Fetches all relevant user data from the last 7 days from Firestore for a weekly review. This includes profile, historical reports, and recent logs.',
    inputSchema: z.object({ userId: z.string() }),
    outputSchema: z.object({
        userProfile: z.any().describe("The user's core profile object."),
        historicalReports: z.array(z.any()).describe("An array of all past weekly reports."),
        mealLogs: z.array(z.any()).describe("An array of all meal logs from the last 7 days."),
        activityLogs: z.array(z.any()).describe("An array of all activity logs from the last 7 days."),
        weightLogs: z.array(z.any()).describe("An array of all weight logs from the last 7 days."),
        workoutLogs: z.array(z.any()).describe("An array of all workout logs from the last 7 days."),
    }),
  },
  async ({ userId }) => {
    if (!adminApp) {
        throw new Error("Firebase Admin SDK not initialized. Cannot fetch user data.");
    }
    const db = getFirestore(adminApp);
    console.log(`Fetching all data for user weekly review: ${userId}`);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

    const profileRef = doc(db, `profiles/${userId}`);
    const reportsRef = collection(db, `profiles/${userId}/weekly_reports`);
    const mealLogsRef = collection(db, `profiles/${userId}/meal_logs`);
    const activityLogsRef = collection(db, `profiles/${userId}/activity_logs`);
    const weightLogsRef = collection(db, `profiles/${userId}/weight_logs`);
    const workoutLogsRef = collection(db, `profiles/${userId}/workout_logs`);

    // Helper to fetch collections.
    // Fetches all documents sorted by a date field.
    const fetchAllHistorical = async (ref: FirebaseFirestore.CollectionReference, dateField: string) => {
        const q = query(ref, orderBy(dateField, 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };
    
    // Helper to fetch recent documents from the last 7 days.
    const fetchRecent = async (ref: FirebaseFirestore.CollectionReference, dateField: string) => {
        const q = query(ref, where(dateField, '>=', sevenDaysAgoTimestamp), orderBy(dateField, 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };
    
    try {
        const [
            profileSnap,
            historicalReports,
            mealLogs,
            activityLogs,
            weightLogs,
            workoutLogs
        ] = await Promise.all([
            getDoc(profileRef),
            fetchAllHistorical(reportsRef, 'reportDate'),
            fetchRecent(mealLogsRef, 'loggedAt'),
            fetchRecent(activityLogsRef, 'loggedAt'),
            fetchRecent(weightLogsRef, 'loggedAt'),
            fetchRecent(workoutLogsRef, 'completedAt'), // Correctly query workout logs by 'completedAt'
        ]);

        const userProfile = profileSnap.exists() ? profileSnap.data() : null;

        if (!userProfile) {
            throw new Error(`User profile not found for userId: ${userId}`);
        }
        
        return {
            userProfile,
            historicalReports,
            mealLogs,
            activityLogs,
            weightLogs,
            workoutLogs,
        };

    } catch (error) {
        console.error("Error fetching user data from Firestore:", error);
        // Re-throw the error to be caught by the calling flow
        throw new Error(`Failed to fetch user data for weekly review. Details: ${error}`);
    }
  }
);
