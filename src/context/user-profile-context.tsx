'use client';

import * as React from 'react';
import { z } from 'zod';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  EmailAuthProvider,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  updateProfile,
  User,
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import type { GenerateNutritionProgramOutput, GenerateWorkoutProgramOutput } from '@/ai/schemas';

const db = getFirestore(app);
const auth = getAuth(app);

export const UserProfileSchema = z.object({
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
  locale: z.enum(['en', 'fa']).optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

type NutritionPlan = GenerateNutritionProgramOutput['weeklyMealPlan'];
type WorkoutPlan = GenerateWorkoutProgramOutput['weeklyWorkoutPlan'];
type ShoppingListState = Record<string, boolean>;
type CheckedIngredientsState = Record<string, Record<string, boolean>>;
type LoggedMealsState = { date: string; mealIds: string[] };

export type MealLog = {
  id?: string;
  logType: 'meal';
  loggedAt: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  calories: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
};

export type ActivityLog = {
  id?: string;
  logType: 'activity';
  loggedAt: string;
  activityType: string;
  durationMinutes: number;
  intensity: 'low' | 'medium' | 'high';
  caloriesBurned: number;
};

export type WeightLog = {
  id?: string;
  logType: 'weight';
  loggedAt: string;
  weight: number;
};

export type WorkoutLog = {
  id?: string;
  logType: 'workout';
  workoutId: string;
  workoutName: string;
  loggedAt: string;
  durationMinutes: number;
  totalVolume: number;
  exercises: Array<{
    id: string;
    name: string;
    logs: Array<{ set: number; reps: string; weight: string }>;
  }>;
};

export type CombinedLog = MealLog | ActivityLog | WeightLog | WorkoutLog;

type UserDataContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  nutritionPlan: NutritionPlan | null;
  workoutPlan: WorkoutPlan | null;
  shoppingListState: ShoppingListState | null;
  checkedIngredientsState: CheckedIngredientsState | null;
  loggedMealsState: string[] | null;
  saveUserProfile: (profileData: UserProfile) => Promise<void>;
  savePlans: (plans: { nutritionPlan: NutritionPlan; workoutPlan: WorkoutPlan }) => Promise<void>;
  updateShoppingListState: (state: ShoppingListState) => Promise<void>;
  updateCheckedIngredientsState: (mealId: string, ingredientName: string, isChecked: boolean) => Promise<void>;
  updateLoggedMealsState: (mealIds: string[]) => Promise<void>;
  saveWorkoutLog: (data: Omit<WorkoutLog, 'logType' | 'loggedAt' | 'id'>) => Promise<void>;
  logMeal: (data: Omit<MealLog, 'logType' | 'loggedAt' | 'id'>) => Promise<void>;
  logActivity: (data: Omit<ActivityLog, 'logType' | 'loggedAt' | 'id'>) => Promise<void>;
  logWeight: (data: Omit<WeightLog, 'logType' | 'loggedAt' | 'id'>) => Promise<void>;
  updateLog: (logId: string, logType: CombinedLog['logType'], data: Partial<CombinedLog>) => Promise<void>;
  deleteLog: (logId: string, logType: CombinedLog['logType']) => Promise<void>;
  resetUserData: () => Promise<void>;
  reauthenticateUser: (password: string) => Promise<void>;
  updateUserAccount: (data: { displayName?: string }) => Promise<void>;
  updateUserEmail: (newEmail: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  combinedLogs: CombinedLog[];
  isLoading: boolean;
};

const UserDataContext = React.createContext<UserDataContextType | undefined>(undefined);

const logTypeToCollectionName = {
  meal: 'meal_logs',
  activity: 'activity_logs',
  weight: 'weight_logs',
  workout: 'workout_logs',
} as const;

function localDayKey(date: Date, timeZone?: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function normalizeTimestamp(value: unknown) {
  if (typeof value === 'string') return value;
  if (
    value
    && typeof value === 'object'
    && 'toDate' in value
    && typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date(0).toISOString();
}

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [nutritionPlan, setNutritionPlan] = React.useState<NutritionPlan | null>(null);
  const [workoutPlan, setWorkoutPlan] = React.useState<WorkoutPlan | null>(null);
  const [shoppingListState, setShoppingListState] = React.useState<ShoppingListState | null>(null);
  const [checkedIngredientsState, setCheckedIngredientsState] = React.useState<CheckedIngredientsState | null>(null);
  const [loggedMealsState, setLoggedMealsState] = React.useState<string[] | null>(null);
  const [combinedLogs, setCombinedLogs] = React.useState<CombinedLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => onAuthStateChanged(auth, (firebaseUser) => {
    setIsLoading(true);
    setUser(firebaseUser);
    if (!firebaseUser) {
      setUserProfile(null);
      setNutritionPlan(null);
      setWorkoutPlan(null);
      setShoppingListState(null);
      setCheckedIngredientsState(null);
      setLoggedMealsState(null);
      setCombinedLogs([]);
      setIsLoading(false);
    }
  }), []);

  React.useEffect(() => {
    if (!user) return;

    let profileLoaded = false;
    let plansLoaded = false;
    const loadedLogs = new Set<string>();
    const markReady = () => {
      if (profileLoaded && plansLoaded && loadedLogs.size === Object.keys(logTypeToCollectionName).length) {
        setIsLoading(false);
      }
    };

    const profileRef = doc(db, 'profiles', user.uid);
    const plansRef = doc(db, 'plans', user.uid);

    const unsubProfile = onSnapshot(profileRef, (snapshot) => {
      if (!snapshot.exists()) {
        setUserProfile(null);
      } else {
        const parsed = UserProfileSchema.safeParse(snapshot.data());
        setUserProfile(parsed.success ? parsed.data : null);
        if (!parsed.success) console.error('Invalid profile data:', parsed.error.flatten());
      }
      profileLoaded = true;
      markReady();
    }, (error) => {
      console.error('Profile listener failed:', error);
      profileLoaded = true;
      markReady();
    });

    const unsubPlans = onSnapshot(plansRef, (snapshot) => {
      const data = snapshot.data();
      if (data) {
        setNutritionPlan(Array.isArray(data.nutritionPlan) ? data.nutritionPlan : null);
        setWorkoutPlan(Array.isArray(data.workoutPlan) ? data.workoutPlan : null);
        setShoppingListState(data.shoppingListState || null);
        setCheckedIngredientsState(data.checkedIngredientsState || null);
        const stored = data.loggedMealsState as LoggedMealsState | undefined;
        setLoggedMealsState(stored?.date === localDayKey(new Date(), userProfile?.timezone) ? stored.mealIds : []);
      } else {
        setNutritionPlan(null);
        setWorkoutPlan(null);
        setShoppingListState(null);
        setCheckedIngredientsState(null);
        setLoggedMealsState([]);
      }
      plansLoaded = true;
      markReady();
    }, (error) => {
      console.error('Plans listener failed:', error);
      plansLoaded = true;
      markReady();
    });

    const logUnsubscribers = Object.entries(logTypeToCollectionName).map(([logType, collectionName]) => {
      const logsQuery = query(collection(db, 'profiles', user.uid, collectionName), orderBy('loggedAt', 'desc'));
      return onSnapshot(logsQuery, (snapshot) => {
        const logs = snapshot.docs.map((document) => ({
          id: document.id,
          logType,
          ...document.data(),
          loggedAt: normalizeTimestamp(document.data().loggedAt),
        } as CombinedLog));
        setCombinedLogs((current) => [
          ...current.filter((log) => log.logType !== logType),
          ...logs,
        ].sort((a, b) => Date.parse(b.loggedAt) - Date.parse(a.loggedAt)));
        loadedLogs.add(logType);
        markReady();
      }, (error) => {
        console.error(`Log listener failed for ${collectionName}:`, error);
        loadedLogs.add(logType);
        markReady();
      });
    });

    return () => {
      unsubProfile();
      unsubPlans();
      logUnsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [user, userProfile?.timezone]);

  const saveUserProfile = React.useCallback(async (profileData: UserProfile) => {
    if (!user) throw new Error('No signed-in user.');
    const validated = UserProfileSchema.parse(profileData);
    await setDoc(doc(db, 'profiles', user.uid), validated, { merge: true });
  }, [user]);

  const savePlans = React.useCallback(async (plans: { nutritionPlan: NutritionPlan; workoutPlan: WorkoutPlan }) => {
    if (!user) throw new Error('No signed-in user.');
    await setDoc(doc(db, 'plans', user.uid), {
      ...plans,
      generatedAt: new Date().toISOString(),
      generationSource: 'onboarding',
    }, { merge: true });
  }, [user]);

  const updateShoppingListState = React.useCallback(async (state: ShoppingListState) => {
    if (!user) throw new Error('No signed-in user.');
    await setDoc(doc(db, 'plans', user.uid), { shoppingListState: state }, { merge: true });
  }, [user]);

  const updateCheckedIngredientsState = React.useCallback(async (mealId: string, ingredientName: string, isChecked: boolean) => {
    if (!user) throw new Error('No signed-in user.');
    const next = { ...(checkedIngredientsState || {}) };
    next[mealId] = { ...(next[mealId] || {}), [ingredientName]: isChecked };
    await setDoc(doc(db, 'plans', user.uid), { checkedIngredientsState: next }, { merge: true });
  }, [user, checkedIngredientsState]);

  const updateLoggedMealsState = React.useCallback(async (mealIds: string[]) => {
    if (!user) throw new Error('No signed-in user.');
    const state: LoggedMealsState = { date: localDayKey(new Date(), userProfile?.timezone), mealIds };
    await setDoc(doc(db, 'plans', user.uid), { loggedMealsState: state }, { merge: true });
  }, [user, userProfile?.timezone]);

  const logGeneric = React.useCallback(async (collectionName: string, logData: object) => {
    if (!user) throw new Error('No signed-in user.');
    await addDoc(collection(db, 'profiles', user.uid, collectionName), {
      ...logData,
      loggedAt: new Date().toISOString(),
    });
  }, [user]);

  const logMeal = React.useCallback((data: Omit<MealLog, 'logType' | 'loggedAt' | 'id'>) => logGeneric('meal_logs', data), [logGeneric]);
  const logActivity = React.useCallback((data: Omit<ActivityLog, 'logType' | 'loggedAt' | 'id'>) => logGeneric('activity_logs', data), [logGeneric]);
  const logWeight = React.useCallback((data: Omit<WeightLog, 'logType' | 'loggedAt' | 'id'>) => logGeneric('weight_logs', data), [logGeneric]);
  const saveWorkoutLog = React.useCallback((data: Omit<WorkoutLog, 'logType' | 'loggedAt' | 'id'>) => logGeneric('workout_logs', data), [logGeneric]);

  const updateLog = React.useCallback(async (logId: string, logType: CombinedLog['logType'], data: Partial<CombinedLog>) => {
    if (!user) throw new Error('No signed-in user.');
    await updateDoc(doc(db, 'profiles', user.uid, logTypeToCollectionName[logType], logId), data as Record<string, unknown>);
  }, [user]);

  const deleteLog = React.useCallback(async (logId: string, logType: CombinedLog['logType']) => {
    if (!user) throw new Error('No signed-in user.');
    await deleteDoc(doc(db, 'profiles', user.uid, logTypeToCollectionName[logType], logId));
  }, [user]);

  const resetUserData = React.useCallback(async () => {
    if (!user) throw new Error('No signed-in user.');
    const token = await user.getIdToken();
    const response = await fetch('/api/account/reset-profile', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to delete profile data.');
  }, [user]);

  const reauthenticateUser = React.useCallback(async (password: string) => {
    if (!user?.email) throw new Error('User email is unavailable.');
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  }, [user]);

  const updateUserAccount = React.useCallback(async (data: { displayName?: string }) => {
    if (!user) throw new Error('No signed-in user.');
    await updateProfile(user, data);
    await user.reload();
    setUser(auth.currentUser);
  }, [user]);

  const updateUserEmail = React.useCallback(async (newEmail: string) => {
    if (!user) throw new Error('No signed-in user.');
    await updateEmail(user, newEmail);
    await user.reload();
    setUser(auth.currentUser);
  }, [user]);

  const updateUserPassword = React.useCallback(async (newPassword: string) => {
    if (!user) throw new Error('No signed-in user.');
    await updatePassword(user, newPassword);
  }, [user]);

  const value = React.useMemo<UserDataContextType>(() => ({
    user,
    userProfile,
    nutritionPlan,
    workoutPlan,
    shoppingListState,
    checkedIngredientsState,
    loggedMealsState,
    saveUserProfile,
    savePlans,
    updateShoppingListState,
    updateCheckedIngredientsState,
    updateLoggedMealsState,
    saveWorkoutLog,
    logMeal,
    logActivity,
    logWeight,
    updateLog,
    deleteLog,
    resetUserData,
    reauthenticateUser,
    updateUserAccount,
    updateUserEmail,
    updateUserPassword,
    combinedLogs,
    isLoading,
  }), [
    user,
    userProfile,
    nutritionPlan,
    workoutPlan,
    shoppingListState,
    checkedIngredientsState,
    loggedMealsState,
    saveUserProfile,
    savePlans,
    updateShoppingListState,
    updateCheckedIngredientsState,
    updateLoggedMealsState,
    saveWorkoutLog,
    logMeal,
    logActivity,
    logWeight,
    updateLog,
    deleteLog,
    resetUserData,
    reauthenticateUser,
    updateUserAccount,
    updateUserEmail,
    updateUserPassword,
    combinedLogs,
    isLoading,
  ]);

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData() {
  const context = React.useContext(UserDataContext);
  if (!context) throw new Error('useUserData must be used within UserDataProvider.');
  return context;
}
