// This hook has been deprecated and replaced by the UserDataContext.
// It is kept here for reference but can be safely removed in a future cleanup.
"use client";

import { useState, useEffect, useCallback } from 'react';

// Define the shape of the user profile based on all collected data
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

export function useUserProfile() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem('userProfile');
      if (storedProfile) {
        setUserProfile(JSON.parse(storedProfile));
      }
    } catch (error) {
      console.error("Failed to parse user profile from localStorage", error);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveUserProfile = useCallback((profileData: UserProfile) => {
    try {
      localStorage.setItem('userProfile', JSON.stringify(profileData));
      setUserProfile(profileData);
    } catch (error) {
      console.error("Failed to save user profile to localStorage", error);
    }
  }, []);

  return { userProfile, saveUserProfile, isLoading };
}
