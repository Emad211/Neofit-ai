"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { Dumbbell, HeartPulse, MoveRight, Scale } from "lucide-react"
import { cn } from "@/lib/utils"

const goals = [
  { value: "lose_weight", label: "Lose Weight", icon: Scale, description: "Reach your ideal weight with a personalized plan." },
  { value: "gain_muscle", label: "Gain Muscle", icon: Dumbbell, description: "Build strength and muscle mass effectively." },
  { value: "improve_fitness", label: "Improve Fitness", icon: HeartPulse, description: "Enhance your overall health and energy levels." },
]

const FormSchema = z.object({
  goal: z.enum(["lose_weight", "gain_muscle", "improve_fitness"], {
    required_error: "You need to select a primary goal.",
  }),
})

export function OnboardingGoalForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    router.push(`/onboarding/details?goal=${data.goal}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <FormField
          control={form.control}
          name="goal"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {goals.map(goal => (
                     <FormItem key={goal.value} className="h-full">
                        <FormControl>
                           <RadioGroupItem value={goal.value} className="sr-only" />
                        </FormControl>
                        <FormLabel className="font-normal h-full">
                           <Card className={cn(
                                "h-full cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-primary",
                                field.value === goal.value && "border-primary ring-2 ring-primary"
                            )}>
                                <CardContent className="flex flex-col items-center justify-center text-center p-6">
                                    <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                                        <goal.icon className="h-10 w-10" />
                                    </div>
                                    <p className="font-headline text-xl font-semibold text-foreground">{goal.label}</p>
                                    <p className="text-muted-foreground text-sm mt-1">{goal.description}</p>
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
        <Button type="submit" size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          Next <MoveRight className="ml-2 h-5 w-5" />
        </Button>
      </form>
    </Form>
  )
}
