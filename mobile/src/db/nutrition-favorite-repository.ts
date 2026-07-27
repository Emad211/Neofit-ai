import { z } from 'zod';
import { getSetting, setSetting } from '@/db/settings-repository';

const FAVORITES_KEY = 'nutrition.food-favorites.v1';
const MAX_FAVORITES = 100;

const FavoriteFoodSchema = z.object({
  id: z.string().min(1),
  labelFa: z.string().min(1),
  labelEn: z.string().min(1),
  query: z.string().min(1),
  savedAt: z.string().datetime(),
});
const FavoriteFoodsSchema = z.array(FavoriteFoodSchema).max(MAX_FAVORITES);

export type FavoriteFood = z.infer<typeof FavoriteFoodSchema>;

export async function listFavoriteFoods(): Promise<FavoriteFood[]> {
  return getSetting(FAVORITES_KEY, FavoriteFoodsSchema, []);
}

export async function saveFavoriteFood(input: Omit<FavoriteFood, 'savedAt'>): Promise<FavoriteFood> {
  const favorite = FavoriteFoodSchema.parse({ ...input, savedAt: new Date().toISOString() });
  const current = await listFavoriteFoods();
  const next = [favorite, ...current.filter((item) => item.id !== favorite.id)].slice(0, MAX_FAVORITES);
  await setSetting(FAVORITES_KEY, next);
  return favorite;
}

export async function deleteFavoriteFood(id: string): Promise<boolean> {
  const current = await listFavoriteFoods();
  const next = current.filter((item) => item.id !== id);
  if (next.length === current.length) return false;
  await setSetting(FAVORITES_KEY, next);
  return true;
}

export async function isFavoriteFood(id: string): Promise<boolean> {
  return (await listFavoriteFoods()).some((item) => item.id === id);
}
