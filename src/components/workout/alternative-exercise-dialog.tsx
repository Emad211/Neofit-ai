
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
import { useUserData } from "@/context/user-profile-context"

type AlternativeExerciseDialogProps = {
  currentExerciseName: string;
  onSelectExercise: (exerciseName: string) => void;
  // In a real app, these would be fetched from the user's profile
  availableEquipment: string;
  medicalLimitations: string;
};

export function AlternativeExerciseDialog({
  currentExerciseName,
  onSelectExercise,
  availableEquipment,
  medicalLimitations,
}: AlternativeExerciseDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [alternative, setAlternative] = React.useState<{ alternativeExercise: string; reason: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const { user } = useUserData();

  const fetchAlternative = React.useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    setAlternative(null);
    try {
      const result = await getAlternativeExercise({
        userId: user.uid,
        exerciseId: currentExerciseName,
        availableEquipment: availableEquipment,
        medicalLimitations: medicalLimitations,
      });
      setAlternative(result);
    } catch (e) {
      console.error(e);
      setError("Could not fetch an alternative exercise. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentExerciseName, availableEquipment, medicalLimitations, user]);
  
  // Fetch alternative when dialog is opened
  React.useEffect(() => {
    if (isOpen) {
        fetchAlternative();
    }
  }, [isOpen, fetchAlternative]);

  const handleReplace = () => {
    if (alternative) {
        onSelectExercise(alternative.alternativeExercise);
        setIsOpen(false);
    }
  }

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
            Here is a suggested alternative for {currentExerciseName}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 min-h-[10rem] flex items-center justify-center">
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
            <Button onClick={handleReplace} disabled={!alternative}>
                Replace Exercise
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
