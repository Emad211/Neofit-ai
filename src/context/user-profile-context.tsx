// src/context/user-profile-context.tsx
"use client";

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, addDoc, onSnapshot, query, orderBy, updateDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import type { GenerateNutritionProgramOutput } from '@/ai/flows/generate-nutrition-program';
import type { GenerateWorkoutProgramOutput } from '@/ai/flows/generate-workout-program';
import { useRouter } from 'next/navigation';

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
export type CombinedLog = MealLog | ActivityLog | WeightLog | WorkoutLog;


interface UserDataContextType {
  user: User | null;
  userProfile: UserProfile | null;
  nutritionPlan: NutritionPlan | null;
  workoutPlan: WorkoutPlan | null;
  saveUserProfile: (profileData: UserProfile) => Promise<void>;
  savePlans: (plans: { nutritionPlan: NutritionPlan, workoutPlan: WorkoutPlan }) => Promise<void>;
  saveWorkoutLog: (logData: Omit<WorkoutLog, 'logType' | 'loggedAt' | 'id'>) => Promise<void>;
  logMeal: (logData: Omit<MealLog, 'logType' | 'loggedAt' | 'id'>) => Promise<void>;
  logActivity: (logData: Omit<ActivityLog, 'logType' | 'loggedAt'| 'id'>) => Promise<void>;
  logWeight: (logData: Omit<WeightLog, 'logType' | 'loggedAt' | 'id'>) => Promise<void>;
  updateLog: (logId: string, logType: CombinedLog['logType'], data: Partial<CombinedLog>) => Promise<void>;
  deleteLog: (logId: string, logType: CombinedLog['logType']) => Promise<void>;
  resetUserData: () => Promise<void>;
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
        if (data) {
            setNutritionPlan(data.nutritionPlan);
            setWorkoutPlan(data.workoutPlan);
        } else {
            setNutritionPlan(null);
            setWorkoutPlan(null);
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
        throw error;
    }
  }
  
  const logMeal = (logData: Omit<MealLog, 'logType' | 'loggedAt' | 'id'>) => logGeneric('meal_logs', logData);
  const logActivity = (logData: Omit<ActivityLog, 'logType' | 'loggedAt' | 'id'>) => logGeneric('activity_logs', logData);
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
      setCombinedLogs([]);
    } catch (error) {
      console.error("Failed to reset user data in Firestore", error);
      throw error;
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <UserDataContext.Provider value={{ user, userProfile, nutritionPlan, workoutPlan, saveUserProfile, savePlans, saveWorkoutLog, logMeal, logActivity, logWeight, updateLog, deleteLog, resetUserData, combinedLogs, isLoading }}>
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
