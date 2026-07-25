import {
  NutritionPlan,
  NutritionPlanSchema,
  WorkoutPlan,
  WorkoutPlanSchema,
} from '@/domain/models';
import { getDatabase } from '@/db/database';

export type PlanSource = 'ai' | 'manual' | 'imported';

type StoredPlan = WorkoutPlan | NutritionPlan;

interface PlanRow {
  payload_json: string;
}

function parsePlan(kind: 'workout', payload: string): WorkoutPlan;
function parsePlan(kind: 'nutrition', payload: string): NutritionPlan;
function parsePlan(kind: 'workout' | 'nutrition', payload: string): StoredPlan {
  const parsed = JSON.parse(payload) as unknown;
  return kind === 'workout'
    ? WorkoutPlanSchema.parse(parsed)
    : NutritionPlanSchema.parse(parsed);
}

export async function saveWorkoutPlan(plan: WorkoutPlan, source: PlanSource = 'ai') {
  return savePlan('workout', WorkoutPlanSchema.parse(plan), source);
}

export async function saveNutritionPlan(plan: NutritionPlan, source: PlanSource = 'ai') {
  return savePlan('nutrition', NutritionPlanSchema.parse(plan), source);
}

async function savePlan(kind: 'workout' | 'nutrition', plan: StoredPlan, source: PlanSource) {
  const database = await getDatabase();

  await database.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync('UPDATE plans SET is_active = 0 WHERE kind = ?;', kind);
    await transaction.runAsync(
      `INSERT INTO plans (
        id, kind, title, summary, payload_json, source, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?);`,
      plan.id,
      kind,
      plan.title,
      plan.summary,
      JSON.stringify(plan),
      source,
      plan.createdAt,
    );
  });

  return plan;
}

export async function getActiveWorkoutPlan() {
  const database = await getDatabase();
  const row = await database.getFirstAsync<PlanRow>(
    `SELECT payload_json FROM plans
     WHERE kind = 'workout' AND is_active = 1
     ORDER BY created_at DESC LIMIT 1;`,
  );
  return row ? parsePlan('workout', row.payload_json) : null;
}

export async function getActiveNutritionPlan() {
  const database = await getDatabase();
  const row = await database.getFirstAsync<PlanRow>(
    `SELECT payload_json FROM plans
     WHERE kind = 'nutrition' AND is_active = 1
     ORDER BY created_at DESC LIMIT 1;`,
  );
  return row ? parsePlan('nutrition', row.payload_json) : null;
}

export async function listPlanHistory(kind: 'workout' | 'nutrition', limit = 20) {
  const database = await getDatabase();
  const safeLimit = Math.min(100, Math.max(1, Math.round(limit)));
  const rows = await database.getAllAsync<{
    id: string;
    title: string;
    summary: string;
    source: PlanSource;
    is_active: number;
    created_at: string;
  }>(
    `SELECT id, title, summary, source, is_active, created_at
     FROM plans WHERE kind = ? ORDER BY created_at DESC LIMIT ?;`,
    kind,
    safeLimit,
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    summary: row.summary,
    source: row.source,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  }));
}

export async function activatePlan(id: string, kind: 'workout' | 'nutrition') {
  const database = await getDatabase();
  await database.withExclusiveTransactionAsync(async (transaction) => {
    const exists = await transaction.getFirstAsync<{ id: string }>(
      'SELECT id FROM plans WHERE id = ? AND kind = ?;',
      id,
      kind,
    );
    if (!exists) throw new Error('Plan not found.');
    await transaction.runAsync('UPDATE plans SET is_active = 0 WHERE kind = ?;', kind);
    await transaction.runAsync('UPDATE plans SET is_active = 1 WHERE id = ?;', id);
  });
}

export async function deletePlan(id: string) {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM plans WHERE id = ?;', id);
}
