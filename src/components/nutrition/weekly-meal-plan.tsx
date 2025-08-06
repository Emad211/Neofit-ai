"use client"

import * as React from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { MealCard } from "./meal-card";
import { format, addDays } from 'date-fns';

const mealData = [
    {
      day: 'Monday',
      date: new Date(),
      meals: [
        { type: 'Breakfast', name: 'Oatmeal with Berries', calories: 350, image: 'https://placehold.co/600x400.png', dataAiHint: 'oatmeal berries' },
        { type: 'Lunch', name: 'Quinoa Salad', calories: 500, image: 'https://placehold.co/600x400.png', dataAiHint: 'quinoa salad' },
        { type: 'Dinner', name: 'Baked Salmon', calories: 600, image: 'https://placehold.co/600x400.png', dataAiHint: 'baked salmon' },
      ],
      totalCalories: 1450,
    },
    {
      day: 'Tuesday',
      date: addDays(new Date(), 1),
      meals: [
        { type: 'Breakfast', name: 'Greek Yogurt with Nuts', calories: 400, image: 'https://placehold.co/600x400.png', dataAiHint: 'yogurt nuts' },
        { type: 'Lunch', name: 'Chicken Wrap', calories: 550, image: 'https://placehold.co/600x400.png', dataAiHint: 'chicken wrap' },
        { type: 'Dinner', name: 'Lentil Soup', calories: 450, image: 'https://placehold.co/600x400.png', dataAiHint: 'lentil soup' },
      ],
      totalCalories: 1400,
    },
    {
      day: 'Wednesday',
      date: addDays(new Date(), 2),
      meals: [
        { type: 'Breakfast', name: 'Scrambled Eggs', calories: 300, image: 'https://placehold.co/600x400.png', dataAiHint: 'scrambled eggs' },
        { type: 'Lunch', name: 'Tuna Sandwich', calories: 480, image: 'https://placehold.co/600x400.png', dataAiHint: 'tuna sandwich' },
        { type: 'Dinner', name: 'Spaghetti Bolognese', calories: 650, image: 'https://placehold.co/600x400.png', dataAiHint: 'spaghetti bolognese' },
      ],
      totalCalories: 1430,
    },
     {
      day: 'Thursday',
      date: addDays(new Date(), 3),
      meals: [
        { type: 'Breakfast', name: 'Protein Pancakes', calories: 450, image: 'https://placehold.co/600x400.png', dataAiHint: 'protein pancakes' },
        { type: 'Lunch', name: 'Leftover Spaghetti', calories: 650, image: 'https://placehold.co/600x400.png', dataAiHint: 'spaghetti bolognese' },
        { type: 'Dinner', name: 'Chicken Stir-fry', calories: 550, image: 'https://placehold.co/600x400.png', dataAiHint: 'chicken stir-fry' },
      ],
      totalCalories: 1650,
    },
    {
      day: 'Friday',
      date: addDays(new Date(), 4),
      meals: [
        { type: 'Breakfast', name: 'Avocado Toast', calories: 380, image: 'https://placehold.co/600x400.png', dataAiHint: 'avocado toast' },
        { type: 'Lunch', name: 'Caesar Salad with Chicken', calories: 520, image: 'https://placehold.co/600x400.png', dataAiHint: 'caesar salad' },
        { type: 'Dinner', name: 'Pizza Night', calories: 800, image: 'https://placehold.co/600x400.png', dataAiHint: 'pizza' },
      ],
      totalCalories: 1700,
    },
    {
      day: 'Saturday',
      date: addDays(new Date(), 5),
       meals: [
        { type: 'Breakfast', name: 'Fruit Smoothie', calories: 300, image: 'https://placehold.co/600x400.png', dataAiHint: 'fruit smoothie' },
        { type: 'Lunch', name: 'Sushi', calories: 600, image: 'https://placehold.co/600x400.png', dataAiHint: 'sushi' },
        { type: 'Dinner', name: 'Steak and Veggies', calories: 700, image: 'https://placehold.co/600x400.png', dataAiHint: 'steak vegetables' },
      ],
      totalCalories: 1600,
    },
    {
      day: 'Sunday',
      date: addDays(new Date(), 6),
      meals: [
        { type: 'Brunch', name: 'Waffles and Bacon', calories: 700, image: 'https://placehold.co/600x400.png', dataAiHint: 'waffles bacon' },
        { type: 'Dinner', name: 'Roast Chicken', calories: 650, image: 'https://placehold.co/600x400.png', dataAiHint: 'roast chicken' },
      ],
      totalCalories: 1350,
    }
  ];

export function WeeklyMealPlan() {
  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent>
        {mealData.map((dayPlan, index) => (
          <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
            <div className="p-1">
                <div className="bg-card border rounded-lg p-4 h-full">
                    <div className="text-center mb-4">
                        <p className="text-lg font-bold font-headline">{dayPlan.day}</p>
                        <p className="text-sm text-muted-foreground">{format(dayPlan.date, 'do MMMM')}</p>
                    </div>
                    <div className="space-y-4">
                        {dayPlan.meals.map(meal => (
                            <MealCard key={meal.name} meal={meal} />
                        ))}
                    </div>
                     <div className="text-center mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">Total Calories</p>
                        <p className="text-xl font-bold text-primary">{dayPlan.totalCalories} kcal</p>
                    </div>
                </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:flex" />
      <CarouselNext className="hidden sm:flex" />
    </Carousel>
  )
}
