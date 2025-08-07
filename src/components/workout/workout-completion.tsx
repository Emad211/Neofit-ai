
"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Award, Check, Clock, Repeat, Weight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Confetti from 'react-confetti';
import { useWindowSize } from '@uidotdev/usehooks';
import type { Exercise, Log } from './workout-player';

type WorkoutSession = {
    id: string;
    name: string;
    exercises: Exercise[];
}

interface WorkoutCompletionProps {
  session: WorkoutSession;
  totalDuration: number;
}

const StatCard = ({ icon, title, value }: { icon: React.ReactNode, title: string, value: string | number }) => (
    <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-secondary text-center">
        <div className="text-primary mb-2">{icon}</div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
);


export function WorkoutCompletion({ session, totalDuration }: WorkoutCompletionProps) {
  const router = useRouter();
  const { width, height } = useWindowSize();

  const totalVolume = React.useMemo(() => {
    return session.exercises.reduce((total, exercise) => {
      const exerciseVolume = exercise.logs.reduce((exTotal: number, log: Log) => {
        const reps = parseInt(log.reps, 10);
        const weight = parseFloat(log.weight);
        if (!isNaN(reps) && !isNaN(weight)) {
          return exTotal + (reps * weight);
        }
        return exTotal;
      }, 0);
      return total + exerciseVolume;
    }, 0);
  }, [session.exercises]);

  return (
    <>
        <Confetti
            width={width ?? 0}
            height={height ?? 0}
            recycle={false}
            numberOfPieces={400}
            gravity={0.1}
        />
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
            <div className="max-w-2xl">
                <Award className="h-20 w-20 text-accent mx-auto animate-pulse" />
                <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl font-headline">
                    Workout Complete!
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Amazing work. You crushed it! Here is your summary for {session.name}.
                </p>

                <div className="my-8 grid grid-cols-2 md:grid-cols-3 gap-4">
                    <StatCard icon={<Clock className="h-8 w-8" />} title="Duration" value={`${totalDuration} min`} />
                    <StatCard icon={<Weight className="h-8 w-8" />} title="Total Volume" value={`${Math.round(totalVolume)} kg`} />
                    <StatCard icon={<Repeat className="h-8 w-8" />} title="Exercises" value={session.exercises.length} />
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Exercises Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="divide-y divide-border">
                            {session.exercises.map(exercise => (
                                <li key={exercise.id} className="py-2 flex items-center justify-between text-sm">
                                    <span className="font-medium">{exercise.name}</span>
                                    <span className="text-muted-foreground">{exercise.sets} Sets</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
                
                <div className="mt-10">
                    <Button onClick={() => router.push('/today')} size="lg" className="w-full max-w-sm">
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    </>
  );
}

