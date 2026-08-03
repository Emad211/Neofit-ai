import { z } from 'zod';
import { getSetting, setSetting } from '@/db/settings-repository';

export const NUTRITION_FAVORITES_SETTING_KEY = 'nutrition.food-favorites.v1';
export const MAX_NUTRITION_FAVORITES = 100;

export const FavoriteFoodSchema = z.object({
  id: z.string().min(1),
  labelFa: z.string().min(1),
  labelEn: z.string().min(1),
  query: z.string().min(1),
  savedAt: z.string().datetime(),
});
export const FavoriteFoodsSchema = z.array(FavoriteFoodSchema).max(MAX_NUTRITION_FAVORITES);

export type FavoriteFood = z.infer<typeof FavoriteFoodSchema>;

export async function listFavoriteFoods(): Promise<FavoriteFood[]> {
  return getSetting(NUTRITION_FAVORITES_SETTING_KEY, FavoriteFoodsSchema, []);
}

export async function saveFavoriteFood(input: Omit<FavoriteFood, 'savedAt'>): Promise<FavoriteFood> {
  const favorite = FavoriteFoodSchema.parse({ ...input, savedAt: new Date().toISOString() });
  const current = await listFavoriteFoods();
  const next = [favorite, ...current.filter((item) => item.id !== favorite.id)].slice(0, MAX_NUTRITION_FAVORITES);
  await setSetting(NUTRITION_FAVORITES_SETTING_KEY, next);
  return favorite;
}

export async function deleteFavoriteFood(id: string): Promise<boolean> {
  const current = await listFavoriteFoods();
  const next = current.filter((item) => item.id !== id);
  if (next.length === current.length) return false;
  await setSetting(NUTRITION_FAVORITES_SETTING_KEY, next);
  return true;
}

export async function isFavoriteFood(id: string): Promise<boolean> {
  return (await listFavoriteFoods()).some((item) => item.id === id);
}
