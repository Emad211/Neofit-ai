"use client"

import * as React from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { PlayCircle, Flame, Clock } from "lucide-react";
import { Badge } from "../ui/badge";
import Link from "next/link";

const workoutData = [
    {
        id: 'full-body-a',
        day: 'Day 1',
        title: 'Full Body Strength A',
        focus: 'Strength Training',
        duration: '45-60 min',
        calories: '350 kcal',
        exercises: [
            { name: 'Barbell Squats', sets: '3', reps: '8-12' },
            { name: 'Bench Press', sets: '3', reps: '8-12' },
            { name: 'Bent Over Rows', sets: '3', reps: '8-12' },
            { name: 'Overhead Press', sets: '3', reps: '8-12' },
            { name: 'Plank', sets: '3', reps: '30-60s' },
        ],
    },
    {
        id: 'cardio-core',
        day: 'Day 2',
        title: 'Cardio & Core',
        focus: 'Cardiovascular',
        duration: '30-45 min',
        calories: '300 kcal',
        exercises: [
            { name: 'Running (Treadmill)', sets: '1', reps: '25 min' },
            { name: 'Crunches', sets: '3', reps: '15-20' },
            { name: 'Leg Raises', sets: '3', reps: '15-20' },
            { name: 'Russian Twists', sets: '3', reps: '15-20' },
        ],
    },
    {
        id: 'full-body-b',
        day: 'Day 3',
        title: 'Full Body Strength B',
        focus: 'Strength Training',
        duration: '45-60 min',
        calories: '400 kcal',
        exercises: [
            { name: 'Deadlifts', sets: '3', reps: '5-8' },
            { name: 'Pull Ups / Lat Pulldowns', sets: '3', reps: '8-12' },
            { name: 'Dumbbell Lunges', sets: '3', reps: '10-15 each leg' },
            { name: 'Dips / Push-ups', sets: '3', reps: 'AMRAP' },
            { name: 'Hanging Knee Raises', sets: '3', reps: '15-20' },
        ],
    },
    {
      id: 'active-recovery',
      day: 'Day 4',
      title: 'Active Recovery',
      focus: 'Flexibility',
      duration: '20-30 min',
      calories: '100 kcal',
      exercises: [
          { name: 'Light Jogging or Cycling', sets: '1', reps: '15 min' },
          { name: 'Full Body Stretching', sets: '1', reps: '10 min' },
      ],
  }
];

export function WorkoutPlan() {
  return (
    <Carousel
      opts={{
        align: "start",
      }}
      className="w-full"
    >
      <CarouselContent>
        {workoutData.map((workout, index) => (
          <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
            <div className="p-1 h-full">
                <Card className="flex flex-col h-full">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardDescription className="text-primary font-semibold">{workout.day}</CardDescription>
                                <CardTitle className="font-headline text-2xl">{workout.title}</CardTitle>
                            </div>
                            <Badge variant="secondary">{workout.focus}</Badge>
                        </div>
                         <div className="flex items-center text-sm text-muted-foreground gap-4 pt-2">
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{workout.duration}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Flame className="h-4 w-4" />
                                <span>{workout.calories}</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <ul className="divide-y">
                            {workout.exercises.map((exercise, exIndex) => (
                                <li key={exIndex} className="py-2 flex justify-between items-center">
                                    <span className="font-medium">{exercise.name}</span>
                                    <span className="text-muted-foreground">{exercise.sets} x {exercise.reps}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                    <div className="p-6 pt-0 mt-auto">
                        <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" asChild>
                            <Link href={`/workout-player/${workout.id}`}>
                                <PlayCircle className="mr-2 h-5 w-5" />
                                Start Workout
                            </Link>
                        </Button>
                    </div>
                </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  )
}
