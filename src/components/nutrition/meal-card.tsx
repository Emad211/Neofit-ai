
"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu, Eye, Replace, CheckCircle, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Meal {
    type: string;
    name: string;
    calories: number;
    image: string;
    dataAiHint: string;
}

export function MealCard({ meal }: { meal: Meal }) {

    const handleAction = (action: string) => {
        console.log(`${action}: ${meal.name}`);
        // Here you would implement the logic for each action,
        // e.g., opening a dialog, calling an API, etc.
    }

  return (
    <Card className="overflow-hidden shadow-none border-0 bg-secondary/50">
        <div className="flex items-center">
            <div className="w-24 h-24 relative flex-shrink-0">
                <Image
                    src={meal.image}
                    alt={meal.name}
                    fill
                    className="object-cover"
                    data-ai-hint={meal.dataAiHint}
                />
            </div>
            <CardContent className="p-3 flex-grow">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-sm text-primary">{meal.type}</p>
                        <p className="font-bold text-base text-foreground">{meal.name}</p>
                        <p className="text-sm text-muted-foreground">{meal.calories} kcal</p>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                <Menu className="h-4 w-4" />
                             </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleAction('View Details')}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction('Replace Meal')}>
                                <Replace className="mr-2 h-4 w-4" />
                                <span>Replace Meal</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction('Log as Eaten')}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                <span>Log as Eaten</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleAction('Remove from Plan')} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Remove</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </div>
    </Card>
  );
}
