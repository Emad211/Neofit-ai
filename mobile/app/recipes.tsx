import * as React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  AppText,
  Card,
  ChoiceGrid,
  Field,
  InlineNotice,
  MetricCard,
  PrimaryButton,
  Screen,
} from '@/components/ui';
import {
  getNutritionFoodDocument,
  searchNutritionFoods,
} from '@/db/nutrition-food-repository';
import { saveNutritionDiaryEntry } from '@/db/nutrition-diary-repository';
import { localDateFromIso } from '@/db/nutrition-meal-repository';
import {
  deleteNutritionRecipe,
  listNutritionRecipes,
  saveNutritionRecipe,
  type PersistedRecipe,
  type PersistedRecipeIngredient,
} from '@/db/nutrition-recipe-repository';
import { searchUniversalCatalog } from '@/db/universal-catalog-repository';
import { createId } from '@/lib/id';
import type { FoodConcept, FoodVariant, MealType, RecipeCalculationResult } from '@/nutrition-core';
import { useApp } from '@/providers/app-provider';
import {
  resolvePersistedRecipe,
  type ResolvedPersistedRecipe,
} from '@/services/nutrition-recipe-resolver';
import { useAppTheme } from '@/theme/theme';

type AmountKind = 'grams' | 'basis';

type IngredientSearchResult = {
  readonly key: string;
  readonly sourceId: string;
  readonly labelFa: string;
  readonly labelEn: string;
  readonly sourceLabel: string;
  readonly amountKind: AmountKind;
  readonly defaultAmount: number;
  readonly score: number;
};

type DraftIngredient = PersistedRecipeIngredient & {
  readonly labelFa: string;
  readonly labelEn: string;
};

function positive(value: string): number | null {
  const normalized = value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function localResult(
  concept: FoodConcept,
  variant: FoodVariant,
  score: number,
): IngredientSearchResult {
  const canUseGrams = variant.basisGrams !== null;
  return {
    key: `local:${variant.id}`,
    sourceId: variant.id,
    labelFa: concept.nameFa,
    labelEn: concept.nameEn,
    sourceLabel: [variant.sourceDataset, variant.sourceVersion].filter(Boolean).join(' ') || variant.evidenceTier,
    amountKind: canUseGrams ? 'grams' : 'basis',
    defaultAmount: canUseGrams ? variant.basisGrams ?? 100 : 1,
    score,
  };
}

function calculationCards(
  calculation: RecipeCalculationResult,
  label: (en: string, fa: string) => string,
) {
  return (
    <>
      <AppText weight="800">{label('Per serving', 'هر سهم')}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <MetricCard label={label('Calories', 'کالری')} value={Math.round(calculation.perServing.center.energyKcal ?? 0)} unit="kcal" />
        <MetricCard label={label('Protein', 'پروتئین')} value={(calculation.perServing.center.proteinG ?? 0).toFixed(1)} unit="g" />
        <MetricCard label={label('Carbs', 'کربوهیدرات')} value={(calculation.perServing.center.carbsG ?? 0).toFixed(1)} unit="g" />
        <MetricCard label={label('Fat', 'چربی')} value={(calculation.perServing.center.fatG ?? 0).toFixed(1)} unit="g" />
      </View>
      {calculation.per100g ? (
        <AppText muted size={13}>{label(
          `${Math.round(calculation.per100g.center.energyKcal ?? 0)} kcal per 100 g from declared cooked yield.`,
          `${Math.round(calculation.per100g.center.energyKcal ?? 0)} کیلوکالری در ۱۰۰ گرم بر اساس بازده پختهٔ اعلام‌شده.`,
        )}</AppText>
      ) : (
        <AppText muted size={13}>{label(
          'Per-100-g nutrition is unavailable until cooked yield is provided.',
          'تا زمانی که بازده پخته وارد نشود، مقدار هر ۱۰۰ گرم محاسبه نمی‌شود.',
        )}</AppText>
      )}
    </>
  );
}

export default function RecipesScreen() {
  const { locale, refreshDailySummary } = useApp();
  const theme = useAppTheme();
  const label = React.useCallback((en: string, fa: string) => locale === 'fa' ? fa : en, [locale]);
  const [recipes, setRecipes] = React.useState<PersistedRecipe[]>([]);
  const [recipeId, setRecipeId] = React.useState(() => createId('recipe'));
  const [createdAt, setCreatedAt] = React.useState(() => new Date().toISOString());
  const [name, setName] = React.useState('');
  const [servings, setServings] = React.useState('4');
  const [cookedYield, setCookedYield] = React.useState('');
  const [recipeMealType, setRecipeMealType] = React.useState<MealType>('lunch');
  const [ingredients, setIngredients] = React.useState<DraftIngredient[]>([]);
  const [query, setQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<IngredientSearchResult[]>([]);
  const [selectedSearch, setSelectedSearch] = React.useState<IngredientSearchResult | null>(null);
  const [ingredientAmount, setIngredientAmount] = React.useState('100');
  const [preview, setPreview] = React.useState<ResolvedPersistedRecipe | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [searching, setSearching] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [logging, setLogging] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadRecipes = React.useCallback(async () => {
    setLoading(true);
    try {
      setRecipes(await listNutritionRecipes(200));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Recipes could not be loaded.', 'دستورها بارگذاری نشدند.'));
    } finally {
      setLoading(false);
    }
  }, [label]);

  useFocusEffect(React.useCallback(() => {
    void loadRecipes();
  }, [loadRecipes]));

  const runSearch = React.useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const [localHits, universalHits] = await Promise.all([
        searchNutritionFoods(trimmed, 12),
        searchUniversalCatalog(trimmed, 12),
      ]);
      const conceptIds = [...new Set(localHits.map((hit) => hit.conceptId))];
      const documents = new Map(
        (await Promise.all(conceptIds.map(async (id) => [id, await getNutritionFoodDocument(id)] as const)))
          .filter((entry): entry is readonly [string, NonNullable<Awaited<ReturnType<typeof getNutritionFoodDocument>>>] => entry[1] !== null),
      );
      const values: IngredientSearchResult[] = [];
      for (const hit of localHits) {
        const document = documents.get(hit.conceptId);
        const variant = document?.variants.find((item) => item.id === hit.variantId);
        if (document && variant) values.push(localResult(document.concept, variant, hit.score));
      }
      for (const hit of universalHits) {
        if (hit.kind !== 'generic_food') continue;
        values.push({
          key: `universal:${hit.id}`,
          sourceId: `universal:${hit.id}`,
          labelFa: hit.matchedAliasFa ?? hit.nameEn,
          labelEn: hit.nameEn,
          sourceLabel: hit.sourceType === 'fndds' ? 'USDA FNDDS 2021–2023' : 'USDA SR Legacy',
          amountKind: 'grams',
          defaultAmount: 100,
          score: hit.score,
        });
      }
      const seen = new Set<string>();
      setSearchResults(values
        .filter((item) => !seen.has(item.sourceId) && seen.add(item.sourceId))
        .sort((left, right) => right.score - left.score)
        .slice(0, 18));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Ingredient search failed.', 'جست‌وجوی ماده غذایی انجام نشد.'));
    } finally {
      setSearching(false);
    }
  }, [label]);

  React.useEffect(() => {
    const timer = setTimeout(() => void runSearch(query), 220);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  const chooseSearchResult = (result: IngredientSearchResult) => {
    setSelectedSearch(result);
    setIngredientAmount(String(result.defaultAmount));
  };

  const addIngredient = () => {
    if (!selectedSearch) return;
    const amount = positive(ingredientAmount);
    if (amount === null) {
      setError(label('Enter a valid ingredient amount.', 'مقدار معتبر برای ماده غذایی وارد کنید.'));
      return;
    }
    const ingredient: DraftIngredient = {
      id: createId('ingredient'),
      sourceType: 'food',
      sourceId: selectedSearch.sourceId,
      grams: selectedSearch.amountKind === 'grams' ? amount : null,
      basisMultiplier: selectedSearch.amountKind === 'basis' ? amount : null,
      consumedFraction: 1,
      sortOrder: ingredients.length,
      labelFa: selectedSearch.labelFa,
      labelEn: selectedSearch.labelEn,
    };
    setIngredients((current) => [...current, ingredient]);
    setSelectedSearch(null);
    setQuery('');
    setSearchResults([]);
    setPreview(null);
    setNotice(label('Ingredient added to the draft.', 'ماده غذایی به پیش‌نویس اضافه شد.'));
  };

  const removeIngredient = (id: string) => {
    setIngredients((current) => current
      .filter((item) => item.id !== id)
      .map((item, index) => ({ ...item, sortOrder: index })));
    setPreview(null);
  };

  const buildRecipe = (): PersistedRecipe => {
    const servingCount = positive(servings);
    if (!name.trim()) throw new Error(label('Recipe name is required.', 'نام دستور لازم است.'));
    if (servingCount === null) throw new Error(label('Serving count is invalid.', 'تعداد سهم نامعتبر است.'));
    if (ingredients.length === 0) throw new Error(label('Add at least one ingredient.', 'حداقل یک ماده غذایی اضافه کنید.'));
    const yieldValue = cookedYield.trim() ? positive(cookedYield) : null;
    if (cookedYield.trim() && yieldValue === null) throw new Error(label('Cooked yield is invalid.', 'بازده پخته نامعتبر است.'));
    const now = new Date().toISOString();
    return {
      id: recipeId,
      name: name.trim(),
      servingCount,
      cookedYieldGrams: yieldValue,
      ingredients: ingredients.map(({ labelFa: _labelFa, labelEn: _labelEn, ...ingredient }) => ingredient),
      createdAt,
      updatedAt: now,
    };
  };

  const saveRecipe = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const recipe = buildRecipe();
      await saveNutritionRecipe(recipe);
      const resolved = await resolvePersistedRecipe(recipe);
      setPreview(resolved);
      await loadRecipes();
      setNotice(label('Recipe saved and recalculated from current sources.', 'دستور ذخیره شد و از منابع فعلی دوباره محاسبه شد.'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Recipe could not be saved.', 'دستور ذخیره نشد.'));
    } finally {
      setSaving(false);
    }
  };

  const loadRecipe = async (recipe: PersistedRecipe) => {
    setError(null);
    setNotice(null);
    try {
      const resolved = await resolvePersistedRecipe(recipe);
      setRecipeId(recipe.id);
      setCreatedAt(recipe.createdAt);
      setName(recipe.name);
      setServings(String(recipe.servingCount));
      setCookedYield(recipe.cookedYieldGrams === null ? '' : String(recipe.cookedYieldGrams));
      setIngredients(recipe.ingredients.map((ingredient, index) => ({
        ...ingredient,
        sortOrder: index,
        labelFa: resolved.ingredients[index]?.labelFa ?? ingredient.sourceId,
        labelEn: resolved.ingredients[index]?.labelEn ?? ingredient.sourceId,
      })));
      setPreview(resolved);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Recipe could not be resolved.', 'دستور دوباره محاسبه نشد.'));
    }
  };

  const resetDraft = () => {
    setRecipeId(createId('recipe'));
    setCreatedAt(new Date().toISOString());
    setName('');
    setServings('4');
    setCookedYield('');
    setIngredients([]);
    setSelectedSearch(null);
    setQuery('');
    setPreview(null);
    setNotice(null);
    setError(null);
  };

  const removeRecipe = (recipe: PersistedRecipe) => {
    Alert.alert(
      label('Delete recipe?', 'دستور حذف شود؟'),
      recipe.name,
      [
        { text: label('Cancel', 'انصراف'), style: 'cancel' },
        {
          text: label('Delete', 'حذف'),
          style: 'destructive',
          onPress: () => {
            void deleteNutritionRecipe(recipe.id).then(async () => {
              if (recipe.id === recipeId) resetDraft();
              await loadRecipes();
            }).catch((caught) => {
              setError(caught instanceof Error ? caught.message : label('Recipe could not be deleted.', 'دستور حذف نشد.'));
            });
          },
        },
      ],
    );
  };

  const logServing = async () => {
    if (!preview) return;
    setLogging(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      await saveNutritionDiaryEntry({
        id: createId('meal'),
        localDate: localDateFromIso(now),
        mealType: recipeMealType,
        label: `${preview.recipe.name} — ${label('one recipe serving', 'یک سهم دستور')}`,
        sourceType: 'recipe',
        sourceId: preview.recipe.id,
        estimate: preview.calculation.perServing,
        createdAt: now,
        updatedAt: now,
      });
      await refreshDailySummary();
      setNotice(label('One recipe serving was logged.', 'یک سهم دستور ثبت شد.'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Recipe serving could not be logged.', 'سهم دستور ثبت نشد.'));
    } finally {
      setLogging(false);
    }
  };

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <AppText size={30} weight="800">{label('Recipes', 'دستورهای غذایی')}</AppText>
        <AppText muted>{label(
          'Ingredients are stored by exact IFKB or USDA source id. Saved recipes are recalculated from the current catalog instead of freezing copied nutrition numbers.',
          'مواد با شناسهٔ دقیق IFKB یا USDA ذخیره می‌شوند. دستور ذخیره‌شده از کاتالوگ فعلی دوباره محاسبه می‌شود و عدد تغذیه‌ای کپی‌شده را منجمد نمی‌کند.',
        )}</AppText>
      </View>

      {notice ? <InlineNotice tone="success">{notice}</InlineNotice> : null}
      {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <AppText size={21} weight="800">{label('Recipe library', 'کتابخانه دستورها')}</AppText>
          <View style={{ minWidth: 130 }}><PrimaryButton title={label('New recipe', 'دستور جدید')} variant="secondary" onPress={resetDraft} /></View>
        </View>
        {loading ? <AppText muted>{label('Loading recipes…', 'در حال بارگذاری دستورها…')}</AppText> : null}
        {!loading && recipes.length === 0 ? <AppText muted>{label('No saved recipes yet.', 'هنوز دستوری ذخیره نشده است.')}</AppText> : null}
        {recipes.map((recipe) => (
          <View key={recipe.id} style={{ gap: 7, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.18)', paddingTop: 12 }}>
            <AppText weight="800">{recipe.name}</AppText>
            <AppText muted size={13}>{recipe.ingredients.length} {label('ingredients', 'ماده')} · {recipe.servingCount} {label('servings', 'سهم')}</AppText>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}><PrimaryButton title={label('Open', 'بازکردن')} variant="ghost" onPress={() => loadRecipe(recipe)} /></View>
              <View style={{ flex: 1 }}><PrimaryButton title={label('Delete', 'حذف')} variant="danger" onPress={() => removeRecipe(recipe)} /></View>
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <AppText size={21} weight="800">{label('Recipe details', 'مشخصات دستور')}</AppText>
        <Field label={label('Recipe name', 'نام دستور')} value={name} onChangeText={setName} />
        <Field label={label('Number of servings', 'تعداد سهم')} value={servings} onChangeText={setServings} keyboardType="decimal-pad" />
        <Field
          label={label('Cooked yield in grams — optional', 'بازده پخته به گرم — اختیاری')}
          value={cookedYield}
          onChangeText={setCookedYield}
          keyboardType="decimal-pad"
          hint={label('Required only for a defensible per-100-g result.', 'فقط برای محاسبهٔ قابل‌دفاع هر ۱۰۰ گرم لازم است.')}
        />
      </Card>

      <Card>
        <AppText size={21} weight="800">{label('Add ingredient', 'افزودن ماده غذایی')}</AppText>
        <Field
          label={label('Search food', 'جست‌وجوی غذا')}
          value={query}
          onChangeText={setQuery}
          placeholder={label('Egg white, tomato, chicken…', 'سفیده تخم مرغ، گوجه، مرغ و…')}
          autoCorrect={false}
        />
        {searching ? <AppText muted>{label('Searching on device…', 'در حال جست‌وجو روی گوشی…')}</AppText> : null}
        {searchResults.map((result) => {
          const selected = selectedSearch?.sourceId === result.sourceId;
          return (
            <Pressable
              key={result.key}
              onPress={() => chooseSearchResult(result)}
              style={({ pressed }) => ({
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? theme.colors.primary : theme.colors.border,
                backgroundColor: theme.colors.surfaceElevated,
                borderRadius: 16,
                padding: 13,
                gap: 3,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <AppText weight="700">{locale === 'fa' ? result.labelFa : result.labelEn}</AppText>
              <AppText muted size={12}>{result.sourceLabel} · {result.amountKind === 'grams' ? label('grams', 'گرم') : label('named servings', 'تعداد سهم نام‌دار')}</AppText>
            </Pressable>
          );
        })}
        {selectedSearch ? (
          <>
            <Field
              label={selectedSearch.amountKind === 'grams' ? label('Ingredient grams', 'گرم ماده غذایی') : label('Number of named servings', 'تعداد سهم نام‌دار')}
              value={ingredientAmount}
              onChangeText={setIngredientAmount}
              keyboardType="decimal-pad"
            />
            <PrimaryButton title={label('Add ingredient', 'افزودن ماده')} onPress={addIngredient} />
          </>
        ) : null}
      </Card>

      <Card>
        <AppText size={21} weight="800">{label('Draft ingredients', 'مواد پیش‌نویس')}</AppText>
        {ingredients.length === 0 ? <AppText muted>{label('No ingredients added.', 'ماده‌ای اضافه نشده است.')}</AppText> : null}
        {ingredients.map((ingredient) => (
          <View key={ingredient.id} style={{ gap: 6, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.18)', paddingTop: 12 }}>
            <AppText weight="700">{locale === 'fa' ? ingredient.labelFa : ingredient.labelEn}</AppText>
            <AppText muted size={13}>{ingredient.grams === null
              ? `${ingredient.basisMultiplier} × ${label('basis serving', 'سهم مبنا')}`
              : `${ingredient.grams} g`}</AppText>
            <PrimaryButton title={label('Remove', 'حذف')} variant="danger" onPress={() => removeIngredient(ingredient.id)} />
          </View>
        ))}
        <PrimaryButton title={label('Save and calculate recipe', 'ذخیره و محاسبه دستور')} onPress={saveRecipe} loading={saving} />
      </Card>

      {preview ? (
        <Card>
          <AppText size={22} weight="800">{preview.recipe.name}</AppText>
          {calculationCards(preview.calculation, label)}
          <AppText weight="700">{label('Meal type', 'نوع وعده')}</AppText>
          <ChoiceGrid
            value={recipeMealType}
            onChange={setRecipeMealType}
            columns={2}
            options={[
              { value: 'breakfast', label: label('Breakfast', 'صبحانه') },
              { value: 'lunch', label: label('Lunch', 'ناهار') },
              { value: 'dinner', label: label('Dinner', 'شام') },
              { value: 'snack', label: label('Snack', 'میان‌وعده') },
            ]}
          />
          <PrimaryButton title={label('Log one serving to Diary', 'ثبت یک سهم در دفتر')} onPress={logServing} loading={logging} />
        </Card>
      ) : null}
    </Screen>
  );
}
