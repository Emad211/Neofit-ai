import { NUTRIENT_KEYS } from './types';
import type {
  GoalProgressItem,
  NutrientKey,
  NutritionGoalMode,
  NutritionGoals,
  NutritionVector,
} from './types';

const MAXIMUM_GOALS = new Set<NutrientKey>(['sugarsG', 'sodiumMg', 'cholesterolMg']);
const MINIMUM_GOALS = new Set<NutrientKey>([
  'fiberG',
  'calciumMg',
  'ironMg',
  'potassiumMg',
  'vitaminCMg',
]);

export function nutritionGoalMode(nutrient: NutrientKey): NutritionGoalMode {
  if (MAXIMUM_GOALS.has(nutrient)) return 'maximum';
  if (MINIMUM_GOALS.has(nutrient)) return 'minimum';
  return 'target';
}

export function calculateGoalProgress(
  consumed: NutritionVector,
  goals: NutritionGoals,
): GoalProgressItem[] {
  const progress: GoalProgressItem[] = [];
  for (const nutrient of NUTRIENT_KEYS) {
    const goal = goals.daily[nutrient];
    if (goal === undefined || !Number.isFinite(goal) || goal <= 0) continue;
    const consumedValue = consumed[nutrient];
    const mode = nutritionGoalMode(nutrient);
    if (consumedValue === undefined || !Number.isFinite(consumedValue)) {
      progress.push({
        nutrient,
        mode,
        consumed: null,
        goal,
        ratio: null,
        remaining: null,
      });
      continue;
    }
    progress.push({
      nutrient,
      mode,
      consumed: consumedValue,
      goal,
      ratio: consumedValue / goal,
      remaining: mode === 'minimum'
        ? Math.max(0, goal - consumedValue)
        : goal - consumedValue,
    });
  }
  return progress;
}
