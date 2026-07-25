import { NextResponse } from 'next/server';
import { z } from 'zod';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { AuthenticationError, requireUser } from '@/lib/server-auth';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { DailyMealPlanSchema, DailyWorkoutSchema, LocaleSchema } from '@/ai/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ProfileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  goal: z.enum(['lose_weight', 'gain_muscle', 'improve_fitness']),
  gender: z.enum(['male', 'female', 'other']),
  age: z.number().int().min(16).max(100),
  height: z.number().min(100).max(250),
  weight: z.number().min(30).max(300),
  bodyType: z.enum(['ectomorph', 'mesomorph', 'endomorph']),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  trainingDays: z.string().regex(/^[2-6]$/),
  trainingDuration: z.string().min(1).max(40),
  trainingTime: z.string().min(1).max(40),
  lifestyle: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active']),
  sleepHours: z.string().min(1).max(40),
  stressLevel: z.enum(['low', 'medium', 'high']),
  eatingHabits: z.string().max(2_000).optional(),
  dietaryPreference: z.string().max(100).optional(),
  cookingSkill: z.enum(['beginner', 'intermediate', 'advanced']),
  performanceGoals: z.string().max(500).optional(),
  workoutLocation: z.enum(['home', 'gym']),
  availableEquipment: z.string().max(1_000).optional(),
  costLevel: z.enum(['low', 'medium', 'high']),
  medicalHistory: z.string().max(2_000).optional(),
  timezone: z.string().min(1).max(100),
});

const RequestSchema = z.object({
  profile: ProfileSchema,
  locale: LocaleSchema,
  nutritionPlan: z.array(DailyMealPlanSchema).length(7),
  workoutPlan: z.array(DailyWorkoutSchema).min(2).max(6),
  summaries: z.object({
    nutrition: z.string().max(1_500),
    workout: z.string().max(1_500),
  }),
});

export async function POST(request: Request) {
  try {
    const { uid } = await requireUser(request);
    const input = RequestSchema.parse(await request.json());
    const db = getFirestore(getFirebaseAdmin());
    const profileRef = db.collection('profiles').doc(uid);
    const plansRef = db.collection('plans').doc(uid);
    const subscriptionRef = db.collection('subscriptions').doc(uid);

    await db.runTransaction(async (transaction) => {
      const subscriptionSnap = await transaction.get(subscriptionRef);
      transaction.set(profileRef, {
        ...input.profile,
        locale: input.locale,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: false });
      transaction.set(plansRef, {
        nutritionPlan: input.nutritionPlan,
        workoutPlan: input.workoutPlan,
        summaries: input.summaries,
        generatedAt: FieldValue.serverTimestamp(),
        generationSource: 'onboarding',
      }, { merge: false });

      if (!subscriptionSnap.exists) {
        transaction.set(subscriptionRef, {
          planId: 'free',
          status: 'active',
          provider: 'internal',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    });

    return NextResponse.json({ success: true }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid onboarding data.', details: error.flatten() }, { status: 400 });
    }
    console.error('Onboarding finalization failed:', error);
    return NextResponse.json({ error: 'Failed to save onboarding results.' }, { status: 500 });
  }
}
