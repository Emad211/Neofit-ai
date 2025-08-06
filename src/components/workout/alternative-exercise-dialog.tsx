"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "../ui/button"
import { Replace, Loader2, RefreshCw } from "lucide-react"
import { getAlternativeExercise } from "@/ai/flows/get-alternative-exercise"
import { Card, CardContent } from "../ui/card"

type AlternativeExerciseDialogProps = {
  currentExerciseId: string;
  onSelectExercise: (exerciseId: string) => void;
};

export function AlternativeExerciseDialog({
  currentExerciseId,
  onSelectExercise,
}: AlternativeExerciseDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [alternative, setAlternative] = React.useState<{ alternativeExercise: string; reason: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAlternative = async () => {
    setIsLoading(true);
    setError(null);
    setAlternative(null);
    try {
      const result = await getAlternativeExercise({
        userId: "12345", // In a real app, use the actual user ID
        exerciseId: currentExerciseId,
        availableEquipment: "dumbbells, resistance band", // This should be dynamic based on user profile
        medicalLimitations: "Previous knee injury on right leg", // This should also be dynamic
      });
      setAlternative(result);
    } catch (e) {
      console.error(e);
      setError("Could not fetch an alternative exercise. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch alternative when dialog is opened
  React.useEffect(() => {
    if (isOpen) {
        fetchAlternative();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Replace className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alternative Exercise</DialogTitle>
          <DialogDescription>
            Here is a suggested alternative for {currentExerciseId}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            {isLoading && (
                <div className="flex items-center justify-center h-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            {error && <p className="text-destructive text-center">{error}</p>}
            {alternative && (
                <Card>
                    <CardContent className="p-4">
                        <h3 className="font-bold text-lg text-primary">{alternative.alternativeExercise}</h3>
                        <p className="text-sm text-muted-foreground mt-2">{alternative.reason}</p>
                    </CardContent>
                </Card>
            )}
        </div>
        <DialogFooter>
            <Button variant="secondary" onClick={fetchAlternative} disabled={isLoading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Suggest Another
            </Button>
            <DialogClose asChild>
                <Button onClick={() => alternative && onSelectExercise(alternative.alternativeExercise)}>
                    Replace Exercise
                </Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
