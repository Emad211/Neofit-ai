// src/app/(main)/profile/edit/page.tsx
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import * as z from 'zod';
import { useUserData } from '@/context/user-profile-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, MoveLeft, Save, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

// This schema contains only the fields that are realistically changeable by the user.
// Fields like gender, age, bodyType are considered less frequently changed or fixed.
const ProfileFormSchema = z.object({
  goal: z.enum(["lose_weight", "gain_muscle", "improve_fitness"]),
  weight: z.coerce.number().min(30, "Weight must be a positive number."),
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
  timezone: z.string({required_error: "Please select your timezone."}),
});

type ProfileFormValues = z.infer<typeof ProfileFormSchema>;

export default function EditProfilePage() {
  const { userProfile, saveUserProfile, isLoading: isProfileLoading } = useUserData();
  const router = useRouter();
  const { toast } = useToast();
  const timezones = React.useMemo(() => Intl.supportedValuesOf('timeZone'), []);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
  });

  React.useEffect(() => {
    if (userProfile) {
      const profileToReset: any = {
        ...userProfile,
        weight: Number(userProfile.weight),
      };
      form.reset(profileToReset);
    }
  }, [userProfile, form]);

  const onRegenerate = (data: ProfileFormValues) => {
    // Merge the changed data with the existing fixed data before saving/regenerating
    const fullProfile = { ...userProfile, ...data };
    saveUserProfile(fullProfile as any);
    toast({
        title: "Profile Updated!",
        description: "Your new plans are being generated.",
    });

    const params = new URLSearchParams();
    Object.entries(fullProfile).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });
    
    router.push(`/onboarding/analysis?${params.toString()}`);
  };
  
  const onSaveOnly = () => {
    form.trigger().then(isValid => {
        if(isValid) {
            const data = form.getValues();
            const fullProfile = { ...userProfile, ...data };
            saveUserProfile(fullProfile as any);
            toast({
                title: "Profile Saved!",
                description: "Your profile details have been updated.",
            });
            router.push('/profile');
        } else {
             toast({
                variant: "destructive",
                title: "Invalid Information",
                description: "Please check the form for errors before saving.",
            });
        }
    });
  }

  if (isProfileLoading) {
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
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    );
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
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold font-headline text-foreground">
          Edit Your Details & Plan
        </h1>
        <p className="text-muted-foreground">
          Update your details to reflect your progress. You can save or regenerate your plans.
        </p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onRegenerate)} className="space-y-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Core Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                 <FormField control={form.control} name="weight" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Weight (kg)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormDescription>Update this as your weight changes.</FormDescription>
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
                    <FormField
                        control={form.control}
                        name="timezone"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center gap-2"><Globe className="h-4 w-4"/>Timezone</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select your timezone" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {timezones.map(tz => (
                                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
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
                         <FormDescription>Update this if you have new injuries or have recovered from old ones.</FormDescription>
                    </FormItem>
                )} />
              </CardContent>
          </Card>
            
          <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={onSaveOnly}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
            <Button type="submit" size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <RefreshCw className="mr-2 h-5 w-5" />
              Update & Regenerate Plan
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
