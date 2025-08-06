// src/components/dashboard/log-entry-sheet.tsx
"use client"

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
import { Apple, Dumbbell, Weight, Flame } from "lucide-react"

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

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // Here you would typically handle form submission, e.g., send data to an API
        console.log(`Submitting ${logType} log...`);
        onOpenChange(false);
    }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <form onSubmit={handleSubmit}>
            <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
                <config.icon className="h-6 w-6 text-primary" />
                {config.title}
            </SheetTitle>
            <SheetDescription>{config.description}</SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-6">
            {logType === 'meal' && (
                <>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="meal-type" className="text-right">Meal</Label>
                        <Select>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a meal" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="breakfast">Breakfast</SelectItem>
                                <SelectItem value="lunch">Lunch</SelectItem>
                                <SelectItem value="dinner">Dinner</SelectItem>
                                <SelectItem value="snack">Snack</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="meal-description" className="text-right">Description</Label>
                        <Input id="meal-description" placeholder="e.g., Protein shake" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="calories" className="text-right">Calories</Label>
                        <Input id="calories" type="number" placeholder="e.g., 450" className="col-span-3" />
                    </div>
                </>
            )}
            {logType === 'activity' && (
                 <>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="activity-type" className="text-right">Activity</Label>
                        <Input id="activity-type" placeholder="e.g., Morning Run" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="duration" className="text-right">Duration</Label>
                        <Input id="duration" type="number" placeholder="in minutes" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="calories-burned" className="text-right">Calories Burned</Label>
                        <Input id="calories-burned" type="number" placeholder="e.g., 300" className="col-span-3" />
                    </div>
                </>
            )}
            {logType === 'weight' && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="current-weight" className="text-right">Weight</Label>
                    <div className="col-span-3 flex items-center gap-2">
                        <Input id="current-weight" type="number" step="0.1" placeholder="e.g., 70.5" />
                        <span>kg</span>
                    </div>
                </div>
            )}
            </div>
            <SheetFooter>
            <SheetClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
            </SheetClose>
            <Button type="submit">Save Log</Button>
            </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
