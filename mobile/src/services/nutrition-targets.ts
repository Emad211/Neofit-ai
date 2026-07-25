import { Profile } from '@/domain/models';

export type NutritionTargets = {
  bmr: number;
  maintenanceCalories: number;
  targetCalories: number;
  calorieRange: { low: number; high: number };
  proteinRangeG: { low: number; high: number };
  fatRangeG: { low: number; high: number };
  carbohydrateRangeG: { low: number; high: number };
  referenceWeightKg: number;
  confidence: 'low' | 'medium';
  assumptions: string[];
};

const activityFactors: Record<Profile['activityLevel'], number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
};

function roundTo(value: number, step: number) {
  return Math.round(value / step) * step;
}

function clamp(value: number, low: number, high: number) {
  return Math.min(high, Math.max(low, value));
}

export function calculateNutritionTargets(profile: Profile): NutritionTargets {
  const sexConstant = profile.gender === 'male' ? 5 : profile.gender === 'female' ? -161 : -78;
  const bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + sexConstant;
  const maintenance = bmr * activityFactors[profile.activityLevel];
  const heightMeters = profile.heightCm / 100;
  const bmi = profile.weightKg / Math.max(0.1, heightMeters * heightMeters);
  const referenceWeightKg = bmi > 30
    ? Math.min(profile.weightKg, 27 * heightMeters * heightMeters)
    : profile.weightKg;

  let target = maintenance;
  if (profile.goal === 'lose_weight') {
    const requestedRate = clamp(profile.details.targetRateKgPerWeek || 0.4, 0.1, 1.0);
    const requestedDeficit = requestedRate * 7_700 / 7;
    const deficit = clamp(requestedDeficit, 200, Math.min(750, maintenance * 0.25));
    const conservativeFloor = Math.max(1_200, bmr * 1.05);
    target = Math.max(conservativeFloor, maintenance - deficit);
  } else if (profile.goal === 'gain_muscle') {
    const surplus = profile.details.trainingExperienceMonths < 12 ? 300 : 200;
    target = maintenance + surplus;
  }

  const targetCalories = roundTo(target, 25);
  const calorieSpread = Math.max(100, Math.round(targetCalories * 0.06));
  const proteinPerKg = profile.goal === 'lose_weight'
    ? { low: 1.7, high: 2.2 }
    : profile.goal === 'gain_muscle'
      ? { low: 1.6, high: 2.1 }
      : { low: 1.4, high: 1.9 };
  const proteinRangeG = {
    low: Math.round(referenceWeightKg * proteinPerKg.low),
    high: Math.round(referenceWeightKg * proteinPerKg.high),
  };
  const fatRangeG = {
    low: Math.round(Math.max(referenceWeightKg * 0.65, targetCalories * 0.2 / 9)),
    high: Math.round(Math.max(referenceWeightKg * 0.95, targetCalories * 0.3 / 9)),
  };
  const carbsAt = (proteinG: number, fatG: number, calories: number) => Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
  const carbohydrateRangeG = {
    low: carbsAt(proteinRangeG.high, fatRangeG.high, targetCalories - calorieSpread),
    high: carbsAt(proteinRangeG.low, fatRangeG.low, targetCalories + calorieSpread),
  };

  const assumptions = [
    'Uses a standard resting-energy equation and a broad activity multiplier.',
    'Real energy needs can differ because step count, training output, body composition, and food tracking are imperfect.',
    bmi > 30
      ? 'Protein range uses a capped reference weight to avoid scaling protein targets indefinitely with body mass.'
      : 'Protein range uses current body weight.',
  ];
  if (profile.details.averageSteps <= 0) {
    assumptions.push('Daily step count was not available.');
  }
  if (profile.details.healthFlags.length > 0 || profile.medicalNotes.trim()) {
    assumptions.push('Health information may require individualized professional nutrition advice.');
  }

  return {
    bmr: roundTo(bmr, 5),
    maintenanceCalories: roundTo(maintenance, 25),
    targetCalories,
    calorieRange: {
      low: Math.max(800, targetCalories - calorieSpread),
      high: targetCalories + calorieSpread,
    },
    proteinRangeG,
    fatRangeG,
    carbohydrateRangeG,
    referenceWeightKg: Math.round(referenceWeightKg * 10) / 10,
    confidence: 'medium',
    assumptions,
  };
}
