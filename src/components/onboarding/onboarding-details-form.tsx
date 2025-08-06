"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import Image from 'next/image';

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
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { MoveRight } from "lucide-react"

const bodyTypes = [
  { value: "ectomorph", label: "Ectomorph", description: "Lean and long, with difficulty building muscle.", image: "https://placehold.co/400x600.png", dataAiHint: "lean body" },
  { value: "mesomorph", label: "Mesomorph", description: "Muscular and well-built, with a high metabolism.", image: "https://placehold.co/400x600.png", dataAiHint: "muscular body" },
  { value: "endomorph", label: "Endomorph", description: "Big, high body fat, often pear-shaped.", image: "https://placehold.co/400x600.png", dataAiHint: "large body" },
]

const FormSchema = z.object({
  gender: z.enum(["male", "female", "other"], { required_error: "Please select a gender." }),
  age: z.coerce.number().min(16, "You must be at least 16 years old.").max(100),
  height: z.array(z.number()).min(1).max(1),
  weight: z.array(z.number()).min(1).max(1),
  bodyType: z.enum(["ectomorph", "mesomorph", "endomorph"], { required_error: "Please select your body type." }),
  fitnessLevel: z.enum(["beginner", "intermediate", "advanced"], { required_error: "Please select your fitness level." }),
})

export function OnboardingDetailsForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      age: 25,
      height: [175],
      weight: [70],
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    const params = new URLSearchParams(searchParams);
    params.set('gender', data.gender);
    params.set('age', String(data.age));
    params.set('height', String(data.height[0]));
    params.set('weight', String(data.weight[0]));
    params.set('bodyType', data.bodyType);
    params.set('fitnessLevel', data.fitnessLevel);
    router.push(`/onboarding/lifestyle?${params.toString()}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
         <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Gender</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4"
                  >
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="male" />
                      </FormControl>
                      <FormLabel className="font-normal">Male</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="female" />
                      </FormControl>
                      <FormLabel className="font-normal">Female</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="other" />
                      </FormControl>
                      <FormLabel className="font-normal">Other</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="25" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        <FormField
          control={form.control}
          name="height"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Height: {field.value} cm</FormLabel>
              <FormControl>
                <Slider
                  min={100}
                  max={250}
                  step={1}
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weight: {field.value} kg</FormLabel>
              <FormControl>
                 <Slider
                  min={30}
                  max={300}
                  step={1}
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bodyType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Body Type</FormLabel>
               <FormDescription>
                This helps us understand your metabolism and body composition.
              </FormDescription>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {bodyTypes.map(type => (
                     <FormItem key={type.value} className="h-full">
                        <FormControl>
                           <RadioGroupItem value={type.value} className="sr-only" />
                        </FormControl>
                        <FormLabel className="font-normal h-full">
                           <Card className={cn(
                                "h-full cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-primary",
                                field.value === type.value && "border-primary ring-2 ring-primary"
                            )}>
                                <CardContent className="flex flex-col items-center justify-center text-center p-4">
                                    <Image src={type.image} alt={type.label} width={80} height={120} className="mb-4 rounded-lg" data-ai-hint={type.dataAiHint} />
                                    <p className="font-headline text-lg font-semibold text-foreground">{type.label}</p>
                                    <p className="text-muted-foreground text-xs mt-1">{type.description}</p>
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
          name="fitnessLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Fitness Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your current fitness level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Be honest! This ensures we create a safe and effective plan for you.
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
