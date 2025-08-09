/**
 * @fileOverview This file contains tools for fetching data from Firestore for Genkit flows.
 */
import { getFirestore, collection, getDocs, query, where, orderBy, Timestamp, doc, getDoc } from 'firebase-admin/firestore';
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminApp } from '@/lib/firebase-admin';
import { startOfWeek } from 'date-fns';

export const getUserDataForWeeklyReview = ai.defineTool(
  {
    name: 'getUserDataForWeeklyReview',
    description: 'Fetches all relevant user data from the start of the current week from Firestore for a progress review. This includes profile, historical reports, and recent logs for the current planning cycle.',
    inputSchema: z.object({ userId: z.string() }),
    outputSchema: z.object({
        userProfile: z.any().describe("The user's core profile object."),
        historicalReports: z.array(z.any()).describe("An array of all past weekly reports."),
        mealLogs: z.array(z.any()).describe("An array of all meal logs from the current week."),
        activityLogs: z.array(z.any()).describe("An array of all activity logs from the current week."),
        weightLogs: z.array(z.any()).describe("An array of all weight logs from the current week."),
        workoutLogs: z.array(z.any()).describe("An array of all workout logs from the current week."),
    }),
  },
  async ({ userId }) => {
    if (!adminApp) {
        throw new Error("Firebase Admin SDK not initialized. Cannot fetch user data.");
    }
    const db = getFirestore(adminApp);
    console.log(`Fetching data for current week's review for user: ${userId}`);

    // **CORE LOGIC FIX**: Calculate the start of the current week (assuming Monday is the first day).
    // This correctly aligns the data fetching with the user's current 7-day plan cycle.
    const now = new Date();
    const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });
    const startOfCurrentWeekTimestamp = Timestamp.fromDate(startOfCurrentWeek);
    
    console.log(`Current week start timestamp: ${startOfCurrentWeekTimestamp.toDate().toISOString()}`);


    const profileRef = doc(db, `profiles/${userId}`);
    const reportsRef = collection(db, `profiles/${userId}/weekly_reports`);
    const mealLogsRef = collection(db, `profiles/${userId}/meal_logs`);
    const activityLogsRef = collection(db, `profiles/${userId}/activity_logs`);
    const weightLogsRef = collection(db, `profiles/${userId}/weight_logs`);
    const workoutLogsRef = collection(db, `profiles/${userId}/workout_logs`);

    // Helper to fetch all historical documents (like reports), sorted by date.
    const fetchAllHistorical = async (ref: FirebaseFirestore.CollectionReference, dateField: string) => {
        const q = query(ref, orderBy(dateField, 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };
    
    // Helper to fetch recent documents from the start of the current week.
    const fetchRecent = async (ref: FirebaseFirestore.CollectionReference, dateField: string) => {
        const q = query(ref, where(dateField, '>=', startOfCurrentWeekTimestamp), orderBy(dateField, 'desc'));
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
            fetchAllHistorical(reportsRef, 'reportDate'), // Reports are historical, fetch all of them.
            fetchRecent(mealLogsRef, 'loggedAt'),         // All logs should be from the current week.
            fetchRecent(activityLogsRef, 'loggedAt'),
            fetchRecent(weightLogsRef, 'loggedAt'),
            fetchRecent(workoutLogsRef, 'completedAt'), // Use the correct field 'completedAt' for workout logs.
        ]);

        const userProfile = profileSnap.exists() ? profileSnap.data() : null;

        if (!userProfile) {
            throw new Error(`User profile not found for userId: ${userId}`);
        }
        
        const fetchedData = {
            userProfile,
            historicalReports,
            mealLogs,
            activityLogs,
            weightLogs,
            workoutLogs,
        };

        // Log what was fetched for easier debugging
        console.log("Fetched meal logs for current week:", fetchedData.mealLogs.length);
        console.log("Fetched activity logs for current week:", fetchedData.activityLogs.length);
        console.log("Fetched weight logs for current week:", fetchedData.weightLogs.length);
        console.log("Fetched workout logs for current week:", fetchedData.workoutLogs.length);

        return fetchedData;

    } catch (error) {
        console.error("Error fetching user data from Firestore for weekly review:", error);
        // Re-throw a more informative error to be caught by the calling flow
        throw new Error(`Failed to fetch user data for weekly review. Details: ${error}`);
    }
  }
);
