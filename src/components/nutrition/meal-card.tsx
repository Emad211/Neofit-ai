import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface Meal {
    type: string;
    name: string;
    calories: number;
    image: string;
    dataAiHint: string;
}

export function MealCard({ meal }: { meal: Meal }) {
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
                     <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <Menu className="h-4 w-4" />
                     </Button>
                </div>
            </CardContent>
        </div>
    </Card>
  );
}
