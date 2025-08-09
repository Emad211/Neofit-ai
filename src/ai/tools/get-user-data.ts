/**
 * @fileOverview This file contains tools for fetching data from Firestore for Genkit flows.
 */
import { getFirestore } from 'firebase-admin/firestore';
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { startOfWeek, endOfWeek } from 'date-fns';

export const getUserDataForWeeklyReview = ai.defineTool(
  {
    name: 'getUserDataForWeeklyReview',
    description: 'Fetches all relevant user data from the start of the current week from Firestore for a progress review. This includes profile, historical reports, current plans, and recent logs for the current planning cycle.',
    inputSchema: z.object({ userId: z.string() }),
    outputSchema: z.object({
        userProfile: z.any().describe("The user's core profile object."),
        baseWorkoutPlan: z.any().describe("The user's current workout plan for the week."),
        baseNutritionPlan: z.any().describe("The user's current nutrition plan for the week."),
        historicalReports: z.array(z.any()).describe("An array of all past weekly reports."),
        mealLogs: z.array(z.any()).describe("An array of all meal logs from the current week."),
        activityLogs: z.array(z.any()).describe("An array of all activity logs from the current week."),
        weightLogs: z.array(z.any()).describe("An array of all weight logs from the current week."),
        workoutLogs: z.array(z.any()).describe("An array of all workout logs from the current week."),
    }),
  },
  async ({ userId }) => {
    // Ensure Firebase is initialized before proceeding
    const adminApp = getFirebaseAdmin();
    const db = getFirestore(adminApp);
    
    console.log(`Fetching data for current week's review for user: ${userId}`);

    // Calculate the start of the current week (assuming Monday is the first day).
    const now = new Date();
    const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });
    const startOfCurrentWeekISO = startOfCurrentWeek.toISOString();
    
    console.log(`Current week start ISO string: ${startOfCurrentWeekISO}`);


    const profileRef = db.collection('profiles').doc(userId);
    const plansRef = db.collection('plans').doc(userId); // NEW: Reference to the plans document
    const reportsRef = db.collection(`profiles/${userId}/weekly_reports`);
    const mealLogsRef = db.collection(`profiles/${userId}/meal_logs`);
    const activityLogsRef = db.collection(`profiles/${userId}/activity_logs`);
    const weightLogsRef = db.collection(`profiles/${userId}/weight_logs`);
    const workoutLogsRef = db.collection(`profiles/${userId}/workout_logs`);

    // Helper to fetch all historical documents (like reports), sorted by date.
    const fetchAllHistorical = async (ref: FirebaseFirestore.CollectionReference) => {
        const q = ref.orderBy('reportDate', 'desc');
        const snapshot = await q.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };
    
    // Helper to fetch recent documents from the start of the current week using an ISO string.
    const fetchRecent = async (ref: FirebaseFirestore.CollectionReference) => {
        const q = ref.where('loggedAt', '>=', startOfCurrentWeekISO).orderBy('loggedAt', 'desc');
        const snapshot = await q.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    };
    
    try {
        const [
            profileSnap,
            plansSnap, // NEW: Fetch the plans document
            historicalReports,
            mealLogs,
            activityLogs,
            weightLogs,
            workoutLogs
        ] = await Promise.all([
            profileRef.get(),
            plansRef.get(), // NEW
            fetchAllHistorical(reportsRef),
            fetchRecent(mealLogsRef),
            fetchRecent(activityLogsRef),
            fetchRecent(weightLogsRef),
            fetchRecent(workoutLogsRef),
        ]);

        const userProfile = profileSnap.exists ? profileSnap.data() : null;
        const plansData = plansSnap.exists ? plansSnap.data() : { workoutPlan: null, nutritionPlan: null };


        if (!userProfile) {
            throw new Error(`User profile not found for userId: ${userId}`);
        }
        
        const fetchedData = {
            userProfile,
            baseWorkoutPlan: plansData?.workoutPlan || [], // NEW
            baseNutritionPlan: plansData?.nutritionPlan || [], // NEW
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
        console.log("Fetched base workout plan:", !!fetchedData.baseWorkoutPlan);
        console.log("Fetched base nutrition plan:", !!fetchedData.baseNutritionPlan);


        return fetchedData;

    } catch (error) {
        console.error("Error fetching user data from Firestore for weekly review:", error);
        // Re-throw a more informative error to be caught by the calling flow
        throw new Error(`Failed to fetch user data for weekly review. Details: ${error}`);
    }
  }
);
