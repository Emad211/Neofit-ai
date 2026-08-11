'use client';

import { createBrowserClient } from '@supabase/ssr';
import { parseSupabasePublicEnv } from '@/lib/supabase/env';
import type { Database, Tables } from '@/lib/supabase/database.types';

export interface BodyMeasurement {
  readonly id: string;
  readonly clientMutationId: string;
  readonly localDate: string;
  readonly measuredAt: string;
  readonly weightKg: number | null;
  readonly waistCm: number | null;
  readonly bodyFatPercent: number | null;
  readonly note: string | null;
}

const STORAGE_KEY = 'neofit:body-measurements:v1';
const STORAGE_VERSION = 1;
const MAX_LOCAL_ROWS = 500;

function finiteOrNull(value: unknown): number | null | undefined {
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return value;
}

function parseRow(value: unknown): BodyMeasurement | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const id = typeof row.id === 'string' ? row.id : '';
  const clientMutationId = typeof row.clientMutationId === 'string' ? row.clientMutationId : '';
  const localDate = typeof row.localDate === 'string' ? row.localDate : '';
  const measuredAt = typeof row.measuredAt === 'string' ? row.measuredAt : '';
  const weightKg = finiteOrNull(row.weightKg);
  const waistCm = finiteOrNull(row.waistCm);
  const bodyFatPercent = finiteOrNull(row.bodyFatPercent);
  const note = row.note === null ? null : typeof row.note === 'string' ? row.note.slice(0, 1000) : undefined;
  if (!id || !clientMutationId || !/^\d{4}-\d{2}-\d{2}$/.test(localDate) || !Number.isFinite(Date.parse(measuredAt))) return null;
  if (weightKg === undefined || waistCm === undefined || bodyFatPercent === undefined || note === undefined) return null;
  if (weightKg === null && waistCm === null && bodyFatPercent === null) return null;
  return { id, clientMutationId, localDate, measuredAt, weightKg, waistCm, bodyFatPercent, note };
}

export function readLocalBodyMeasurements(): BodyMeasurement[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { version?: unknown; rows?: unknown };
    if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.rows)) return [];
    return parsed.rows.map(parseRow).filter((row): row is BodyMeasurement => row !== null).slice(-MAX_LOCAL_ROWS);
  } catch {
    return [];
  }
}

export function writeLocalBodyMeasurements(rows: readonly BodyMeasurement[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, rows: rows.slice(-MAX_LOCAL_ROWS) }));
}

export function createMeasurementClient() {
  const { url, publishableKey } = parseSupabasePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  return createBrowserClient<Database>(url, publishableKey);
}

export function rowToBodyMeasurement(row: Tables<'body_measurements'>): BodyMeasurement {
  return {
    id: row.id,
    clientMutationId: row.client_mutation_id,
    localDate: row.local_date,
    measuredAt: row.measured_at,
    weightKg: row.weight_kg,
    waistCm: row.waist_cm,
    bodyFatPercent: row.body_fat_percent,
    note: row.note,
  };
}

export function createLocalMeasurement(input: {
  localDate: string;
  weightKg: number | null;
  waistCm: number | null;
  bodyFatPercent: number | null;
  note: string | null;
}): BodyMeasurement {
  const mutation = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    id: mutation,
    clientMutationId: mutation,
    measuredAt: new Date().toISOString(),
    ...input,
  };
}
