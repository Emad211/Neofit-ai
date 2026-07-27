import * as React from 'react';
import { Pressable, View } from 'react-native';
import { AppText, Card, InlineNotice, PrimaryButton } from '@/components/ui';
import {
  deleteFavoriteFood,
  listFavoriteFoods,
  saveFavoriteFood,
  type FavoriteFood,
} from '@/db/nutrition-favorite-repository';
import { getRecentMeals } from '@/db/nutrition-meal-repository';
import { useAppTheme } from '@/theme/theme';

export interface FavoriteCandidate {
  readonly id: string;
  readonly labelFa: string;
  readonly labelEn: string;
  readonly query: string;
}

interface RecentSearch {
  readonly key: string;
  readonly query: string;
  readonly label: string;
}

function queryFromDiaryLabel(value: string): string {
  return value.split(/\s+[—–-]\s+/)[0]?.trim() || value.trim();
}

function uniqueRecentSearches(
  entries: Awaited<ReturnType<typeof getRecentMeals>>,
  limit = 8,
): RecentSearch[] {
  const seen = new Set<string>();
  const result: RecentSearch[] = [];
  for (const entry of entries) {
    const query = queryFromDiaryLabel(entry.description);
    const key = query.normalize('NFKC').toLowerCase();
    if (query.length < 2 || seen.has(key)) continue;
    seen.add(key);
    result.push({ key: `${entry.id}:${key}`, query, label: query });
    if (result.length >= limit) break;
  }
  return result;
}

export function FoodSearchShortcuts({
  locale,
  current,
  onSearch,
}: {
  readonly locale: 'fa' | 'en';
  readonly current: FavoriteCandidate | null;
  readonly onSearch: (query: string) => void;
}) {
  const theme = useAppTheme();
  const label = React.useCallback((en: string, fa: string) => locale === 'fa' ? fa : en, [locale]);
  const [favorites, setFavorites] = React.useState<FavoriteFood[]>([]);
  const [recent, setRecent] = React.useState<RecentSearch[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [favoriteRows, recentRows] = await Promise.all([
        listFavoriteFoods(),
        getRecentMeals(40),
      ]);
      setFavorites(favoriteRows);
      setRecent(uniqueRecentSearches(recentRows));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Shortcuts could not be loaded.', 'میانبرها بارگذاری نشدند.'));
    } finally {
      setLoading(false);
    }
  }, [label]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const currentIsFavorite = current !== null && favorites.some((item) => item.id === current.id);

  const toggleCurrent = async () => {
    if (!current) return;
    setBusy(true);
    setError(null);
    try {
      if (currentIsFavorite) {
        await deleteFavoriteFood(current.id);
      } else {
        await saveFavoriteFood(current);
      }
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Favorite could not be updated.', 'علاقه‌مندی به‌روزرسانی نشد.'));
    } finally {
      setBusy(false);
    }
  };

  const chip = (key: string, title: string, query: string) => (
    <Pressable
      key={key}
      accessibilityRole="button"
      onPress={() => onSearch(query)}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: 999,
        paddingHorizontal: 13,
        paddingVertical: 9,
        opacity: pressed ? 0.65 : 1,
      })}
    >
      <AppText size={13} weight="600">{title}</AppText>
    </Pressable>
  );

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText size={19} weight="800">{label('Shortcuts', 'میانبرها')}</AppText>
          <AppText muted size={12}>{label(
            'Favorites store only identifiers and search text; nutrition always comes from the current catalog.',
            'علاقه‌مندی فقط شناسه و متن جست‌وجو را نگه می‌دارد؛ تغذیه همیشه از کاتالوگ فعلی خوانده می‌شود.',
          )}</AppText>
        </View>
        {current ? (
          <View style={{ minWidth: 128 }}>
            <PrimaryButton
              title={currentIsFavorite ? label('Remove favorite', 'حذف علاقه‌مندی') : label('Add favorite', 'افزودن علاقه‌مندی')}
              variant="ghost"
              loading={busy}
              onPress={toggleCurrent}
            />
          </View>
        ) : null}
      </View>

      {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}
      {loading ? <AppText muted>{label('Loading shortcuts…', 'در حال بارگذاری میانبرها…')}</AppText> : null}

      {!loading && favorites.length > 0 ? (
        <View style={{ gap: 8 }}>
          <AppText weight="700">{label('Favorites', 'علاقه‌مندی‌ها')}</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {favorites.map((item) => chip(
              `favorite:${item.id}`,
              locale === 'fa' ? item.labelFa : item.labelEn,
              item.query,
            ))}
          </View>
        </View>
      ) : null}

      {!loading && recent.length > 0 ? (
        <View style={{ gap: 8 }}>
          <AppText weight="700">{label('Recent foods', 'غذاهای اخیر')}</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {recent.map((item) => chip(`recent:${item.key}`, item.label, item.query))}
          </View>
        </View>
      ) : null}

      {!loading && favorites.length === 0 && recent.length === 0 ? (
        <AppText muted size={13}>{label(
          'Saved favorites and recently logged foods will appear here.',
          'غذاهای موردعلاقه و غذاهای ثبت‌شدهٔ اخیر اینجا نمایش داده می‌شوند.',
        )}</AppText>
      ) : null}
    </Card>
  );
}
