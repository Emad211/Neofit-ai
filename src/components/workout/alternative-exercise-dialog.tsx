
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
} from "@/components/ui/dialog"
import { Button } from "../ui/button"
import { Replace, Loader2, Dumbbell, Shield, Sparkles } from "lucide-react"
import { getAlternativeExercise } from "@/ai/flows/get-alternative-exercise"
import { Card, CardContent } from "../ui/card"
import { useUserData } from "@/context/user-profile-context"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { Label } from "../ui/label"
import { cn } from "@/lib/utils"

type AlternativeExerciseDialogProps = {
  currentExerciseName: string;
  onSelectExercise: (exerciseName: string) => void;
  availableEquipment: string;
  medicalLimitations: string;
};

type Reason = 'no_equipment' | 'causes_pain';

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
  const [reason, setReason] = React.useState<Reason | null>(null);
  const { user, userProfile } = useUserData();

  const fetchAlternative = async () => {
    if (!user || !userProfile || !reason) return;
    setIsLoading(true);
    setError(null);
    setAlternative(null);
    try {
      const result = await getAlternativeExercise({
        userId: user.uid,
        exerciseName: currentExerciseName,
        availableEquipment: availableEquipment,
        medicalLimitations: medicalLimitations,
        reasonForChange: reason,
        geminiApiKey: userProfile.geminiApiKey,
      });
      setAlternative(result);
    } catch (e) {
      console.error(e);
      setError("Could not fetch an alternative exercise. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setAlternative(null);
    setError(null);
    setReason(null);
    setIsLoading(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetState();
    }
  };


  const handleReplace = () => {
    if (alternative) {
        onSelectExercise(alternative.alternativeExercise);
        handleOpenChange(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Replace className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Need a Different Exercise?</DialogTitle>
          <DialogDescription>
            Let us know why you need an alternative for {currentExerciseName}.
          </DialogDescription>
        </DialogHeader>
        
        {!alternative && (
             <div className="py-4 space-y-6">
                <div>
                    <Label className="font-semibold">What's the issue?</Label>
                    <RadioGroup
                        value={reason || ''}
                        onValueChange={(value) => setReason(value as Reason)}
                        className="grid grid-cols-2 gap-4 mt-2"
                    >
                        <Label className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", reason === 'no_equipment' && "border-primary")}>
                            <RadioGroupItem value="no_equipment" id="r1" className="sr-only" />
                            <Dumbbell className="mb-2 h-8 w-8" />
                            <span className="text-center font-normal">I don't have the equipment</span>
                        </Label>
                        <Label className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", reason === 'causes_pain' && "border-primary")}>
                             <RadioGroupItem value="causes_pain" id="r2" className="sr-only" />
                            <Shield className="mb-2 h-8 w-8" />
                            <span className="text-center font-normal">This move causes pain</span>
                        </Label>
                    </RadioGroup>
                </div>
                 <Button onClick={fetchAlternative} disabled={!reason || isLoading} className="w-full">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Suggest an Alternative
                </Button>
            </div>
        )}
       

        <div className="py-4 min-h-[8rem] flex items-center justify-center">
            {isLoading && (
                <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-2 text-sm">Finding the perfect swap...</p>
                </div>
            )}
            {error && <p className="text-destructive text-center">{error}</p>}
            {alternative && (
                <Card className="w-full animate-in fade-in-50">
                    <CardContent className="p-4 text-center">
                        <h3 className="font-bold text-xl text-primary">{alternative.alternativeExercise}</h3>
                        <p className="text-sm text-muted-foreground mt-2">{alternative.reason}</p>
                    </CardContent>
                </Card>
            )}
        </div>
        <DialogFooter>
            <Button variant="secondary" onClick={resetState} disabled={isLoading}>
                Start Over
            </Button>
            <Button onClick={handleReplace} disabled={!alternative}>
                Replace Exercise
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
