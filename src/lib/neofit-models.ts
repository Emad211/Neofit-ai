export type MealIngredient = {
  name: string;
  quantity: string;
  category: string;
};

export type Meal = {
  id: string;
  type: string;
  name: string;
  calories: number;
  ingredients: MealIngredient[];
};

export type NutritionDay = {
  day: string;
  totalCalories: number;
  meals: Meal[];
};

export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest?: string;
};

export type WorkoutDay = {
  id: string;
  day: string;
  title: string;
  focus: string;
  duration: string;
  calories: number;
  exercises: Exercise[];
};

export type NutritionPlan = NutritionDay[];
export type WorkoutPlan = WorkoutDay[];

export type FoodLookupResult = {
  foodName: string;
  serving: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  source: string;
};

export type ExerciseDetails = {
  name: string;
  summary: string;
  instructions: string[];
  formTips: string[];
  commonMistakes: string[];
};
