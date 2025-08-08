// src/components/dashboard/log-entry-sheet.tsx
"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Apple, Dumbbell, Weight, Sparkles, Loader2 } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { calculateActivityCalories } from "@/ai/flows/calculate-activity-calories"
import { useToast } from "@/hooks/use-toast"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { cn } from "@/lib/utils"
import { useUserData } from "@/context/user-profile-context"

export type LogType = "meal" | "activity" | "weight" | null;

const logConfig = {
    meal: {
        title: "Log Meal",
        description: "Record a meal you've eaten.",
        icon: Apple
    },
    activity: {
        title: "Log Activity",
        description: "Add a workout or other physical activity.",
        icon: Dumbbell
    },
    weight: {
        title: "Log Weight",
        description: "Update your current weight.",
        icon: Weight
    }
}

interface LogEntrySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logType: Exclude<LogType, null>;
}

export function LogEntrySheet({ open, onOpenChange, logType }: LogEntrySheetProps) {
    const config = logConfig[logType];
    const { toast } = useToast();
    const { userProfile, logMeal, logActivity, logWeight } = useUserData();
    const [isCalculating, setIsCalculating] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [calculatedCalories, setCalculatedCalories] = React.useState<number | null>(null);

    const { register, handleSubmit, watch, setValue, control, reset } = useForm({
        defaultValues: {
            // Activity
            activityType: '',
            durationMinutes: '',
            intensity: 'medium',
            caloriesBurned: '',
            // Meal
            mealType: 'snack',
            description: '',
            calories: '',
            // Weight
            weight: ''
        }
    });

    React.useEffect(() => {
        // Reset form when the sheet is closed or logType changes
        reset();
        setCalculatedCalories(null);
    }, [open, logType, reset]);
    
    const activityType = watch('activityType');
    const durationMinutes = watch('durationMinutes');
    const intensity = watch('intensity');

    const handleCalculateCalories = async () => {
        if (!activityType || !durationMinutes) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please enter an activity and duration.",
            })
            return;
        }
        if (!userProfile) {
            toast({
                variant: "destructive",
                title: "User Profile not found",
                description: "Cannot calculate calories without user data.",
            })
            return;
        }
        setIsCalculating(true);
        setCalculatedCalories(null);
        try {
            const result = await calculateActivityCalories({
                activityType: activityType,
                durationMinutes: parseInt(durationMinutes, 10),
                intensity: intensity as "low" | "medium" | "high",
                userProfile: {
                    weightKg: userProfile.weight, 
                    age: userProfile.age,
                    gender: userProfile.gender,
                    heightCm: userProfile.height
                }
            });
            setValue('caloriesBurned', String(result.caloriesBurned));
            setCalculatedCalories(result.caloriesBurned);
        } catch (e) {
            console.error(e);
            toast({
                variant: "destructive",
                title: "Calculation Failed",
                description: "Could not estimate calories. Please try again.",
            })
        } finally {
            setIsCalculating(false);
        }
    }


    const onFormSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            switch(logType) {
                case 'meal':
                    await logMeal({
                        mealType: data.mealType,
                        description: data.description,
                        calories: parseInt(data.calories, 10)
                    });
                    break;
                case 'activity':
                    await logActivity({
                        activityType: data.activityType,
                        durationMinutes: parseInt(data.durationMinutes, 10),
                        intensity: data.intensity,
                        caloriesBurned: parseInt(data.caloriesBurned, 10) || 0
                    });
                    break;
                case 'weight':
                    await logWeight({
                        weight: parseFloat(data.weight)
                    });
                    break;
            }
            toast({
                title: "Log Saved!",
                description: `Your ${logType} has been successfully saved.`,
            })
            onOpenChange(false);
        } catch (error) {
             console.error(`Failed to log ${logType}`, error);
             toast({
                variant: 'destructive',
                title: "Save Failed",
                description: `There was an error saving your ${logType}. Please try again.`,
            });
        } finally {
            setIsSubmitting(false);
        }
    }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <form onSubmit={handleSubmit(onFormSubmit)}>
            <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
                <config.icon className="h-6 w-6 text-primary" />
                {config.title}
            </SheetTitle>
            <SheetDescription>{config.description}</SheetDescription>
            </SheetHeader>
            <div className="grid gap-6 py-6">
            {logType === 'meal' && (
                <>
                    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-4 sm:gap-4">
                        <Label htmlFor="mealType" className="sm:text-right">Meal</Label>
                        <Controller
                            name="mealType"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger className="sm:col-span-3">
                                        <SelectValue placeholder="Select a meal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="breakfast">Breakfast</SelectItem>
                                        <SelectItem value="lunch">Lunch</SelectItem>
                                        <SelectItem value="dinner">Dinner</SelectItem>
                                        <SelectItem value="snack">Snack</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-4 sm:gap-4">
                        <Label htmlFor="description" className="sm:text-right">Description</Label>
                        <Input id="description" placeholder="e.g., Protein shake" className="sm:col-span-3" {...register("description", { required: true })} />
                    </div>
                    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-4 sm:gap-4">
                        <Label htmlFor="calories" className="sm:text-right">Calories</Label>
                        <Input id="calories" type="number" placeholder="e.g., 450" className="sm:col-span-3" {...register("calories", { required: true })} />
                    </div>
                </>
            )}
            {logType === 'activity' && (
                 <>
                    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-4 sm:gap-4">
                        <Label htmlFor="activity-type" className="sm:text-right">Activity</Label>
                        <Input id="activity-type" placeholder="e.g., Morning Run" className="sm:col-span-3" {...register("activityType", { required: true })} />
                    </div>
                    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-4 sm:gap-4">
                        <Label htmlFor="durationMinutes" className="sm:text-right">Duration</Label>
                        <Input id="durationMinutes" type="number" placeholder="in minutes" className="sm:col-span-3" {...register("durationMinutes", { required: true })} />
                    </div>
                     <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-4 sm:gap-4">
                        <Label className="sm:text-right">Intensity</Label>
                         <div className="sm:col-span-3">
                            <Controller
                                name="intensity"
                                control={control}
                                render={({ field }) => (
                                     <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="grid grid-cols-3 gap-2"
                                        >
                                        {['low', 'medium', 'high'].map((level) => (
                                            <Label key={level} className={cn("cursor-pointer rounded-md border p-3 text-center text-sm font-normal", field.value === level && "border-primary ring-2 ring-primary")}>
                                                <RadioGroupItem value={level} className="sr-only" />
                                                {level.charAt(0).toUpperCase() + level.slice(1)}
                                            </Label>
                                        ))}
                                    </RadioGroup>
                                )}
                            />
                         </div>
                    </div>
                    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-4 sm:gap-4">
                        <Label htmlFor="calories-burned" className="sm:text-right">Calories</Label>
                        <Input id="calories-burned" type="number" placeholder="Click calculate" className="sm:col-span-3" {...register("caloriesBurned")} readOnly />
                    </div>
                    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-4 sm:gap-4">
                        <div className="sm:col-start-2 sm:col-span-3">
                          <Button type="button" variant="outline" size="sm" onClick={handleCalculateCalories} disabled={isCalculating}>
                              {isCalculating ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                  <Sparkles className="mr-2 h-4 w-4" />
                              )}
                              Calculate Calories
                          </Button>
                        </div>
                    </div>
                </>
            )}
            {logType === 'weight' && (
                <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-4 sm:gap-4">
                    <Label htmlFor="current-weight" className="sm:text-right">Weight</Label>
                    <div className="sm:col-span-3 flex items-center gap-2">
                        <Input id="current-weight" type="number" step="0.1" placeholder="e.g., 70.5" {...register("weight", { required: true })} />
                        <span>kg</span>
                    </div>
                </div>
            )}
            </div>
            <SheetFooter>
            <SheetClose asChild>
                <Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button>
            </SheetClose>
            <Button type="submit" disabled={isSubmitting}>
                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Log
            </Button>
            </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
