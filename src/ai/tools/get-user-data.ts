import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

const MAX_HISTORICAL_REPORTS = 12;
const MAX_LOGS_PER_TYPE = 250;

export async function getUserDataForWeeklyReview(userId: string) {
  const db = getFirestore(getFirebaseAdmin());
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 7);
  const startIso = start.toISOString();

  const profileRef = db.collection('profiles').doc(userId);
  const plansRef = db.collection('plans').doc(userId);
  const reportsRef = profileRef.collection('weekly_reports');

  async function fetchRecent(collectionName: string) {
    const snapshot = await profileRef
      .collection(collectionName)
      .where('loggedAt', '>=', startIso)
      .orderBy('loggedAt', 'desc')
      .limit(MAX_LOGS_PER_TYPE)
      .get();
    return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
  }

  const [
    profileSnap,
    plansSnap,
    reportsSnap,
    mealLogs,
    activityLogs,
    weightLogs,
    workoutLogs,
  ] = await Promise.all([
    profileRef.get(),
    plansRef.get(),
    reportsRef.orderBy('reportDate', 'desc').limit(MAX_HISTORICAL_REPORTS).get(),
    fetchRecent('meal_logs'),
    fetchRecent('activity_logs'),
    fetchRecent('weight_logs'),
    fetchRecent('workout_logs'),
  ]);

  if (!profileSnap.exists) {
    throw new Error('User profile not found.');
  }

  const plans = plansSnap.data() || {};
  return {
    userProfile: profileSnap.data(),
    baseWorkoutPlan: plans.workoutPlan || [],
    baseNutritionPlan: plans.nutritionPlan || [],
    historicalReports: reportsSnap.docs.map((document) => ({ id: document.id, ...document.data() })),
    mealLogs,
    activityLogs,
    weightLogs,
    workoutLogs,
  };
}
