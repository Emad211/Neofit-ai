// src/app/(main)/profile/page.tsx
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import * as z from 'zod';
import { useUserProfile } from '@/hooks/use-user-profile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// This schema combines fields from both details and lifestyle forms
const ProfileFormSchema = z.object({
  goal: z.enum(["lose_weight", "gain_muscle", "improve_fitness"]),
  gender: z.enum(["male", "female", "other"]),
  age: z.coerce.number().min(16).max(100),
  height: z.coerce.number(),
  weight: z.coerce.number(),
  bodyType: z.enum(["ectomorph", "mesomorph", "endomorph"]),
  fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]),
  trainingDays: z.string(),
  trainingDuration: z.string(),
  trainingTime: z.string(),
  lifestyle: z.enum(["sedentary", "lightly_active", "moderately_active", "very_active"]),
  sleepHours: z.string(),
  stressLevel: z.enum(['low', 'medium', 'high']),
  eatingHabits: z.string().optional(),
  cookingSkill: z.enum(['beginner', 'intermediate', 'advanced']),
  performanceGoals: z.string().optional(),
  workoutLocation: z.enum(["home", "gym"]),
  availableEquipment: z.string().optional(),
  costLevel: z.enum(["low", "medium", "high"]),
  medicalHistory: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

export default function ProfilePage() {
  const { userProfile, saveUserProfile, isLoading: isProfileLoading } = useUserProfile();
  const router = useRouter();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
  });

  React.useEffect(() => {
    if (userProfile) {
      form.reset(userProfile);
    }
  }, [userProfile, form]);

  const onSubmit = (data: ProfileFormValues) => {
    saveUserProfile(data); // Save the updated profile to localStorage
    toast({
        title: "Profile Updated!",
        description: "Your information has been saved.",
    });

    // Create URLSearchParams to navigate to the analysis page for plan regeneration
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });
    
    router.push(`/onboarding/analysis?${params.toString()}`);
  };

  if (isProfileLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <header className="mb-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
        </header>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline text-foreground">
          Edit Your Profile
        </h1>
        <p className="text-muted-foreground">
          Update your details and regenerate your plans anytime.
        </p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Core Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Basic Info: Goal, Gender, Age, Height, Weight */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField control={form.control} name="goal" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Goal</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="lose_weight">Lose Weight</SelectItem>
                        <SelectItem value="gain_muscle">Gain Muscle</SelectItem>
                        <SelectItem value="improve_fitness">Improve Fitness</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                 <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                       <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                       <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                       </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                 <FormField control={form.control} name="age" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
                 <FormField control={form.control} name="height" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
                 <FormField control={form.control} name="weight" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Fitness & Lifestyle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Fitness Level, Training Days, Duration, Location, Equipment */}
                    <FormField control={form.control} name="fitnessLevel" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fitness Level</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value}>
                               <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                               <SelectContent>
                                    <SelectItem value="beginner">Beginner</SelectItem>
                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                               </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="trainingDays" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Training Days/Week</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {['2','3','4','5','6'].map(d => <SelectItem key={d} value={d}>{d} days</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="trainingDuration" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Session Duration</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="<30">&lt; 30 min</SelectItem>
                                    <SelectItem value="30-45">30-45 min</SelectItem>
                                    <SelectItem value="45-60">45-60 min</SelectItem>
                                    <SelectItem value="60-90">60-90 min</SelectItem>
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="workoutLocation" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Workout Location</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 pt-2">
                                    <FormItem className="flex items-center space-x-2">
                                        <FormControl><RadioGroupItem value="gym" id="gym" /></FormControl>
                                        <FormLabel htmlFor="gym">Gym</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2">
                                        <FormControl><RadioGroupItem value="home" id="home" /></FormControl>
                                        <FormLabel htmlFor="home">Home</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                        </FormItem>
                    )} />
                    {form.watch('workoutLocation') === 'home' &&
                        <FormField control={form.control} name="availableEquipment" render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Available Equipment at Home</FormLabel>
                                <FormControl><Input placeholder="e.g., dumbbells, bands" {...field} /></FormControl>
                            </FormItem>
                        )} />
                    }
                    <FormField control={form.control} name="performanceGoals" render={({ field }) => (
                        <FormItem className="md:col-span-3">
                            <FormLabel>Specific Performance Goals</FormLabel>
                            <FormControl><Input placeholder="e.g., Run a 5k, Increase bench press" {...field} /></FormControl>
                        </FormItem>
                    )} />
                </div>
            </CardContent>
          </Card>
          
           <Card>
            <CardHeader>
              <CardTitle>Nutrition & Wellbeing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Cooking skill, cost, diet, habits */}
                    <FormField control={form.control} name="cookingSkill" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cooking Skill</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value}>
                               <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                               <SelectContent>
                                    <SelectItem value="beginner">Beginner</SelectItem>
                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                               </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="costLevel" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Food Budget</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                               <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                               <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                               </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="eatingHabits" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Dislikes or Allergies</FormLabel>
                            <FormControl><Input placeholder="e.g., nuts, dairy" {...field} /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="sleepHours" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Average Sleep</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                               <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                               <SelectContent>
                                    <SelectItem value="<5">&lt; 5 hours</SelectItem>
                                    <SelectItem value="5-6">5-6 hours</SelectItem>
                                    <SelectItem value="7-8">7-8 hours</SelectItem>
                                    <SelectItem value=">8">&gt; 8 hours</SelectItem>
                               </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="stressLevel" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Stress Level</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                               <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                               <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                               </SelectContent>
                            </Select>
                        </FormItem>
                    )} />
                 </div>
            </CardContent>
          </Card>
          
          <Card>
              <CardHeader>
                <CardTitle>Medical History</CardTitle>
              </CardHeader>
              <CardContent>
                 <FormField control={form.control} name="medicalHistory" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Note any injuries, conditions, or pains</FormLabel>
                        <FormControl><Textarea placeholder="e.g., Previous knee injury, Lower back pain" {...field} /></FormControl>
                    </FormItem>
                )} />
              </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            <RefreshCw className="mr-2 h-5 w-5" />
            Update Profile & Get New Plan
          </Button>
        </form>
      </Form>
    </div>
  );
}
