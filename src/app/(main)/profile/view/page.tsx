// src/app/(main)/profile/view/page.tsx
"use client";

import * as React from 'react';
import { useUserData } from '@/context/user-profile-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MoveLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const InfoItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex flex-col space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-base font-semibold text-foreground capitalize">{String(value)}</p>
    </div>
);

const InfoSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {children}
        </CardContent>
    </Card>
);


export default function ViewProfilePage() {
    const { userProfile, isLoading } = useUserData();

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <header className="mb-8">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </header>
                <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-32" />
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }
    
    if (!userProfile) {
        return (
             <div className="p-4 sm:p-6 lg:p-8 text-center">
                 <p className="text-muted-foreground">No profile data found. Please complete the onboarding process.</p>
                  <Button variant="outline" asChild className="mt-4">
                    <Link href="/">
                       Go to Onboarding
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <Button variant="ghost" asChild>
                    <Link href="/profile">
                    <MoveLeft className="mr-2 h-4 w-4" /> Back to Profile
                    </Link>
                </Button>
            </div>
            <header className="mb-8">
                <h1 className="text-4xl font-bold font-headline text-foreground">
                    My Information
                </h1>
                <p className="text-muted-foreground">
                    This is the data our AI uses to create your personalized plans.
                </p>
            </header>

            <main className="space-y-8 max-w-4xl mx-auto">
                <InfoSection title="Core Information">
                    <InfoItem label="Primary Goal" value={userProfile.goal.replace('_', ' ')} />
                    <InfoItem label="Gender" value={userProfile.gender} />
                    <InfoItem label="Age" value={userProfile.age} />
                    <InfoItem label="Height" value={`${userProfile.height} cm`} />
                    <InfoItem label="Weight" value={`${userProfile.weight} kg`} />
                    <InfoItem label="Body Type" value={userProfile.bodyType} />
                </InfoSection>

                 <InfoSection title="Fitness & Lifestyle">
                    <InfoItem label="Fitness Level" value={userProfile.fitnessLevel} />
                    <InfoItem label="Training Days/Week" value={userProfile.trainingDays} />
                    <InfoItem label="Session Duration" value={userProfile.trainingDuration} />
                    <InfoItem label="Workout Location" value={userProfile.workoutLocation} />
                    <InfoItem label="Daily Activity" value={userProfile.lifestyle.replace('_', ' ')} />
                    <InfoItem label="Performance Goals" value={userProfile.performanceGoals || 'Not specified'} />
                </InfoSection>

                <InfoSection title="Nutrition & Wellbeing">
                     <InfoItem label="Food Budget" value={userProfile.costLevel} />
                     <InfoItem label="Cooking Skill" value={userProfile.cookingSkill} />
                     <InfoItem label="Average Sleep" value={`${userProfile.sleepHours} hours`} />
                     <InfoItem label="Stress Level" value={userProfile.stressLevel} />
                     <InfoItem label="Eating Habits/Allergies" value={userProfile.eatingHabits || 'None'} />
                </InfoSection>

                <Card>
                    <CardHeader><CardTitle>Medical History</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-base text-muted-foreground">{userProfile.medicalHistory || 'No conditions or injuries reported.'}</p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
