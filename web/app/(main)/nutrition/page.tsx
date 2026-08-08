import { NutritionScreen } from '@/components/nutrition-screen';
import { NutritionStateProvider } from '@/components/nutrition-state';

export default function NutritionPage() {
  // The catalog/add-food screen does not preload the diary or goals. Account
  // identity comes from the shared lightweight shell; writes are direct.
  return <NutritionStateProvider><NutritionScreen /></NutritionStateProvider>;
}
