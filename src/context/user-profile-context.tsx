
// src/context/user-profile-context.tsx
"use client";

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, addDoc, onSnapshot, query, orderBy, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User, EmailAuthProvider, reauthenticateWithCredential, updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { app } from '@/lib/firebase';
import type { GenerateNutritionProgramOutput } from '@/ai/flows/generate-nutrition-program';
import type { GenerateWorkoutProgramOutput } from '@/ai/flows/generate-workout-program';
import { useRouter } from 'next/navigation';
import { startOfDay } from 'date-fns';

const db = getFirestore(app);
const auth = getAuth(app);

// Keep the same UserProfile type
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

// Add types for the plans and logs
type NutritionPlan = GenerateNutritionProgramOutput['weeklyMealPlan'];
type WorkoutPlan = GenerateWorkoutProgramOutput['weeklyWorkoutPlan'];
type ShoppingListState = { [itemName: string]: boolean };
type CheckedIngredientsState = { [mealId: string]: { [ingredientName: string]: boolean } };
type LoggedMealsState = {
    date: string; // ISO date string for the start of the day
    mealIds: string[];
};


export type MealLog = {
    id?: string;
    logType: 'meal';
    loggedAt: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    description: string;
    calories: number;
}
export type ActivityLog = {
    id?: string;
    logType: 'activity';
    loggedAt: string;
    activityType: string;
    durationMinutes: number;
    intensity: 'low' | 'medium' | 'high';
    caloriesBurned: number;
}
export type WeightLog = {
    id?: string;
    logType: 'weight';
    loggedAt: string;
    weight: number;
}
export type WorkoutLog = {
    id?: string;
    logType: 'workout';
    workoutId: string;
    workoutName: string;
    loggedAt: string;
    durationMinutes: number;
    totalVolume: number;
    exercises: {
        id: string;
        name: string;
        logs: { set: number; reps: string; weight: string; }[]
    }[]
}
export type CombinedLog = MealLog | ActivityLog | WeightLog | WorkoutLog;


interface UserDataContextType {
  user: User | null;
  userProfile: UserProfile | null;
  nutritionPlan: NutritionPlan | null;
  workoutPlan: WorkoutPlan | null;
  shoppingListState: ShoppingListState | null;
  checkedIngredientsState: CheckedIngredientsState | null;
  loggedMealsState: string[] | null;
  saveUserProfile: (profileData: UserProfile) => Promise<void>;
  savePlans: (plans: { nutritionPlan: NutritionPlan, workoutPlan: WorkoutPlan }) => Promise<void>;
  updateShoppingListState: (state: ShoppingListState) => Promise<void>;
  updateCheckedIngredientsState: (mealId: string, ingredientName: string, isChecked: boolean) => Promise<void>;
  updateLoggedMealsState: (mealIds: string[]) => Promise<void>;
  saveWorkoutLog: (logData: Omit<WorkoutLog, 'logType' | 'loggedAt' | 'id'>) => Promise<void>;
  logMeal: (logData: Omit<MealLog, 'logType' | 'loggedAt' | 'id'>) => Promise<void>;
  logActivity: (logData: Omit<ActivityLog, 'logType' | 'loggedAt'| 'id'>) => Promise<void>;
  logWeight: (logData: Omit<WeightLog, 'logType' | 'loggedAt' | 'id'>) => Promise<void>;
  updateLog: (logId: string, logType: CombinedLog['logType'], data: Partial<CombinedLog>) => Promise<void>;
  deleteLog: (logId: string, logType: CombinedLog['logType']) => Promise<void>;
  resetUserData: () => Promise<void>;
  reauthenticateUser: (password: string) => Promise<void>;
  updateUserAccount: (data: {displayName?: string}) => Promise<void>;
  updateUserEmail: (newEmail: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  combinedLogs: CombinedLog[];
  isLoading: boolean;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

const logTypeToCollectionName = {
    meal: 'meal_logs',
    activity: 'activity_logs',
    weight: 'weight_logs',
    workout: 'workout_logs',
} as const;

export const UserDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [shoppingListState, setShoppingListState] = useState<ShoppingListState | null>(null);
  const [checkedIngredientsState, setCheckedIngredientsState] = useState<CheckedIngredientsState | null>(null);
  const [loggedMealsState, setLoggedMealsState] = useState<string[] | null>(null);
  const [combinedLogs, setCombinedLogs] = useState<CombinedLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setIsLoading(true);
        if (firebaseUser) {
            setUser(firebaseUser);
        } else {
            setUser(null);
            setUserProfile(null);
            setNutritionPlan(null);
            setWorkoutPlan(null);
            setShoppingListState(null);
            setCheckedIngredientsState(null);
            setLoggedMealsState(null);
            setCombinedLogs([]);
            router.push('/auth');
        }
    });

    return () => unsubscribe();
  }, [router]);


  useEffect(() => {
    if (!user) {
        setIsLoading(false);
        return;
    };
    
    const profileRef = doc(db, 'profiles', user.uid);
    const plansRef = doc(db, 'plans', user.uid);

    const unsubProfile = onSnapshot(profileRef, (doc) => {
        setUserProfile(doc.data() as UserProfile || null);
    });

    const unsubPlans = onSnapshot(plansRef, (doc) => {
        const data = doc.data();
        const todayDateStr = startOfDay(new Date()).toISOString().split('T')[0];

        if (data) {
            setNutritionPlan(data.nutritionPlan);
            setWorkoutPlan(data.workoutPlan);
            setShoppingListState(data.shoppingListState || null);
            setCheckedIngredientsState(data.checkedIngredientsState || null);
            
            // Check if loggedMealsState is for today, otherwise reset it
            const storedLoggedMeals: LoggedMealsState = data.loggedMealsState;
            if (storedLoggedMeals && storedLoggedMeals.date === todayDateStr) {
                setLoggedMealsState(storedLoggedMeals.mealIds);
            } else {
                setLoggedMealsState([]); // Reset for the new day
            }

        } else {
            setNutritionPlan(null);
            setWorkoutPlan(null);
            setShoppingListState(null);
            setCheckedIngredientsState(null);
            setLoggedMealsState(null);
        }
    });
    
    // Set up listeners for all log collections
    const logUnsubscribers = Object.entries(logTypeToCollectionName).map(([logType, collectionName]) => {
        const q = query(collection(db, 'profiles', user.uid, collectionName), orderBy('loggedAt', 'desc'));
        return onSnapshot(q, (querySnapshot) => {
            const logs = querySnapshot.docs.map(doc => ({ 
                id: doc.id, 
                logType: logType as keyof typeof logTypeToCollectionName,
                ...doc.data() 
            } as CombinedLog));
            
            setCombinedLogs(prevLogs => {
                const otherLogs = prevLogs.filter(log => log.logType !== logType);
                const updatedLogs = [...otherLogs, ...logs].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
                return updatedLogs;
            });
        }, (error) => {
            console.error(`Error listening to ${collectionName}:`, error);
        });
    });

    setIsLoading(false);

    return () => {
        unsubProfile();
        unsubPlans();
        logUnsubscribers.forEach(unsub => unsub());
    }
  }, [user]);

  const saveUserProfile = async (profileData: UserProfile) => {
    if (!user) {
      throw new Error("No user is signed in to save profile.");
    }
    try {
      const profileRef = doc(db, 'profiles', user.uid);
      await setDoc(profileRef, profileData, { merge: true });
      setUserProfile(profileData);
    } catch (error) {
      console.error("Failed to save user profile to Firestore", error);
      throw error;
    }
  };

  const savePlans = async (plans: { nutritionPlan: NutritionPlan, workoutPlan: WorkoutPlan }) => {
     if (!user) {
      throw new Error("No user is signed in to save plans.");
    }
    try {
        const plansRef = doc(db, 'plans', user.uid);
        await setDoc(plansRef, plans, { merge: true });
        setNutritionPlan(plans.nutritionPlan);
        setWorkoutPlan(plans.workoutPlan);
    } catch (error) {
        console.error("Failed to save plans to Firestore", error);
        throw error;
    }
  }
  
  const updateShoppingListState = async (state: ShoppingListState) => {
      if (!user) {
          throw new Error("No user is signed in to update shopping list.");
      }
      try {
          const plansRef = doc(db, 'plans', user.uid);
          await setDoc(plansRef, { shoppingListState: state }, { merge: true });
          setShoppingListState(state);
      } catch (error) {
          console.error("Failed to update shopping list state", error);
          throw error;
      }
  };
  
    const updateCheckedIngredientsState = async (mealId: string, ingredientName: string, isChecked: boolean) => {
        if (!user) {
            throw new Error("No user is signed in to update ingredient state.");
        }
        try {
            const plansRef = doc(db, 'plans', user.uid);
            const newState = { ...checkedIngredientsState };
            if (!newState[mealId]) {
                newState[mealId] = {};
            }
            newState[mealId][ingredientName] = isChecked;

            await setDoc(plansRef, { checkedIngredientsState: newState }, { merge: true });
            setCheckedIngredientsState(newState);
        } catch (error) {
            console.error("Failed to update checked ingredients state", error);
            throw error;
        }
    };

  const updateLoggedMealsState = async (mealIds: string[]) => {
      if (!user) {
          throw new Error("No user is signed in to update logged meals.");
      }
      try {
          const plansRef = doc(db, 'plans', user.uid);
          const todayDateStr = startOfDay(new Date()).toISOString().split('T')[0];
          const stateToSave: LoggedMealsState = {
              date: todayDateStr,
              mealIds: mealIds,
          };
          await setDoc(plansRef, { loggedMealsState: stateToSave }, { merge: true });
          setLoggedMealsState(mealIds);
      } catch (error) {
          console.error("Failed to update logged meals state", error);
          throw error;
      }
  };


  const logGeneric = async (collectionName: string, logData: object) => {
    if (!user) {
        throw new Error("No user is signed in to save log.");
    }
    const dataToSave = {
        ...logData,
        loggedAt: new Date().toISOString(),
    };
    try {
        const logsCollectionRef = collection(db, 'profiles', user.uid, collectionName);
        await addDoc(logsCollectionRef, dataToSave);
    } catch (error) {
        console.error(`Failed to save to ${collectionName}`, error);
        throw error;
    }
  }
  
  const logMeal = (logData: Omit<MealLog, 'logType' | 'loggedAt' | 'id'>) => logGeneric('meal_logs', logData);
  const logActivity = (logData: Omit<ActivityLog, 'logType' | 'loggedAt'| 'id'>) => logGeneric('activity_logs', logData);
  const logWeight = (logData: Omit<WeightLog, 'logType' | 'loggedAt' | 'id'>) => logGeneric('weight_logs', logData);
  const saveWorkoutLog = (logData: Omit<WorkoutLog, 'logType' | 'loggedAt'| 'id'>) => logGeneric('workout_logs', logData);

  const updateLog = async (logId: string, logType: CombinedLog['logType'], data: Partial<CombinedLog>) => {
    if (!user) throw new Error("No user is signed in to update log.");
    const collectionName = logTypeToCollectionName[logType];
    const logRef = doc(db, 'profiles', user.uid, collectionName, logId);
    await updateDoc(logRef, data);
  };

  const deleteLog = async (logId: string, logType: CombinedLog['logType']) => {
    if (!user) throw new Error("No user is signed in to delete log.");
    const collectionName = logTypeToCollectionName[logType];
    const logRef = doc(db, 'profiles', user.uid, collectionName, logId);
    await deleteDoc(logRef);
  };

  const resetUserData = async () => {
    if (!user) {
      throw new Error("No user is signed in to reset data.");
    }
    setIsLoading(true);
    try {
      const profileRef = doc(db, 'profiles', user.uid);
      const plansRef = doc(db, 'plans', user.uid);
      
      // In a real app, deleting subcollections requires a Cloud Function.
      // For this demo, we'll just delete the main docs.
      await deleteDoc(profileRef);
      await deleteDoc(plansRef);
      
      setUserProfile(null);
      setNutritionPlan(null);
      setWorkoutPlan(null);
      setShoppingListState(null);
      setCheckedIngredientsState(null);
      setLoggedMealsState(null);
      setCombinedLogs([]);
    } catch (error) {
      console.error("Failed to reset user data in Firestore", error);
      throw error;
    } finally {
        setIsLoading(false);
    }
  };

  const reauthenticateUser = async (password: string) => {
    if (!user || !user.email) {
      throw new Error("User not signed in or email is missing.");
    }
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  }

  const updateUserAccount = async (data: {displayName?: string}) => {
    if (!user) throw new Error("User not signed in.");
    await updateProfile(user, data);
    setUser({ ...user, ...data }); // Trigger a re-render
  }

  const updateUserEmail = async (newEmail: string) => {
    if (!user) throw new Error("User not signed in.");
    await updateEmail(user, newEmail);
    setUser({ ...user, email: newEmail });
  }

  const updateUserPassword = async (newPassword: string) => {
    if (!user) throw new Error("User not signed in.");
    await updatePassword(user, newPassword);
  }

  return (
    <UserDataContext.Provider value={{ user, userProfile, nutritionPlan, workoutPlan, shoppingListState, checkedIngredientsState, loggedMealsState, saveUserProfile, savePlans, updateShoppingListState, updateCheckedIngredientsState, updateLoggedMealsState, saveWorkoutLog, logMeal, logActivity, logWeight, updateLog, deleteLog, resetUserData, reauthenticateUser, updateUserAccount, updateUserEmail, updateUserPassword, combinedLogs, isLoading }}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};
