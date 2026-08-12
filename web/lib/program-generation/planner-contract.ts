export interface TrainingPlannerSelection {
  readonly days: readonly (readonly string[])[];
}

export interface NutritionPlannerFoodSelection {
  readonly id: string;
  readonly portion: number;
}

export interface NutritionPlannerSelection {
  readonly days: readonly (readonly (readonly NutritionPlannerFoodSelection[])[])[];
}

export interface ProgramPlannerSelections {
  readonly training: TrainingPlannerSelection;
  readonly nutrition: NutritionPlannerSelection;
}

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function exactKeys(record: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(record).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function parseObjectFromText(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  if (trimmed.length > 20_000) throw new Error('planner_output_too_large');
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) throw new Error('planner_json_only_required');
  const parsed = JSON.parse(trimmed) as unknown;
  const record = object(parsed);
  if (!record || !exactKeys(record, ['days'])) throw new Error('planner_json_invalid');
  return record;
}

function allowedId(value: unknown, allowedIds: ReadonlySet<string>): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 160 || !allowedIds.has(value)) {
    throw new Error('planner_id_invalid');
  }
  return value;
}

function portion(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0.25 || value > 3) {
    throw new Error('planner_portion_invalid');
  }
  const quarters = value * 4;
  if (Math.abs(quarters - Math.round(quarters)) > 1e-9) throw new Error('planner_portion_step_invalid');
  return value;
}

export function parseTrainingPlannerOutput(
  text: string,
  input: {
    readonly expectedDays: number;
    readonly exercisesPerDay: number;
    readonly allowedIds: ReadonlySet<string>;
  },
): TrainingPlannerSelection {
  const record = parseObjectFromText(text);
  if (!Array.isArray(record.days) || record.days.length !== input.expectedDays) {
    throw new Error('planner_training_days_invalid');
  }

  const days = record.days.map((day) => {
    if (!Array.isArray(day) || day.length !== input.exercisesPerDay) {
      throw new Error('planner_training_day_size_invalid');
    }
    const ids = day.map((value) => allowedId(value, input.allowedIds));
    if (new Set(ids).size !== ids.length) throw new Error('planner_training_duplicate_exercise');
    return ids;
  });
  return { days };
}

export function parseNutritionPlannerOutput(
  text: string,
  input: {
    readonly expectedDays: number;
    readonly mealsPerDay: number;
    readonly allowedIds: ReadonlySet<string>;
  },
): NutritionPlannerSelection {
  const record = parseObjectFromText(text);
  if (!Array.isArray(record.days) || record.days.length !== input.expectedDays) {
    throw new Error('planner_nutrition_days_invalid');
  }

  const days = record.days.map((day) => {
    if (!Array.isArray(day) || day.length !== input.mealsPerDay) {
      throw new Error('planner_nutrition_meals_invalid');
    }

    return day.map((meal) => {
      if (!Array.isArray(meal) || meal.length < 1 || meal.length > 2) {
        throw new Error('planner_nutrition_meal_size_invalid');
      }
      const items = meal.map((item) => {
        const itemRecord = object(item);
        if (!itemRecord || !exactKeys(itemRecord, ['id', 'portion'])) {
          throw new Error('planner_nutrition_item_invalid');
        }
        return {
          id: allowedId(itemRecord.id, input.allowedIds),
          portion: portion(itemRecord.portion),
        };
      });
      if (new Set(items.map((item) => item.id)).size !== items.length) {
        throw new Error('planner_nutrition_duplicate_food');
      }
      return items;
    });
  });
  return { days };
}
