"use client";

import * as React from "react";
import { demoNutritionPlan, demoWorkoutPlan } from "@/lib/neofit-demo-data";
import type { NutritionPlan, WorkoutPlan } from "@/lib/neofit-models";

export type DemoUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

export type UserProfile = {
  name: string;
  goal: "lose_weight" | "gain_muscle" | "improve_fitness";
  gender: "male" | "female" | "other";
  age: number;
  height: number;
  weight: number;
  bodyType: "ectomorph" | "mesomorph" | "endomorph";
  fitnessLevel: "beginner" | "intermediate" | "advanced";
  trainingDays: string;
  trainingDuration: string;
  trainingTime: string;
  lifestyle: "sedentary" | "lightly_active" | "moderately_active" | "very_active";
  sleepHours: string;
  stressLevel: "low" | "medium" | "high";
  eatingHabits?: string;
  cookingSkill: "beginner" | "intermediate" | "advanced";
  performanceGoals?: string;
  workoutLocation: "home" | "gym";
  availableEquipment?: string;
  costLevel: "low" | "medium" | "high";
  medicalHistory?: string;
  dietaryPreference?: string;
  timezone: string;
};

export type MealLog = {
  id?: string;
  logType: "meal";
  loggedAt: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  description: string;
  calories: number;
};

export type ActivityLog = {
  id?: string;
  logType: "activity";
  loggedAt: string;
  activityType: string;
  durationMinutes: number;
  intensity: "low" | "medium" | "high";
  caloriesBurned: number;
};

export type WeightLog = {
  id?: string;
  logType: "weight";
  loggedAt: string;
  weight: number;
};

export type WorkoutLog = {
  id?: string;
  logType: "workout";
  workoutId: string;
  workoutName: string;
  loggedAt: string;
  durationMinutes: number;
  totalVolume: number;
  rpe?: number;
  painScale?: number;
  notes?: string;
  exercises: Array<{
    id: string;
    name: string;
    logs: Array<{ set: number; reps: string; weight: string }>;
  }>;
};

export type CombinedLog = MealLog | ActivityLog | WeightLog | WorkoutLog;
type ShoppingListState = Record<string, boolean>;
type CheckedIngredientsState = Record<string, Record<string, boolean>>;

type PersistedState = {
  profile: UserProfile;
  nutritionPlan: NutritionPlan;
  workoutPlan: WorkoutPlan;
  shoppingListState: ShoppingListState;
  checkedIngredientsState: CheckedIngredientsState;
  loggedMealsState: string[];
  logs: CombinedLog[];
};

interface UserDataContextType {
  user: DemoUser | null;
  userProfile: UserProfile | null;
  nutritionPlan: NutritionPlan | null;
  workoutPlan: WorkoutPlan | null;
  shoppingListState: ShoppingListState | null;
  checkedIngredientsState: CheckedIngredientsState | null;
  loggedMealsState: string[] | null;
  saveUserProfile: (profile: UserProfile) => Promise<void>;
  savePlans: (plans: { nutritionPlan: NutritionPlan; workoutPlan: WorkoutPlan }) => Promise<void>;
  updateShoppingListState: (state: ShoppingListState) => Promise<void>;
  updateCheckedIngredientsState: (mealId: string, ingredientName: string, checked: boolean) => Promise<void>;
  updateLoggedMealsState: (mealIds: string[]) => Promise<void>;
  saveWorkoutLog: (log: Omit<WorkoutLog, "logType" | "loggedAt" | "id">) => Promise<void>;
  logMeal: (log: Omit<MealLog, "logType" | "loggedAt" | "id">) => Promise<void>;
  logActivity: (log: Omit<ActivityLog, "logType" | "loggedAt" | "id">) => Promise<void>;
  logWeight: (log: Omit<WeightLog, "logType" | "loggedAt" | "id">) => Promise<void>;
  updateLog: (id: string, type: CombinedLog["logType"], data: Partial<CombinedLog>) => Promise<void>;
  deleteLog: (id: string, type: CombinedLog["logType"],) => Promise<void>;
  resetUserData: () => Promise<void>;
  reauthenticateUser: (_password: string) => Promise<void>;
  updateUserAccount: (data: { displayName?: string }) => Promise<void>;
  updateUserEmail: (email: string) => Promise<void>;
  updateUserPassword: (_password: string) => Promise<void>;
  combinedLogs: CombinedLog[];
  isLoading: boolean;
}

const STORAGE_KEY = "neofit-ui-demo-v3";

const demoUser: DemoUser = {
  uid: "demo-emad",
  displayName: "عماد",
  email: "demo@neofit.local",
  photoURL: null,
};

const defaultProfile: UserProfile = {
  name: "عماد",
  goal: "lose_weight",
  gender: "male",
  age: 22,
  height: 176,
  weight: 95,
  bodyType: "endomorph",
  fitnessLevel: "intermediate",
  trainingDays: "6",
  trainingDuration: "60-90",
  trainingTime: "evening",
  lifestyle: "moderately_active",
  sleepHours: "7-8",
  stressLevel: "medium",
  eatingHabits: "غذاهای ایرانی و برنامهٔ قابل اجرا",
  cookingSkill: "intermediate",
  performanceGoals: "کاهش چربی همراه با حفظ عضله",
  workoutLocation: "gym",
  availableEquipment: "تجهیزات کامل باشگاه",
  costLevel: "medium",
  medicalHistory: "",
  dietaryPreference: "",
  timezone: "Asia/Tehran",
};

function todayAt(hour: number, minute: number) {
  const value = new Date();
  value.setHours(hour, minute, 0, 0);
  return value.toISOString();
}

const defaultLogs: CombinedLog[] = [
  { id: "meal-breakfast", logType: "meal", loggedAt: todayAt(8, 15), mealType: "breakfast", description: "تخم‌مرغ آب‌پز، نان سنگک و خیار", calories: 420 },
  { id: "activity-walk", logType: "activity", loggedAt: todayAt(10, 30), activityType: "پیاده‌روی تند", durationMinutes: 25, intensity: "medium", caloriesBurned: 150 },
  { id: "weight-today", logType: "weight", loggedAt: todayAt(7, 45), weight: 95 },
];

function createDefaultState(): PersistedState {
  return {
    profile: defaultProfile,
    nutritionPlan: demoNutritionPlan,
    workoutPlan: demoWorkoutPlan,
    shoppingListState: {},
    checkedIngredientsState: {},
    loggedMealsState: ["today-breakfast"],
    logs: defaultLogs,
  };
}

function readState(): PersistedState {
  if (typeof window === "undefined") return createDefaultState();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return createDefaultState();
  try {
    return { ...createDefaultState(), ...JSON.parse(raw) };
  } catch {
    return createDefaultState();
  }
}

const UserDataContext = React.createContext<UserDataContextType | undefined>(undefined);

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<PersistedState>(() => createDefaultState());
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setState(readState());
    setIsLoading(false);
  }, []);

  const persist = React.useCallback((next: PersistedState) => {
    setState(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const saveUserProfile = React.useCallback(async (profile: UserProfile) => persist({ ...state, profile }), [persist, state]);
  const savePlans = React.useCallback(async (plans: { nutritionPlan: NutritionPlan; workoutPlan: WorkoutPlan }) => persist({ ...state, ...plans }), [persist, state]);
  const updateShoppingListState = React.useCallback(async (shoppingListState: ShoppingListState) => persist({ ...state, shoppingListState }), [persist, state]);
  const updateCheckedIngredientsState = React.useCallback(async (mealId: string, ingredientName: string, checked: boolean) => {
    persist({ ...state, checkedIngredientsState: { ...state.checkedIngredientsState, [mealId]: { ...(state.checkedIngredientsState[mealId] || {}), [ingredientName]: checked } } });
  }, [persist, state]);
  const updateLoggedMealsState = React.useCallback(async (loggedMealsState: string[]) => persist({ ...state, loggedMealsState }), [persist, state]);

  const appendLog = React.useCallback(async (log: CombinedLog) => persist({ ...state, logs: [log, ...state.logs] }), [persist, state]);
  const saveWorkoutLog = React.useCallback(async (log: Omit<WorkoutLog, "logType" | "loggedAt" | "id">) => appendLog({ ...log, id: `workout-${Date.now()}`, logType: "workout", loggedAt: new Date().toISOString() }), [appendLog]);
  const logMeal = React.useCallback(async (log: Omit<MealLog, "logType" | "loggedAt" | "id">) => appendLog({ ...log, id: `meal-${Date.now()}`, logType: "meal", loggedAt: new Date().toISOString() }), [appendLog]);
  const logActivity = React.useCallback(async (log: Omit<ActivityLog, "logType" | "loggedAt" | "id">) => appendLog({ ...log, id: `activity-${Date.now()}`, logType: "activity", loggedAt: new Date().toISOString() }), [appendLog]);
  const logWeight = React.useCallback(async (log: Omit<WeightLog, "logType" | "loggedAt" | "id">) => {
    const nextProfile = { ...state.profile, weight: log.weight };
    persist({ ...state, profile: nextProfile, logs: [{ ...log, id: `weight-${Date.now()}`, logType: "weight", loggedAt: new Date().toISOString() }, ...state.logs] });
  }, [persist, state]);

  const updateLog = React.useCallback(async (id: string, _type: CombinedLog["logType"], data: Partial<CombinedLog>) => {
    persist({ ...state, logs: state.logs.map((log) => log.id === id ? ({ ...log, ...data } as CombinedLog) : log) });
  }, [persist, state]);
  const deleteLog = React.useCallback(async (id: string, _type: CombinedLog["logType"]) => persist({ ...state, logs: state.logs.filter((log) => log.id !== id) }), [persist, state]);
  const resetUserData = React.useCallback(async () => {
    const next = createDefaultState();
    persist(next);
  }, [persist]);
  const reauthenticateUser = React.useCallback(async (_password: string) => Promise.resolve(), []);
  const updateUserAccount = React.useCallback(async (data: { displayName?: string }) => {
    if (data.displayName) persist({ ...state, profile: { ...state.profile, name: data.displayName } });
  }, [persist, state]);
  const updateUserEmail = React.useCallback(async (_email: string) => Promise.resolve(), []);
  const updateUserPassword = React.useCallback(async (_password: string) => Promise.resolve(), []);

  const value = React.useMemo<UserDataContextType>(() => ({
    user: demoUser,
    userProfile: state.profile,
    nutritionPlan: state.nutritionPlan,
    workoutPlan: state.workoutPlan,
    shoppingListState: state.shoppingListState,
    checkedIngredientsState: state.checkedIngredientsState,
    loggedMealsState: state.loggedMealsState,
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
    combinedLogs: state.logs,
    isLoading,
  }), [state, isLoading, saveUserProfile, savePlans, updateShoppingListState, updateCheckedIngredientsState, updateLoggedMealsState, saveWorkoutLog, logMeal, logActivity, logWeight, updateLog, deleteLog, resetUserData, reauthenticateUser, updateUserAccount, updateUserEmail, updateUserPassword]);

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData() {
  const context = React.useContext(UserDataContext);
  if (!context) throw new Error("useUserData must be used within a UserDataProvider");
  return context;
}
