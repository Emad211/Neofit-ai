
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
import { MoveRight, Briefcase, Footprints, Activity, Weight } from "lucide-react"
import { Card, CardContent } from "../ui/card"
import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { X } from "lucide-react"

const lifestyleOptions = [
  { value: 'sedentary', label: 'Sedentary', icon: Briefcase, description: 'Office job, little to no exercise' },
  { value: 'lightly_active', label: 'Lightly Active', icon: Footprints, description: 'Light exercise 1-3 days/week' },
  { value: 'moderately_active', label: 'Moderately Active', icon: Activity, description: 'Moderate exercise 3-5 days/week' },
  { value: 'very_active', label: 'Very Active', icon: Weight, description: 'Hard exercise 6-7 days/week' },
]

const trainingDaysOptions = ['2', '3', '4', '5', '6'];


const FormSchema = z.object({
  trainingDays: z.string().min(1, "Please select how many days you can train."),
  lifestyle: z.enum(["sedentary", "lightly_active", "moderately_active", "very_active"], { required_error: "Please select your lifestyle." }),
  eatingHabits: z.array(z.string()).optional(),
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
      eatingHabits: searchParams.get('eatingHabits')?.split(',') || [],
    }
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    const params = new URLSearchParams(searchParams);
    Object.entries(data).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, String(value));
        }
      }
    });
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
                      className="w-20 h-14 text-lg"
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
          name="lifestyle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Describe your daily activity level</FormLabel>
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
          
        <FormField
          control={form.control}
          name="eatingHabits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Any foods you dislike or are allergic to?</FormLabel>
              <FormControl>
                 <div>
                    <div className="flex flex-wrap gap-2 mb-2">
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
                      placeholder="Type a food and press Enter..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                    />
                 </div>
              </FormControl>
              <FormDescription>
                This helps us create a meal plan you'll actually enjoy.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        

        <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          Next <MoveRight className="ml-2 h-5 w-5" />
        </Button>
      </form>
    </Form>
  )
}
