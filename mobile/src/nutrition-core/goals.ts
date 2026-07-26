import { NUTRIENT_KEYS, type GoalProgressItem, type NutritionGoals, type NutritionVector } from './types';

export function calculateGoalProgress(
  consumed: NutritionVector,
  goals: NutritionGoals,
): GoalProgressItem[] {
  const progress: GoalProgressItem[] = [];
  for (const nutrient of NUTRIENT_KEYS) {
    const goal = goals.daily[nutrient];
    if (goal === undefined) {
      continue;
    }
    if (!Number.isFinite(goal) || goal <= 0) {
      throw new RangeError(`Goal for ${nutrient} must be a finite positive number`);
    }
    const actual = consumed[nutrient];
    progress.push({
      nutrient,
      consumed: actual ?? null,
      goal,
      ratio: actual === undefined ? null : actual / goal,
      remaining: actual === undefined ? null : Math.max(0, goal - actual),
    });
  }
  return progress;
}
