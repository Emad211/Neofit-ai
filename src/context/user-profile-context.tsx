"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

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
  geminiApiKey?: string;
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
  exercises: { id: string; name: string; logs: { set: number; reps: string; weight: string }[] }[];
};

export type CombinedLog = MealLog | ActivityLog | WeightLog | WorkoutLog;

type ShoppingListState = Record<string, boolean>;
type CheckedIngredientsState = Record<string, Record<string, boolean>>;
type DemoUser = {
  uid: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  photoURL: string | null;
};

type UserDataContextType = {
  user: DemoUser | null;
  userProfile: UserProfile | null;
  nutritionPlan: any[] | null;
  workoutPlan: any[] | null;
  shoppingListState: ShoppingListState | null;
  checkedIngredientsState: CheckedIngredientsState | null;
  loggedMealsState: string[] | null;
  saveUserProfile: (profile: UserProfile) => Promise<void>;
  savePlans: (plans: { nutritionPlan: any[]; workoutPlan: any[] }) => Promise<void>;
  updateShoppingListState: (state: ShoppingListState) => Promise<void>;
  updateCheckedIngredientsState: (mealId: string, ingredientName: string, isChecked: boolean) => Promise<void>;
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
};

const now = new Date();
const atToday = (hour: number) => {
  const value = new Date(now);
  value.setHours(hour, 0, 0, 0);
  return value.toISOString();
};

const demoProfile: UserProfile = {
  name: "عماد",
  goal: "lose_weight",
  gender: "male",
  age: 22,
  height: 176,
  weight: 95,
  bodyType: "endomorph",
  fitnessLevel: "intermediate",
  trainingDays: "6",
  trainingDuration: "90",
  trainingTime: "evening",
  lifestyle: "moderately_active",
  sleepHours: "7",
  stressLevel: "medium",
  eatingHabits: "برنامه غذایی ایرانی و قابل اجرا",
  cookingSkill: "intermediate",
  performanceGoals: "کاهش چربی با حفظ عضله",
  workoutLocation: "gym",
  availableEquipment: "باشگاه کامل",
  costLevel: "medium",
  dietaryPreference: "بدون محدودیت خاص",
  timezone: "Asia/Tehran",
};

const demoNutritionPlan = [
  {
    day: "امروز",
    totalCalories: 2200,
    meals: [
      { type: "صبحانه", name: "تخم‌مرغ آب‌پز و نان سنگک", calories: 420, ingredients: [{ name: "تخم‌مرغ", quantity: "۲ عدد", category: "protein" }, { name: "نان سنگک", quantity: "۱ کف دست", category: "carb" }] },
      { type: "ناهار", name: "قورمه‌سبزی با چلو", calories: 710, ingredients: [{ name: "قورمه‌سبزی", quantity: "۱ پرس", category: "main" }, { name: "چلو", quantity: "۱ سهم", category: "carb" }] },
      { type: "شام", name: "جوجه‌کباب و سبزیجات", calories: 560, ingredients: [{ name: "جوجه‌کباب", quantity: "۱۸۰ گرم", category: "protein" }, { name: "سبزیجات", quantity: "۱ بشقاب", category: "vegetable" }] },
    ],
  },
  {
    day: "فردا",
    totalCalories: 2150,
    meals: [
      { type: "صبحانه", name: "اوتمیل با شیر و موز", calories: 430, ingredients: [{ name: "جو دوسر", quantity: "۶۰ گرم", category: "carb" }] },
      { type: "ناهار", name: "چلوکباب کوبیده", calories: 780, ingredients: [{ name: "کباب کوبیده", quantity: "۲ سیخ", category: "protein" }] },
      { type: "شام", name: "آش رشته سبک", calories: 480, ingredients: [{ name: "آش رشته", quantity: "۱ کاسه", category: "main" }] },
    ],
  },
  {
    day: "پس‌فردا",
    totalCalories: 2180,
    meals: [
      { type: "صبحانه", name: "پنیر، گردو و نان", calories: 390, ingredients: [{ name: "پنیر", quantity: "۴۰ گرم", category: "protein" }] },
      { type: "ناهار", name: "زرشک‌پلو با مرغ", calories: 740, ingredients: [{ name: "مرغ", quantity: "۱ ران", category: "protein" }] },
      { type: "شام", name: "عدسی و سالاد", calories: 450, ingredients: [{ name: "عدسی", quantity: "۱ کاسه", category: "main" }] },
    ],
  },
];

const demoWorkoutPlan = [
  {
    id: "push-a",
    day: "امروز",
    name: "Push — سینه، سرشانه و پشت بازو",
    duration: "60-75",
    exercises: [
      { id: "bench", name: "پرس سینه هالتر", sets: 4, reps: "8-10" },
      { id: "incline", name: "پرس بالا سینه دمبل", sets: 3, reps: "10-12" },
      { id: "shoulder", name: "پرس سرشانه", sets: 3, reps: "8-12" },
    ],
  },
  {
    id: "pull-a",
    day: "فردا",
    name: "Pull — زیربغل و جلو بازو",
    duration: "60-70",
    exercises: [
      { id: "lat", name: "لت سیم‌کش", sets: 4, reps: "10-12" },
      { id: "row", name: "قایقی", sets: 4, reps: "8-12" },
    ],
  },
];

const initialLogs: CombinedLog[] = [
  { id: "meal-breakfast", logType: "meal", loggedAt: atToday(8), mealType: "breakfast", description: "دو عدد تخم‌مرغ آب‌پز", calories: 156 },
  { id: "meal-lunch", logType: "meal", loggedAt: atToday(13), mealType: "lunch", description: "قورمه‌سبزی با چلو", calories: 710 },
  { id: "activity-walk", logType: "activity", loggedAt: atToday(18), activityType: "پیاده‌روی", durationMinutes: 32, intensity: "medium", caloriesBurned: 180 },
  { id: "weight-today", logType: "weight", loggedAt: atToday(7), weight: 95 },
];

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DemoUser>({ uid: "demo-emad", displayName: "عماد", email: "demo@neofit.local", emailVerified: true, photoURL: null });
  const [profile, setProfile] = useState<UserProfile>(demoProfile);
  const [nutritionPlan, setNutritionPlan] = useState<any[]>(demoNutritionPlan);
  const [workoutPlan, setWorkoutPlan] = useState<any[]>(demoWorkoutPlan);
  const [shoppingListState, setShoppingListState] = useState<ShoppingListState>({});
  const [checkedIngredientsState, setCheckedIngredientsState] = useState<CheckedIngredientsState>({});
  const [loggedMealsState, setLoggedMealsState] = useState<string[]>([]);
  const [combinedLogs, setCombinedLogs] = useState<CombinedLog[]>(initialLogs);

  const addLog = useCallback((log: CombinedLog) => {
    setCombinedLogs((current) => [log, ...current]);
  }, []);

  const value = useMemo<UserDataContextType>(() => ({
    user,
    userProfile: profile,
    nutritionPlan,
    workoutPlan,
    shoppingListState,
    checkedIngredientsState,
    loggedMealsState,
    combinedLogs,
    isLoading: false,
    saveUserProfile: async (next) => setProfile(next),
    savePlans: async (plans) => { setNutritionPlan(plans.nutritionPlan); setWorkoutPlan(plans.workoutPlan); },
    updateShoppingListState: async (next) => setShoppingListState(next),
    updateCheckedIngredientsState: async (mealId, ingredientName, isChecked) => setCheckedIngredientsState((current) => ({ ...current, [mealId]: { ...(current[mealId] || {}), [ingredientName]: isChecked } })),
    updateLoggedMealsState: async (next) => setLoggedMealsState(next),
    saveWorkoutLog: async (log) => addLog({ ...log, id: crypto.randomUUID(), logType: "workout", loggedAt: new Date().toISOString() }),
    logMeal: async (log) => addLog({ ...log, id: crypto.randomUUID(), logType: "meal", loggedAt: new Date().toISOString() }),
    logActivity: async (log) => addLog({ ...log, id: crypto.randomUUID(), logType: "activity", loggedAt: new Date().toISOString() }),
    logWeight: async (log) => addLog({ ...log, id: crypto.randomUUID(), logType: "weight", loggedAt: new Date().toISOString() }),
    updateLog: async (id, type, data) => setCombinedLogs((current) => current.map((item) => item.id === id && item.logType === type ? ({ ...item, ...data } as CombinedLog) : item)),
    deleteLog: async (id, type) => setCombinedLogs((current) => current.filter((item) => !(item.id === id && item.logType === type))),
    resetUserData: async () => { setProfile(demoProfile); setNutritionPlan(demoNutritionPlan); setWorkoutPlan(demoWorkoutPlan); setCombinedLogs(initialLogs); },
    reauthenticateUser: async () => undefined,
    updateUserAccount: async (data) => setUser((current) => ({ ...current, displayName: data.displayName || current.displayName })),
    updateUserEmail: async (email) => setUser((current) => ({ ...current, email })),
    updateUserPassword: async () => undefined,
  }), [user, profile, nutritionPlan, workoutPlan, shoppingListState, checkedIngredientsState, loggedMealsState, combinedLogs, addLog]);

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (!context) throw new Error("useUserData must be used within UserDataProvider");
  return context;
}
