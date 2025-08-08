
// src/context/user-profile-context.tsx
"use client";

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import type { GenerateNutritionProgramOutput } from '@/ai/flows/generate-nutrition-program';
import type { GenerateWorkoutProgramOutput } from '@/ai/flows/generate-workout-program';

const db = getFirestore(app);
const auth = getAuth(app);

// Keep the same UserProfile type
export type UserProfile = {
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

// Add types for the plans and logs
type NutritionPlan = GenerateNutritionProgramOutput['weeklyMealPlan'];
type WorkoutPlan = GenerateWorkoutProgramOutput['weeklyWorkoutPlan'];

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
    completedAt: string; // Keep this as it's specific to the workout completion event
    loggedAt: string;
    durationMinutes: number;
    totalVolume: number;
    exercises: {
        id: string;
        name: string;
        logs: { set: number; reps: string; weight: string; }[]
    }[]
}
type CombinedLog = MealLog | ActivityLog | WeightLog | WorkoutLog;


interface UserDataContextType {
  user: User | null;
  userProfile: UserProfile | null;
  nutritionPlan: NutritionPlan | null;
  workoutPlan: WorkoutPlan | null;
  saveUserProfile: (profileData: UserProfile) => Promise<void>;
  savePlans: (plans: { nutritionPlan: NutritionPlan, workoutPlan: WorkoutPlan }) => Promise<void>;
  saveWorkoutLog: (logData: Omit<WorkoutLog, 'logType' | 'loggedAt'>) => Promise<void>;
  logMeal: (logData: Omit<MealLog, 'logType' | 'loggedAt'>) => Promise<void>;
  logActivity: (logData: Omit<ActivityLog, 'logType' | 'loggedAt'>) => Promise<void>;
  logWeight: (logData: Omit<WeightLog, 'logType' | 'loggedAt'>) => Promise<void>;
  resetUserData: () => Promise<void>;
  combinedLogs: CombinedLog[];
  isLoading: boolean;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [combinedLogs, setCombinedLogs] = useState<CombinedLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock user ID for demonstration purposes
  const MOCK_USER_ID = 'mock-user-123';

  // Real-time listeners
  useEffect(() => {
    if (!user) return;

    const collectionsToListen = {
        meal_logs: 'meal',
        activity_logs: 'activity',
        weight_logs: 'weight',
        workout_logs: 'workout',
    } as const;

    const unsubscribes = Object.entries(collectionsToListen).map(([collectionName, logType]) => {
        const q = query(collection(db, 'profiles', user.uid, collectionName), orderBy('loggedAt', 'desc'));
        return onSnapshot(q, (querySnapshot) => {
            const logs = querySnapshot.docs.map(doc => ({ 
                id: doc.id, 
                logType: logType,
                ...doc.data() 
            } as CombinedLog));
            
            setCombinedLogs(prevLogs => {
                // Filter out old logs of the same type and merge with new ones
                const otherLogs = prevLogs.filter(log => log.logType !== logType);
                const updatedLogs = [...otherLogs, ...logs].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
                return updatedLogs;
            });
        }, (error) => {
            console.error(`Error listening to ${collectionName}:`, error);
        });
    });

    return () => {
        unsubscribes.forEach(unsub => unsub());
    };
}, [user]);


  const fetchData = async (userId: string) => {
    setIsLoading(true);
    try {
      const profileRef = doc(db, 'profiles', userId);
      const plansRef = doc(db, 'plans', userId);
      
      const [profileDoc, plansDoc] = await Promise.all([getDoc(profileRef), getDoc(plansRef)]);

      if (profileDoc.exists()) {
        setUserProfile(profileDoc.data() as UserProfile);
      }
      if (plansDoc.exists()) {
        const plansData = plansDoc.data();
        setNutritionPlan(plansData.nutritionPlan);
        setWorkoutPlan(plansData.workoutPlan);
      }
    } catch (error) {
      console.error("Failed to fetch user data from Firestore", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // In a real app, you would use Firebase Auth
    // For now, we simulate a logged-in user with a mock ID
    const mockUser = { uid: MOCK_USER_ID } as User;
    setUser(mockUser);
    fetchData(mockUser.uid);
  }, []);

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
        await setDoc(plansRef, plans);
        setNutritionPlan(plans.nutritionPlan);
        setWorkoutPlan(plans.workoutPlan);
    } catch (error) {
        console.error("Failed to save plans to Firestore", error);
        throw error;
    }
  }

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
        throw error; // re-throw error to be caught by the caller
    }
  }
  
  const logMeal = (logData: Omit<MealLog, 'logType' | 'loggedAt'>) => logGeneric('meal_logs', logData);
  const logActivity = (logData: Omit<ActivityLog, 'logType' | 'loggedAt'>) => logGeneric('activity_logs', logData);
  const logWeight = (logData: Omit<WeightLog, 'logType' | 'loggedAt'>) => logGeneric('weight_logs', logData);
  const saveWorkoutLog = (logData: Omit<WorkoutLog, 'logType' | 'loggedAt'>) => logGeneric('workout_logs', logData);

  const resetUserData = async () => {
    if (!user) {
      throw new Error("No user is signed in to reset data.");
    }
    try {
      // Note: Deleting subcollections is complex and not done here for simplicity.
      // In a production app, a Cloud Function would be needed for this.
      const profileRef = doc(db, 'profiles', user.uid);
      const plansRef = doc(db, 'plans', user.uid);
      
      await deleteDoc(profileRef);
      await deleteDoc(plansRef);
      
      // Clear local state
      setUserProfile(null);
      setNutritionPlan(null);
      setWorkoutPlan(null);
      setCombinedLogs([]);
    } catch (error) {
      console.error("Failed to reset user data in Firestore", error);
      throw error;
    }
  };


  return (
    <UserDataContext.Provider value={{ user, userProfile, nutritionPlan, workoutPlan, saveUserProfile, savePlans, saveWorkoutLog, logMeal, logActivity, logWeight, resetUserData, combinedLogs, isLoading }}>
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
