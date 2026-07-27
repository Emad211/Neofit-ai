import { getDatabase } from '@/db/database';
import { validateNutritionVector, type NutritionGoals, type NutritionVector } from '@/nutrition-core';

export interface PersistedNutritionGoal {
  readonly id: string;
  readonly activeFrom: string;
  readonly goals: NutritionGoals;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface GoalRow {
  id: string;
  active_from: string;
  daily_goals_json: string;
  created_at: string;
  updated_at: string;
}

function parseGoals(value: string): NutritionGoals {
  let daily: NutritionVector = {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      daily = parsed as NutritionVector;
    }
  } catch {
    daily = {};
  }
  validateNutritionVector(daily);
  return { daily };
}

function mapGoalRow(row: GoalRow): PersistedNutritionGoal {
  return {
    id: row.id,
    activeFrom: row.active_from,
    goals: parseGoals(row.daily_goals_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function saveNutritionGoal(goal: PersistedNutritionGoal): Promise<void> {
  validateNutritionVector(goal.goals.daily);
  // An empty vector is a deliberate active state that disables older goals
  // without deleting their historical records.
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO nutrition_goals (
       id, active_from, daily_goals_json, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       active_from = excluded.active_from,
       daily_goals_json = excluded.daily_goals_json,
       updated_at = excluded.updated_at;`,
    goal.id,
    goal.activeFrom,
    JSON.stringify(goal.goals.daily),
    goal.createdAt,
    goal.updatedAt,
  );
}

export async function getActiveNutritionGoal(atDate: string): Promise<PersistedNutritionGoal | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<GoalRow>(
    `SELECT * FROM nutrition_goals
     WHERE active_from <= ?
     ORDER BY active_from DESC, updated_at DESC
     LIMIT 1;`,
    atDate,
  );
  return row ? mapGoalRow(row) : null;
}

export async function listNutritionGoals(limit = 1_000): Promise<PersistedNutritionGoal[]> {
  const safeLimit = Math.min(10_000, Math.max(1, Math.round(limit)));
  const database = await getDatabase();
  const rows = await database.getAllAsync<GoalRow>(
    `SELECT * FROM nutrition_goals
     ORDER BY active_from DESC, updated_at DESC
     LIMIT ?;`,
    safeLimit,
  );
  return rows.map(mapGoalRow);
}
