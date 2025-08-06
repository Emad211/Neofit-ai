"use client";

import * as React from "react";
import { Button } from "../ui/button";

export function WorkoutTimer({
  duration,
  onComplete,
  exerciseName,
}: {
  duration: number;
  onComplete: () => void;
  exerciseName?: string;
}) {
  const [timeLeft, setTimeLeft] = React.useState(duration);
  const [isPaused, setIsPaused] = React.useState(false);

  React.useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }
    if (isPaused) return;

    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    // Haptic feedback on certain intervals
    if ([1, 2, 3].includes(timeLeft)) {
        if (typeof window.navigator.vibrate === 'function') {
            window.navigator.vibrate(200);
        }
    } else if (timeLeft === 0) {
         if (typeof window.navigator.vibrate === 'function') {
            window.navigator.vibrate([500, 100, 500]);
        }
    }


    return () => clearInterval(intervalId);
  }, [timeLeft, onComplete, isPaused]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-950 text-white p-4">
      <div className="text-center mb-8">
        <p className="text-lg text-gray-400">Rest</p>
        {exerciseName && (
          <p className="text-xl font-bold text-primary">{exerciseName}</p>
        )}
      </div>

      <div className="relative flex h-64 w-64 items-center justify-center">
        <svg className="absolute h-full w-full" viewBox="0 0 100 100">
          <circle
            className="stroke-gray-800"
            strokeWidth="8"
            cx="50"
            cy="50"
            r="45"
            fill="transparent"
          />
          <circle
            className="stroke-primary"
            strokeWidth="8"
            cx="50"
            cy="50"
            r="45"
            fill="transparent"
            strokeDasharray="282.743"
            strokeDashoffset={282.743 - (progress / 100) * 282.743}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="z-10 text-center">
          <span className="text-6xl font-bold tabular-nums">
            {String(minutes).padStart(2, "0")}:
            {String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>

      <div className="mt-12 flex items-center gap-4">
        <Button
          variant="secondary"
          className="h-16 w-32 text-lg"
          onClick={() => onComplete()}
        >
          Skip
        </Button>
        <Button
          className="h-16 w-32 text-lg"
          onClick={() => setIsPaused(!isPaused)}
        >
          {isPaused ? "Resume" : "Pause"}
        </Button>
      </div>
    </div>
  );
}
