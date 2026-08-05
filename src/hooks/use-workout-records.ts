"use client";

import * as React from "react";
import {
  readWorkoutRecords,
  WORKOUT_RECORDS_EVENT,
  type PersonalRecord,
} from "@/lib/workout-records";

export function useWorkoutRecords() {
  const [records, setRecords] = React.useState<PersonalRecord[]>([]);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setRecords(readWorkoutRecords());
    setIsHydrated(true);
    const listener = (event: Event) => setRecords((event as CustomEvent<PersonalRecord[]>).detail);
    window.addEventListener(WORKOUT_RECORDS_EVENT, listener);
    return () => window.removeEventListener(WORKOUT_RECORDS_EVENT, listener);
  }, []);

  return { records, isHydrated };
}
