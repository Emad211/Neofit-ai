import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { AiAction } from '@/ai/schemas';
import { getPlanDefinition, PlanId } from '@/lib/subscriptions';

export class QuotaExceededError extends Error {
  constructor(
    message: string,
    public readonly planId: PlanId,
    public readonly limit: number,
  ) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

const PLAN_ACTIONS = new Set<AiAction>([
  'generateWorkoutProgram',
  'generateNutritionProgram',
]);

function utcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function utcMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export async function consumeAiQuota(uid: string, action: AiAction) {
  const db = getFirestore(getFirebaseAdmin());
  const subscriptionRef = db.collection('subscriptions').doc(uid);
  const dailyUsageRef = db.collection('profiles').doc(uid).collection('usage').doc(`day-${utcDayKey()}`);
  const monthlyUsageRef = db.collection('profiles').doc(uid).collection('usage').doc(`month-${utcMonthKey()}`);

  return db.runTransaction(async (transaction) => {
    const [subscriptionSnap, dailyUsageSnap, monthlyUsageSnap] = await Promise.all([
      transaction.get(subscriptionRef),
      transaction.get(dailyUsageRef),
      transaction.get(monthlyUsageRef),
    ]);

    const subscription = subscriptionSnap.data();
    const now = Timestamp.now();
    const activeUntil = subscription?.activeUntil as Timestamp | undefined;
    const isActive = subscription?.status === 'active' && (!activeUntil || activeUntil.toMillis() > now.toMillis());
    const plan = getPlanDefinition(isActive ? subscription?.planId : 'free');

    const dailyUsage = dailyUsageSnap.data() || {};
    const monthlyUsage = monthlyUsageSnap.data() || {};
    const aiRequests = Number(dailyUsage.aiRequests || 0);
    const foodScans = Number(dailyUsage.foodScans || 0);
    const planGenerations = Number(monthlyUsage.planGenerations || 0);

    if (aiRequests >= plan.aiRequestsPerDay) {
      throw new QuotaExceededError('Daily AI request limit reached.', plan.id, plan.aiRequestsPerDay);
    }

    if (action === 'foodLookup' && foodScans >= plan.foodScansPerDay) {
      throw new QuotaExceededError('Daily food scan limit reached.', plan.id, plan.foodScansPerDay);
    }

    if (PLAN_ACTIONS.has(action) && planGenerations >= plan.planGenerationsPerMonth) {
      throw new QuotaExceededError('Monthly plan generation limit reached.', plan.id, plan.planGenerationsPerMonth);
    }

    transaction.set(dailyUsageRef, {
      aiRequests: FieldValue.increment(1),
      foodScans: action === 'foodLookup' ? FieldValue.increment(1) : FieldValue.increment(0),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    if (PLAN_ACTIONS.has(action)) {
      transaction.set(monthlyUsageRef, {
        planGenerations: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    return {
      planId: plan.id,
      remainingDailyAiRequests: Math.max(0, plan.aiRequestsPerDay - aiRequests - 1),
      remainingDailyFoodScans: Math.max(0, plan.foodScansPerDay - foodScans - (action === 'foodLookup' ? 1 : 0)),
      remainingMonthlyPlanGenerations: Math.max(0, plan.planGenerationsPerMonth - planGenerations - (PLAN_ACTIONS.has(action) ? 1 : 0)),
    };
  });
}
