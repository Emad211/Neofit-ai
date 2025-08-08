
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import React from 'react';

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { MoveRight, Briefcase, Footprints, Activity, Weight, Home, Building, DollarSign, Bed, ChefHat, Droplets, Smile, Dumbbell, Utensils, Sparkles, Brain } from "lucide-react"
import { Card, CardContent } from "../ui/card"
import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Textarea } from "../ui/textarea"

const lifestyleOptions = [
  { value: 'sedentary', label: 'Sedentary', icon: Briefcase, description: 'Office job, little to no exercise' },
  { value: 'lightly_active', label: 'Lightly Active', icon: Footprints, description: 'Light exercise 1-3 days/week' },
  { value: 'moderately_active', label: 'Moderately Active', icon: Activity, description: 'Moderate exercise 3-5 days/week' },
  { value: 'very_active', label: 'Very Active', icon: Weight, description: 'Hard exercise 6-7 days/week' },
];

const trainingDaysOptions = ['2', '3', '4', '5', '6'];

const workoutLocationOptions = [
    { value: 'home', label: 'Home', icon: Home },
    { value: 'gym', label: 'Gym', icon: Building },
];

const costLevelOptions = [
    { value: 'low', label: 'Low', icon: DollarSign },
    { value: 'medium', label: 'Medium', icon: DollarSign },
    { value: 'high', label: 'High', icon: DollarSign },
]


const FormSchema = z.object({
  trainingDays: z.string().min(1, "Please select how many days you can train."),
  trainingDuration: z.string({required_error: "Please select your preferred workout duration."}),
  trainingTime: z.string({required_error: "Please select your preferred workout time."}),
  lifestyle: z.enum(["sedentary", "lightly_active", "moderately_active", "very_active"], { required_error: "Please select your lifestyle." }),
  sleepHours: z.string({required_error: "Please select your average sleep duration."}),
  stressLevel: z.enum(['low', 'medium', 'high'], {required_error: "Please select your stress level."}),
  eatingHabits: z.array(z.string()).optional(),
  dietaryPreference: z.string({required_error: "Please select your dietary preference."}),
  cookingSkill: z.enum(['beginner', 'intermediate', 'advanced'], {required_error: "Please select your cooking skill."}),
  performanceGoals: z.string().optional(),
  workoutLocation: z.enum(["home", "gym"], { required_error: "Please select where you will train." }),
  availableEquipment: z.string().optional(),
  costLevel: z.enum(["low", "medium", "high"], { required_error: "Please select your budget level." }),
})

export function OnboardingLifestyleForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tagInput, setTagInput] = React.useState('');

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      trainingDays: searchParams.get('trainingDays') || '3',
      lifestyle: (searchParams.get('lifestyle') as any) || 'sedentary',
      eatingHabits: searchParams.get('eatingHabits')?.split(',').filter(Boolean) || [],
      workoutLocation: (searchParams.get('workoutLocation') as any) || 'gym',
      availableEquipment: searchParams.get('availableEquipment') || '',
      costLevel: (searchParams.get('costLevel') as any) || 'medium',
      dietaryPreference: 'none',
      sleepHours: '7-8',
      stressLevel: 'medium',
      cookingSkill: 'intermediate',
      trainingDuration: '45-60',
      trainingTime: 'any',
      performanceGoals: ''
    }
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    const params = new URLSearchParams(searchParams);
    
    // Pass individual lifestyle fields
    params.set('lifestyle', data.lifestyle);
    params.set('sleepHours', data.sleepHours);
    params.set('stressLevel', data.stressLevel);

    // Create a comprehensive 'eatingHabits' string
    const eatingHabitsDetails = [
        data.dietaryPreference !== 'none' ? `Dietary preference: ${data.dietaryPreference}`: '',
        data.eatingHabits && data.eatingHabits.length > 0 ? `Dislikes/Allergies: ${data.eatingHabits.join(', ')}` : '',
    ].filter(Boolean).join('; ');

    params.set('eatingHabits', eatingHabitsDetails || 'None');
    params.set('cookingSkill', data.cookingSkill);
    params.set('costLevel', data.costLevel);

    // Pass training details
    params.set('trainingDays', data.trainingDays);
    params.set('trainingDuration', data.trainingDuration);
    params.set('trainingTime', data.trainingTime);
    params.set('workoutLocation', data.workoutLocation);
    
    if (data.performanceGoals) {
        params.set('performanceGoals', data.performanceGoals);
    }
    
    const equipment = data.workoutLocation === 'gym' ? 'Full gym equipment' : data.availableEquipment;
    params.set('availableEquipment', equipment || 'Bodyweight only');


    router.push(`/onboarding/injuries?${params.toString()}`);
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !form.getValues('eatingHabits')?.includes(newTag)) {
        form.setValue('eatingHabits', [...(form.getValues('eatingHabits') || []), newTag]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue('eatingHabits', form.getValues('eatingHabits')?.filter(tag => tag !== tagToRemove));
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Training Section */}
        <Card>
            <CardContent className="p-6 space-y-6">
                 <h3 className="text-xl font-semibold flex items-center gap-2"><Dumbbell className="text-primary"/> Training Preferences</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="trainingDays"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>How many days per week can you train?</FormLabel>
                        <FormControl>
                            <div className="flex flex-wrap gap-2 pt-2">
                            {trainingDaysOptions.map(day => (
                                <Button
                                key={day}
                                type="button"
                                variant={field.value === day ? "default" : "outline"}
                                onClick={() => field.onChange(day)}
                                className="w-16 h-12 text-lg"
                                >
                                {day}
                                </Button>
                            ))}
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                        control={form.control}
                        name="trainingDuration"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>How long are your sessions?</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="<30">&lt; 30 minutes</SelectItem>
                                    <SelectItem value="30-45">30-45 minutes</SelectItem>
                                    <SelectItem value="45-60">45-60 minutes</SelectItem>
                                    <SelectItem value="60-90">60-90 minutes</SelectItem>
                                    <SelectItem value=">90">&gt; 90 minutes</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="workoutLocation"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Where will you be working out?</FormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-4 pt-2"
                            >
                            {workoutLocationOptions.map((option) => (
                                <FormItem key={option.value} className="h-full">
                                    <FormControl>
                                    <RadioGroupItem value={option.value} className="sr-only" />
                                    </FormControl>
                                    <FormLabel className="font-normal h-full">
                                    <Card className={cn(
                                        "h-full cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-primary",
                                        field.value === option.value && "border-primary ring-2 ring-primary"
                                    )}>
                                        <CardContent className="flex flex-col items-center justify-center text-center p-4">
                                            <div className="mb-2 rounded-full bg-primary/10 p-3 text-primary">
                                                <option.icon className="h-8 w-8" />
                                            </div>
                                            <p className="font-semibold text-foreground capitalize">{option.label}</p>
                                        </CardContent>
                                    </Card>
                                    </FormLabel>
                                </FormItem>
                            ))}
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    {form.watch('workoutLocation') === 'home' && (
                        <FormField
                            control={form.control}
                            name="availableEquipment"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>What equipment do you have?</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="e.g., dumbbells, resistance bands, yoga mat" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                 </div>
                  <FormField
                        control={form.control}
                        name="performanceGoals"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Any specific performance goals?</FormLabel>
                            <FormControl>
                               <Input placeholder="e.g., Run a 5k, Bench press 100kg" {...field} />
                            </FormControl>
                             <FormDescription>
                                This helps us fine-tune your training progression.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
            </CardContent>
        </Card>

         {/* Nutrition Section */}
        <Card>
            <CardContent className="p-6 space-y-6">
                 <h3 className="text-xl font-semibold flex items-center gap-2"><Utensils className="text-primary"/> Nutrition & Budget</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField
                        control={form.control}
                        name="dietaryPreference"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Any specific dietary preferences?</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select preference" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                                    <SelectItem value="vegan">Vegan</SelectItem>
                                    <SelectItem value="pescatarian">Pescatarian</SelectItem>
                                    <SelectItem value="gluten-free">Gluten-Free</SelectItem>
                                    <SelectItem value="keto">Keto</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="eatingHabits"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Foods you dislike or are allergic to</FormLabel>
                            <FormControl>
                                <div>
                                    <div className="flex flex-wrap gap-2 mb-2 min-h-[20px]">
                                    {field.value?.map(tag => (
                                        <Badge key={tag} variant="secondary" className="text-sm py-1 pl-3 pr-2">
                                        {tag}
                                        <button type="button" onClick={() => removeTag(tag)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                                            <X className="h-3 w-3" />
                                        </button>
                                        </Badge>
                                    ))}
                                    </div>
                                    <Input
                                    placeholder="Type and press Enter..."
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="cookingSkill"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>How skilled are you in the kitchen?</FormLabel>
                            <FormControl>
                                <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-3 gap-2 pt-2"
                                >
                                {[
                                    {value: 'beginner', label: 'Beginner'},
                                    {value: 'intermediate', label: 'Intermediate'},
                                    {value: 'advanced', label: 'Advanced'}
                                ].map(option => (
                                    <FormItem key={option.value}>
                                        <FormControl>
                                        <RadioGroupItem value={option.value} className="sr-only" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                        <Card className={cn(
                                            "cursor-pointer text-center p-3",
                                            field.value === option.value && "border-primary ring-2 ring-primary"
                                        )}>
                                            <p className="font-semibold text-foreground capitalize">{option.label}</p>
                                        </Card>
                                        </FormLabel>
                                    </FormItem>
                                ))}
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="costLevel"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>What's your weekly food budget?</FormLabel>
                             <FormControl>
                                <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid grid-cols-3 gap-2 pt-2"
                                >
                                {costLevelOptions.map((option) => (
                                    <FormItem key={option.value} className="h-full">
                                        <FormControl>
                                        <RadioGroupItem value={option.value} className="sr-only" />
                                        </FormControl>
                                        <FormLabel className="font-normal h-full">
                                        <Card className={cn(
                                            "h-full cursor-pointer flex items-center justify-center p-3",
                                            field.value === option.value && "border-primary ring-2 ring-primary"
                                        )}>
                                            <p className="font-semibold text-foreground capitalize">{option.label}</p>
                                        </Card>
                                        </FormLabel>
                                    </FormItem>
                                ))}
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
            </CardContent>
        </Card>

        {/* Lifestyle Section */}
        <Card>
            <CardContent className="p-6 space-y-6">
                <h3 className="text-xl font-semibold flex items-center gap-2"><Brain className="text-primary"/> Lifestyle & Wellbeing</h3>
                <FormField
                    control={form.control}
                    name="lifestyle"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Describe your daily activity level (outside of planned exercise)</FormLabel>
                        <FormControl>
                            <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2"
                            >
                            {lifestyleOptions.map(option => (
                                <FormItem key={option.value} className="h-full">
                                    <FormControl>
                                    <RadioGroupItem value={option.value} className="sr-only" />
                                    </FormControl>
                                    <FormLabel className="font-normal h-full">
                                    <Card className={cn(
                                        "h-full cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-primary",
                                        field.value === option.value && "border-primary ring-2 ring-primary"
                                    )}>
                                        <CardContent className="flex flex-col items-center justify-center text-center p-4">
                                            <div className="mb-2 rounded-full bg-primary/10 p-3 text-primary">
                                                <option.icon className="h-8 w-8" />
                                            </div>
                                            <p className="font-semibold text-foreground">{option.label}</p>
                                        </CardContent>
                                    </Card>
                                    </FormLabel>
                                </FormItem>
                            ))}
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="sleepHours"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center gap-2"><Bed className="h-4 w-4"/>Average Sleep Per Night</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select hours" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="<5">&lt; 5 hours</SelectItem>
                                    <SelectItem value="5-6">5-6 hours</SelectItem>
                                    <SelectItem value="7-8">7-8 hours</SelectItem>
                                    <SelectItem value=">8">&gt; 8 hours</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="stressLevel"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center gap-2"><Smile className="h-4 w-4"/>Average Stress Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                 </div>
                 <FormField
                    control={form.control}
                    name="trainingTime"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Preferred time to work out</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a time" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="morning">Morning</SelectItem>
                                <SelectItem value="afternoon">Afternoon</SelectItem>
                                <SelectItem value="evening">Evening</SelectItem>
                                <SelectItem value="any">Any time</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormDescription>
                            This helps us schedule your pre/post workout meals.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
            </CardContent>
        </Card>
        

        <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          Next <MoveRight className="ml-2 h-5 w-5" />
        </Button>
      </form>
    </Form>
  )
}
