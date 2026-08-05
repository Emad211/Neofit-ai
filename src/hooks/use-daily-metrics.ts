"use client";

import * as React from "react";

export type DailyMetrics = {
  date: string;
  waterMl: number;
  steps: number;
  sleepHours: number;
};

const EVENT_NAME = "neofit:daily-metrics-changed";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function storageKey() {
  return `neofit:daily-metrics:${todayKey()}`;
}

function defaults(): DailyMetrics {
  return { date: todayKey(), waterMl: 1250, steps: 3200, sleepHours: 7.2 };
}

function read(): DailyMetrics {
  if (typeof window === "undefined") return defaults();
  try {
    const raw = window.localStorage.getItem(storageKey());
    return raw ? { ...defaults(), ...JSON.parse(raw) } : defaults();
  } catch {
    return defaults();
  }
}

function persist(value: DailyMetrics) {
  window.localStorage.setItem(storageKey(), JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: value }));
}

export function useDailyMetrics() {
  const [metrics, setMetrics] = React.useState<DailyMetrics>(() => defaults());
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    setMetrics(read());
    setIsReady(true);
    const listener = (event: Event) => setMetrics((event as CustomEvent<DailyMetrics>).detail);
    window.addEventListener(EVENT_NAME, listener);
    return () => window.removeEventListener(EVENT_NAME, listener);
  }, []);

  const update = React.useCallback((patch: Partial<DailyMetrics>) => {
    setMetrics((current) => {
      const next = { ...current, ...patch, date: todayKey() };
      persist(next);
      return next;
    });
  }, []);

  const addWater = React.useCallback((amount = 250) => {
    setMetrics((current) => {
      const next = { ...current, waterMl: Math.max(0, current.waterMl + amount), date: todayKey() };
      persist(next);
      return next;
    });
  }, []);

  return { metrics, isReady, update, addWater };
}
