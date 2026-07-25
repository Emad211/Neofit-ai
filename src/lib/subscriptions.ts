export type PlanId = 'free' | 'plus' | 'pro';

export type PlanDefinition = {
  id: PlanId;
  aiRequestsPerDay: number;
  planGenerationsPerMonth: number;
  foodScansPerDay: number;
  weeklyAdaptation: boolean;
  advancedReports: boolean;
  priorityModels: boolean;
};

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    aiRequestsPerDay: 8,
    planGenerationsPerMonth: 1,
    foodScansPerDay: 2,
    weeklyAdaptation: false,
    advancedReports: false,
    priorityModels: false,
  },
  plus: {
    id: 'plus',
    aiRequestsPerDay: 60,
    planGenerationsPerMonth: 6,
    foodScansPerDay: 15,
    weeklyAdaptation: true,
    advancedReports: true,
    priorityModels: false,
  },
  pro: {
    id: 'pro',
    aiRequestsPerDay: 200,
    planGenerationsPerMonth: 20,
    foodScansPerDay: 50,
    weeklyAdaptation: true,
    advancedReports: true,
    priorityModels: true,
  },
};

export function isPlanId(value: unknown): value is PlanId {
  return value === 'free' || value === 'plus' || value === 'pro';
}

export function getPlanDefinition(planId: unknown) {
  return PLAN_DEFINITIONS[isPlanId(planId) ? planId : 'free'];
}
