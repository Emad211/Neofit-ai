// src/context/user-profile-context.tsx
"use client";

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
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
};

// Add types for the plans
type NutritionPlan = GenerateNutritionProgramOutput['weeklyMealPlan'];
type WorkoutPlan = GenerateWorkoutProgramOutput['weeklyWorkoutPlan'];
type WorkoutLog = {
    workoutId: string;
    workoutName: string;
    completedAt: string;
    durationMinutes: number;
    totalVolume: number;
    exercises: {
        id: string;
        name: string;
        logs: { set: number; reps: string; weight: string; }[]
    }[]
}

interface UserDataContextType {
  user: User | null;
  userProfile: UserProfile | null;
  nutritionPlan: NutritionPlan | null;
  workoutPlan: WorkoutPlan | null;
  saveUserProfile: (profileData: UserProfile) => Promise<void>;
  savePlans: (plans: { nutritionPlan: NutritionPlan, workoutPlan: WorkoutPlan }) => Promise<void>;
  saveWorkoutLog: (logData: WorkoutLog) => Promise<void>;
  isLoading: boolean;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock user ID for demonstration purposes
  const MOCK_USER_ID = 'mock-user-123';

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
      console.error("No user is signed in to save profile.");
      return;
    }
    try {
      const profileRef = doc(db, 'profiles', user.uid);
      await setDoc(profileRef, profileData, { merge: true });
      setUserProfile(profileData);
    } catch (error) {
      console.error("Failed to save user profile to Firestore", error);
    }
  };

  const savePlans = async (plans: { nutritionPlan: NutritionPlan, workoutPlan: WorkoutPlan }) => {
     if (!user) {
      console.error("No user is signed in to save plans.");
      return;
    }
    try {
        const plansRef = doc(db, 'plans', user.uid);
        await setDoc(plansRef, plans);
        setNutritionPlan(plans.nutritionPlan);
        setWorkoutPlan(plans.workoutPlan);
    } catch (error) {
        console.error("Failed to save plans to Firestore", error);
    }
  }

  const saveWorkoutLog = async (logData: WorkoutLog) => {
    if (!user) {
        throw new Error("No user is signed in to save workout log.");
    }
    try {
        // This will create a new document with a unique ID inside the user's workout_logs subcollection
        const logsCollectionRef = collection(db, 'profiles', user.uid, 'workout_logs');
        await addDoc(logsCollectionRef, logData);
    } catch (error) {
        console.error("Failed to save workout log to Firestore", error);
        throw error; // re-throw error to be caught by the caller
    }
  }

  return (
    <UserDataContext.Provider value={{ user, userProfile, nutritionPlan, workoutPlan, saveUserProfile, savePlans, saveWorkoutLog, isLoading }}>
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
