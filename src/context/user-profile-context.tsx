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
  deleteLog: (id: string, type: CombinedLog["logType"]) => Promise<void>;
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
  {
    id: "demo-breakfast",
    logType: "meal",
    loggedAt: todayAt(8, 30),
    mealType: "breakfast",
    description: "دو عدد تخم‌مرغ آب‌پز",
    calories: 156,
  },
  {
    id: "demo-lunch",
    logType: "meal",
    loggedAt: todayAt(13, 45),
    mealType: "lunch",
    description: "قورمه‌سبزی با چلو",
    calories: 710,
  },
];

const initialState: PersistedState = {
  profile: defaultProfile,
  nutritionPlan: demoNutritionPlan,
  workoutPlan: demoWorkoutPlan,
  shoppingListState: {},
  checkedIngredientsState: {},
  loggedMealsState: ["today-breakfast", "today-lunch"],
  logs: defaultLogs,
};

const UserDataContext = React.createContext<UserDataContextType | undefined>(undefined);

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<DemoUser>(demoUser);
  const [state, setState] = React.useState<PersistedState>(initialState);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setState({ ...initialState, ...JSON.parse(saved) });
    } catch (error) {
      console.warn("NeoFit demo state could not be restored", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isLoading) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, isLoading]);

  const addLog = React.useCallback((log: CombinedLog) => {
    setState((current) => ({ ...current, logs: [log, ...current.logs] }));
  }, []);

  const value = React.useMemo<UserDataContextType>(() => ({
    user,
    userProfile: state.profile,
    nutritionPlan: state.nutritionPlan,
    workoutPlan: state.workoutPlan,
    shoppingListState: state.shoppingListState,
    checkedIngredientsState: state.checkedIngredientsState,
    loggedMealsState: state.loggedMealsState,
    combinedLogs: state.logs,
    isLoading,
    saveUserProfile: async (profile) => setState((current) => ({ ...current, profile })),
    savePlans: async ({ nutritionPlan, workoutPlan }) => setState((current) => ({ ...current, nutritionPlan, workoutPlan })),
    updateShoppingListState: async (shoppingListState) => setState((current) => ({ ...current, shoppingListState })),
    updateCheckedIngredientsState: async (mealId, ingredientName, checked) => setState((current) => ({
      ...current,
      checkedIngredientsState: {
        ...current.checkedIngredientsState,
        [mealId]: { ...current.checkedIngredientsState[mealId], [ingredientName]: checked },
      },
    })),
    updateLoggedMealsState: async (loggedMealsState) => setState((current) => ({ ...current, loggedMealsState })),
    logMeal: async (log) => addLog({ ...log, id: makeId("meal"), logType: "meal", loggedAt: new Date().toISOString() }),
    logActivity: async (log) => addLog({ ...log, id: makeId("activity"), logType: "activity", loggedAt: new Date().toISOString() }),
    logWeight: async (log) => addLog({ ...log, id: makeId("weight"), logType: "weight", loggedAt: new Date().toISOString() }),
    saveWorkoutLog: async (log) => addLog({ ...log, id: makeId("workout"), logType: "workout", loggedAt: new Date().toISOString() }),
    updateLog: async (id, type, data) => setState((current) => ({
      ...current,
      logs: current.logs.map((log) => log.id === id && log.logType === type ? ({ ...log, ...data } as CombinedLog) : log),
    })),
    deleteLog: async (id, type) => setState((current) => ({ ...current, logs: current.logs.filter((log) => !(log.id === id && log.logType === type)) })),
    resetUserData: async () => {
      window.localStorage.removeItem(STORAGE_KEY);
      setState(initialState);
      setUser(demoUser);
    },
    reauthenticateUser: async () => undefined,
    updateUserAccount: async ({ displayName }) => {
      if (!displayName) return;
      setUser((current) => ({ ...current, displayName }));
      setState((current) => ({ ...current, profile: { ...current.profile, name: displayName } }));
    },
    updateUserEmail: async (email) => setUser((current) => ({ ...current, email })),
    updateUserPassword: async () => undefined,
  }), [addLog, isLoading, state, user]);

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData() {
  const context = React.useContext(UserDataContext);
  if (!context) throw new Error("useUserData must be used inside UserDataProvider");
  return context;
}
