import * as React from 'react';
import { Pressable, View } from 'react-native';
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
  getUniversalFoodDetails,
  searchUniversalCatalog,
  type GenericFoodHit,
  type IranianIdentityHit,
  type UniversalFoodDetails,
} from '@/db/universal-catalog-repository';
import { createId } from '@/lib/id';
import {
  calculateVariantNutrition,
  type FoodConcept,
  type FoodVariant,
  type MealType,
  type NutritionEstimate,
  type NutritionVector,
} from '@/nutrition-core';
import { useApp } from '@/providers/app-provider';
import { useAppTheme } from '@/theme/theme';
import {
  FoodSearchShortcuts,
  type FavoriteCandidate,
} from '@/components/food-search-shortcuts';

type LocalResult = {
  readonly kind: 'local';
  readonly key: string;
  readonly score: number;
  readonly concept: FoodConcept;
  readonly variant: FoodVariant;
};

type GenericResult = {
  readonly kind: 'generic';
  readonly key: string;
  readonly hit: GenericFoodHit;
};

type IdentityResult = {
  readonly kind: 'identity';
  readonly key: string;
  readonly hit: IranianIdentityHit;
};

type SearchResult = LocalResult | GenericResult | IdentityResult;

type Selection =
  | { readonly kind: 'local'; readonly concept: FoodConcept; readonly variant: FoodVariant }
  | { readonly kind: 'generic'; readonly hit: GenericFoodHit; readonly details: UniversalFoodDetails };

type AmountMode = 'grams' | 'portion';

const QUICK_SEARCHES = [
  { fa: 'سفیده تخم مرغ', en: 'egg white' },
  { fa: 'گوجه خام', en: 'raw tomato' },
  { fa: 'سالاد', en: 'salad' },
  { fa: 'سینه مرغ گریل', en: 'grilled chicken breast' },
  { fa: 'قورمه سبزی', en: 'ghormeh sabzi' },
  { fa: 'پیتزا', en: 'pizza' },
] as const;

function positiveNumber(value: string): number | null {
  const normalized = value
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function scaleVector(vector: NutritionVector, multiplier: number): NutritionVector {
  return Object.fromEntries(
    Object.entries(vector).map(([key, value]) => [key, value === undefined ? undefined : value * multiplier]),
  ) as NutritionVector;
}

function universalVector(details: UniversalFoodDetails): NutritionVector {
  return {
    ...(details.caloriesKcal === null ? {} : { energyKcal: details.caloriesKcal }),
    ...(details.proteinG === null ? {} : { proteinG: details.proteinG }),
    ...(details.carbsG === null ? {} : { carbsG: details.carbsG }),
    ...(details.fatG === null ? {} : { fatG: details.fatG }),
    ...(details.fiberG === null ? {} : { fiberG: details.fiberG }),
    ...(details.sugarsG === null ? {} : { sugarsG: details.sugarsG }),
    ...(details.sodiumMg === null ? {} : { sodiumMg: details.sodiumMg }),
    ...(details.cholesterolMg === null ? {} : { cholesterolMg: details.cholesterolMg }),
    ...(details.calciumMg === null ? {} : { calciumMg: details.calciumMg }),
    ...(details.ironMg === null ? {} : { ironMg: details.ironMg }),
    ...(details.potassiumMg === null ? {} : { potassiumMg: details.potassiumMg }),
    ...(details.vitaminCMg === null ? {} : { vitaminCMg: details.vitaminCMg }),
  };
}

function selectionName(selection: Selection, locale: 'fa' | 'en'): string {
  if (selection.kind === 'local') {
    return locale === 'fa' ? selection.concept.nameFa : selection.concept.nameEn;
  }
  return locale === 'fa'
    ? selection.hit.matchedAliasFa ?? selection.details.nameEn
    : selection.details.nameEn;
}

function localSourceLabel(variant: FoodVariant): string {
  const source = [variant.sourceDataset, variant.sourceVersion].filter(Boolean).join(' ');
  return source || variant.evidenceTier;
}

export default function FoodSearchScreen() {
  const { locale, refreshDailySummary } = useApp();
  const theme = useAppTheme();
  const label = React.useCallback((en: string, fa: string) => locale === 'fa' ? fa : en, [locale]);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [selection, setSelection] = React.useState<Selection | null>(null);
  const [amountMode, setAmountMode] = React.useState<AmountMode>('grams');
  const [grams, setGrams] = React.useState('100');
  const [portionId, setPortionId] = React.useState('');
  const [count, setCount] = React.useState('1');
  const [mealType, setMealType] = React.useState<MealType>('lunch');
  const [searching, setSearching] = React.useState(false);
  const [loadingSelection, setLoadingSelection] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const runSearch = React.useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const [localHits, universalHits] = await Promise.all([
        searchNutritionFoods(trimmed, 14),
        searchUniversalCatalog(trimmed, 18),
      ]);
      const conceptIds = [...new Set(localHits.map((hit) => hit.conceptId))];
      const documents = new Map(
        (await Promise.all(conceptIds.map(async (id) => [id, await getNutritionFoodDocument(id)] as const)))
          .filter((entry): entry is readonly [string, NonNullable<Awaited<ReturnType<typeof getNutritionFoodDocument>>>] => entry[1] !== null),
      );
      const localResults: LocalResult[] = localHits.flatMap((hit) => {
        const document = documents.get(hit.conceptId);
        const variant = document?.variants.find((item) => item.id === hit.variantId);
        return document && variant
          ? [{ kind: 'local', key: `local:${variant.id}`, score: hit.score, concept: document.concept, variant }]
          : [];
      });
      const localNames = new Set(localResults.flatMap((item) => [
        item.concept.nameFa.toLowerCase(),
        item.concept.nameEn.toLowerCase(),
      ]));
      const externalResults: SearchResult[] = [];
      for (const hit of universalHits) {
        if (hit.kind === 'generic_food') {
          externalResults.push({ kind: 'generic', key: `generic:${hit.id}`, hit });
          continue;
        }
        if (localNames.has(hit.nameFa.toLowerCase()) || localNames.has(hit.nameEn.toLowerCase())) continue;
        externalResults.push({ kind: 'identity', key: `identity:${hit.canonId}`, hit });
      }
      setResults([...localResults, ...externalResults]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Food search failed.', 'جست‌وجوی غذا انجام نشد.'));
    } finally {
      setSearching(false);
    }
  }, [label]);

  React.useEffect(() => {
    const timer = setTimeout(() => void runSearch(query), 220);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  const selectResult = async (result: SearchResult) => {
    setNotice(null);
    setError(null);
    if (result.kind === 'identity') return;
    if (result.kind === 'local') {
      setSelection({ kind: 'local', concept: result.concept, variant: result.variant });
      const firstPortion = result.variant.portions[0];
      setPortionId(firstPortion?.id ?? '');
      setAmountMode(firstPortion ? 'portion' : 'grams');
      setCount('1');
      setGrams(result.variant.basisGrams === null ? '100' : String(result.variant.basisGrams));
      return;
    }

    setLoadingSelection(true);
    try {
      const details = await getUniversalFoodDetails(result.hit.id);
      if (!details) throw new Error(label('Food details are unavailable.', 'جزئیات این غذا در دسترس نیست.'));
      setSelection({ kind: 'generic', hit: result.hit, details });
      setPortionId(details.portions[0] ? String(details.portions[0].id) : '');
      setAmountMode('grams');
      setCount('1');
      setGrams('100');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Food details could not be loaded.', 'جزئیات غذا بارگذاری نشد.'));
    } finally {
      setLoadingSelection(false);
    }
  };

  const canUseGrams = selection?.kind === 'generic'
    || (selection?.kind === 'local' && selection.variant.basisGrams !== null);
  const portions = selection?.kind === 'generic'
    ? selection.details.portions
    : selection?.kind === 'local'
      ? selection.variant.portions
      : [];
  const hasPortions = portions.length > 0;
  const favoriteCandidate = React.useMemo<FavoriteCandidate | null>(() => {
    if (!selection) return null;
    if (selection.kind === 'local') {
      return {
        id: `local:${selection.variant.id}`,
        labelFa: selection.concept.nameFa,
        labelEn: selection.concept.nameEn,
        query: selection.concept.nameFa || selection.concept.nameEn,
      };
    }
    const queryValue = selection.hit.matchedAliasFa ?? selection.details.nameEn;
    return {
      id: `universal:${selection.details.id}`,
      labelFa: selection.hit.matchedAliasFa ?? selection.details.nameEn,
      labelEn: selection.details.nameEn,
      query: queryValue,
    };
  }, [selection]);

  const estimate = React.useMemo<NutritionEstimate | null>(() => {
    if (!selection) return null;
    const quantity = positiveNumber(count);
    try {
      if (selection.kind === 'local') {
        if (amountMode === 'grams') {
          const gramValue = positiveNumber(grams);
          if (gramValue === null || selection.variant.basisGrams === null) return null;
          return calculateVariantNutrition(selection.variant, { kind: 'grams', grams: gramValue });
        }
        if (!portionId || quantity === null) return null;
        return calculateVariantNutrition(selection.variant, {
          kind: 'portion',
          portionId,
          count: quantity,
        });
      }

      const gramValue = amountMode === 'grams'
        ? positiveNumber(grams)
        : (() => {
            const portion = selection.details.portions.find((item) => String(item.id) === portionId);
            return portion && quantity !== null ? portion.gramWeight * quantity : null;
          })();
      if (gramValue === null) return null;
      return {
        grams: gramValue,
        center: scaleVector(universalVector(selection.details), gramValue / 100),
      };
    } catch {
      return null;
    }
  }, [amountMode, count, grams, portionId, selection]);

  const amountDescription = React.useMemo(() => {
    if (!selection) return '';
    if (amountMode === 'grams') return `${grams} g`;
    const quantity = positiveNumber(count) ?? 0;
    if (selection.kind === 'generic') {
      const portion = selection.details.portions.find((item) => String(item.id) === portionId);
      return portion ? `${portion.label} × ${quantity}` : '';
    }
    const portion = selection.variant.portions.find((item) => item.id === portionId);
    return portion ? `${locale === 'fa' ? portion.labelFa : portion.labelEn} × ${quantity}` : '';
  }, [amountMode, count, grams, locale, portionId, selection]);

  const save = async () => {
    if (!selection || !estimate) {
      setError(label('Choose a valid amount before saving.', 'پیش از ذخیره یک مقدار معتبر انتخاب کنید.'));
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const now = new Date();
      const name = selectionName(selection, locale);
      await saveNutritionDiaryEntry({
        id: createId('meal'),
        localDate: localDateFromIso(now.toISOString()),
        mealType,
        label: `${name} — ${amountDescription}`,
        sourceType: 'food',
        sourceId: selection.kind === 'local' ? selection.variant.id : `universal:${selection.details.id}`,
        estimate,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
      await refreshDailySummary();
      setNotice(label('Food was saved to today’s diary.', 'غذا در دفتر امروز ذخیره شد.'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Food could not be saved.', 'غذا ذخیره نشد.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <AppText size={30} weight="800">{label('Complete food search', 'جست‌وجوی جامع غذا')}</AppText>
        <AppText muted>{label(
          'Search Iranian foods and 13,225 official USDA source records. Vision and LLM values are never used for nutrition.',
          'در غذاهای ایرانی و ۱۳٬۲۲۵ رکورد رسمی USDA جست‌وجو کنید. برای مقادیر تغذیه از Vision یا LLM استفاده نمی‌شود.',
        )}</AppText>
      </View>

      <Card>
        <Field
          label={label('Food name or description', 'نام یا توضیح غذا')}
          value={query}
          onChangeText={setQuery}
          placeholder={label('Example: 50 g egg white', 'مثلاً ۵۰ گرم سفیده تخم مرغ')}
          autoCorrect={false}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {QUICK_SEARCHES.map((item) => {
            const title = locale === 'fa' ? item.fa : item.en;
            return (
              <Pressable
                key={item.en}
                onPress={() => setQuery(title)}
                style={({ pressed }) => ({
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceElevated,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  opacity: pressed ? 0.65 : 1,
                })}
              >
                <AppText size={13} weight="600">{title}</AppText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <FoodSearchShortcuts
        locale={locale}
        current={favoriteCandidate}
        onSearch={(value) => {
          setQuery(value);
          setSelection(null);
          setNotice(null);
          setError(null);
        }}
      />

      {searching ? <AppText muted>{label('Searching on device…', 'در حال جست‌وجو روی گوشی…')}</AppText> : null}
      {loadingSelection ? <AppText muted>{label('Loading portions…', 'در حال بارگذاری سهم‌ها…')}</AppText> : null}
      {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}
      {notice ? <InlineNotice tone="success">{notice}</InlineNotice> : null}

      {query.trim().length >= 2 && !searching && results.length === 0 ? (
        <InlineNotice tone="warning">{label(
          'No reliable local result was found. Try a simpler name or use manual logging.',
          'نتیجهٔ محلی قابل‌اعتمادی پیدا نشد. نام ساده‌تری بنویسید یا از ثبت دستی استفاده کنید.',
        )}</InlineNotice>
      ) : null}

      {results.length > 0 ? (
        <View style={{ gap: 10 }}>
          <AppText size={19} weight="800">{label('Results', 'نتایج')}</AppText>
          {results.map((result) => {
            const disabled = result.kind === 'identity';
            const selected = selection?.kind === 'local' && result.kind === 'local'
              ? selection.variant.id === result.variant.id
              : selection?.kind === 'generic' && result.kind === 'generic'
                ? selection.details.id === result.hit.id
                : false;
            const title = result.kind === 'local'
              ? locale === 'fa' ? result.concept.nameFa : result.concept.nameEn
              : result.kind === 'generic'
                ? locale === 'fa' ? result.hit.matchedAliasFa ?? result.hit.nameEn : result.hit.nameEn
                : locale === 'fa' ? result.hit.nameFa : result.hit.nameEn;
            const subtitle = result.kind === 'local'
              ? `${locale === 'fa' ? result.variant.nameFa : result.variant.nameEn} · ${localSourceLabel(result.variant)}`
              : result.kind === 'generic'
                ? `${result.hit.sourceType === 'fndds' ? 'USDA FNDDS' : 'USDA SR Legacy'} · ${Math.round(result.hit.caloriesKcal ?? 0)} kcal / 100 g`
                : label('Iranian identity exists; nutrition profile is not app-ready yet.', 'هویت غذای ایرانی موجود است؛ پروفایل تغذیه هنوز آمادهٔ اپ نیست.');
            return (
              <Pressable
                key={result.key}
                disabled={disabled}
                onPress={() => void selectResult(result)}
                style={({ pressed }) => ({
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  backgroundColor: disabled ? theme.colors.background : theme.colors.surface,
                  borderRadius: 18,
                  borderCurve: 'continuous',
                  padding: 15,
                  gap: 4,
                  opacity: disabled ? 0.55 : pressed ? 0.72 : 1,
                })}
              >
                <AppText weight="800">{title}</AppText>
                <AppText muted size={13}>{subtitle}</AppText>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {selection ? (
        <Card>
          <AppText size={23} weight="800">{selectionName(selection, locale)}</AppText>
          <AppText muted size={13}>{selection.kind === 'local'
            ? localSourceLabel(selection.variant)
            : `${selection.details.sourceType === 'fndds' ? 'USDA FNDDS 2021–2023' : 'USDA SR Legacy'} · ${selection.details.nameEn}`}</AppText>

          <ChoiceGrid
            value={amountMode}
            onChange={setAmountMode}
            columns={2}
            options={[
              ...(canUseGrams ? [{ value: 'grams' as const, label: label('Weight in grams', 'وزن به گرم') }] : []),
              ...(hasPortions ? [{ value: 'portion' as const, label: label('Official portion', 'سهم رسمی') }] : []),
            ]}
          />

          {amountMode === 'grams' ? (
            <Field
              label={label('Weight (g)', 'وزن (گرم)')}
              value={grams}
              onChangeText={setGrams}
              keyboardType="decimal-pad"
              hint={label('Nutrition is scaled deterministically from the declared basis.', 'تغذیه به‌صورت قطعی از مبنای اعلام‌شده مقیاس می‌شود.')}
            />
          ) : (
            <>
              <ChoiceGrid
                value={portionId}
                onChange={setPortionId}
                columns={1}
                options={selection.kind === 'generic'
                  ? selection.details.portions.slice(0, 12).map((portion) => ({
                      value: String(portion.id),
                      label: `${portion.label} · ${portion.gramWeight.toFixed(1)} g`,
                    }))
                  : selection.variant.portions.slice(0, 12).map((portion) => ({
                      value: portion.id,
                      label: `${locale === 'fa' ? portion.labelFa : portion.labelEn}${portion.gramWeight === null ? '' : ` · ${portion.gramWeight.toFixed(1)} g`}`,
                    }))}
              />
              <Field
                label={label('Number of portions', 'تعداد سهم')}
                value={count}
                onChangeText={setCount}
                keyboardType="decimal-pad"
              />
            </>
          )}

          <AppText weight="700">{label('Meal type', 'نوع وعده')}</AppText>
          <ChoiceGrid
            value={mealType}
            onChange={setMealType}
            columns={2}
            options={[
              { value: 'breakfast', label: label('Breakfast', 'صبحانه') },
              { value: 'lunch', label: label('Lunch', 'ناهار') },
              { value: 'dinner', label: label('Dinner', 'شام') },
              { value: 'snack', label: label('Snack', 'میان‌وعده') },
            ]}
          />

          {estimate ? (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <MetricCard label={label('Calories', 'کالری')} value={Math.round(estimate.center.energyKcal ?? 0)} unit="kcal" />
                <MetricCard label={label('Protein', 'پروتئین')} value={(estimate.center.proteinG ?? 0).toFixed(1)} unit="g" />
                <MetricCard label={label('Carbs', 'کربوهیدرات')} value={(estimate.center.carbsG ?? 0).toFixed(1)} unit="g" />
                <MetricCard label={label('Fat', 'چربی')} value={(estimate.center.fatG ?? 0).toFixed(1)} unit="g" />
              </View>
              <AppText muted size={13}>{amountDescription}{estimate.grams === null ? ` · ${label('weight unknown', 'وزن نامشخص')}` : ''}</AppText>
              <PrimaryButton title={label('Save to diary', 'ثبت در دفتر تغذیه')} onPress={save} loading={saving} />
            </>
          ) : (
            <InlineNotice tone="warning">{label('Enter a valid amount.', 'مقدار معتبری وارد کنید.')}</InlineNotice>
          )}
        </Card>
      ) : null}
    </Screen>
  );
}
