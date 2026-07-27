import * as React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
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
import { searchFoodCatalog, scaleFood } from '@/db/food-repository';
import {
  getUniversalFoodDetails,
  searchUniversalCatalog,
  type IranianIdentityHit,
  type UniversalFoodDetails,
} from '@/db/universal-catalog-repository';
import { logNutritionEstimate } from '@/db/log-repository';
import type { FoodCatalogItem, Meal } from '@/domain/models';
import {
  relativeNutritionRange,
  scaleNutritionVector,
  type NutritionEstimate,
  type NutritionVector,
} from '@/nutrition-core';
import { useApp } from '@/providers/app-provider';

interface LocalResult {
  readonly kind: 'local';
  readonly item: FoodCatalogItem;
}

interface UniversalResult {
  readonly kind: 'universal';
  readonly details: UniversalFoodDetails;
  readonly matchedAliasFa?: string;
}

type SelectedFood = LocalResult | UniversalResult;
type AmountMode = 'grams' | `portion:${number}`;

function positiveNumber(value: string, label: string, maximum = 5_000): number {
  const number = Number(value.replace(',', '.'));
  if (!Number.isFinite(number) || number <= 0 || number > maximum) {
    throw new Error(`${label} is invalid.`);
  }
  return number;
}

function universalBaseVector(details: UniversalFoodDetails): NutritionVector {
  return {
    ...(details.caloriesKcal === null ? {} : { energyKcal: details.caloriesKcal }),
    ...(details.proteinG === null ? {} : { proteinG: details.proteinG }),
    ...(details.carbsG === null ? {} : { carbsG: details.carbsG }),
    ...(details.fatG === null ? {} : { fatG: details.fatG }),
    ...(details.fiberG === null ? {} : { fiberG: details.fiberG }),
    ...(details.sugarsG === null ? {} : { sugarsG: details.sugarsG }),
    ...(details.sodiumMg === null ? {} : { sodiumMg: details.sodiumMg }),
    ...(details.cholesterolMg === null ? {} : { cholesterolMg: details.cholesterolMg }),
  };
}

function uniquePortions(details: UniversalFoodDetails) {
  const seen = new Set<string>();
  return details.portions.filter((portion) => {
    const key = `${portion.label.toLowerCase()}|${portion.gramWeight.toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);
}

export default function FoodBrowserScreen() {
  const { locale, refreshDailySummary } = useApp();
  const label = React.useCallback((en: string, fa: string) => locale === 'fa' ? fa : en, [locale]);
  const [query, setQuery] = React.useState('');
  const [localResults, setLocalResults] = React.useState<FoodCatalogItem[]>([]);
  const [universalResults, setUniversalResults] = React.useState<Array<{
    id: string;
    nameEn: string;
    matchedAliasFa?: string;
    sourceType: 'sr_legacy' | 'fndds';
    caloriesKcal: number | null;
    score: number;
  }>>([]);
  const [identityResults, setIdentityResults] = React.useState<IranianIdentityHit[]>([]);
  const [selected, setSelected] = React.useState<SelectedFood | null>(null);
  const [amountMode, setAmountMode] = React.useState<AmountMode>('grams');
  const [gramsInput, setGramsInput] = React.useState('100');
  const [countInput, setCountInput] = React.useState('1');
  const [localMultiplier, setLocalMultiplier] = React.useState('1');
  const [mealType, setMealType] = React.useState<Meal['type']>('lunch');
  const [loading, setLoading] = React.useState(false);
  const [selectingId, setSelectingId] = React.useState<string | null>(null);
  const [logging, setLogging] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const runSearch = React.useCallback(async () => {
    const value = query.trim();
    if (value.length < 2) {
      setError(label('Enter at least two characters.', 'حداقل دو حرف وارد کنید.'));
      return;
    }
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const [local, universal] = await Promise.all([
        searchFoodCatalog(value, 20),
        searchUniversalCatalog(value, 24),
      ]);
      setLocalResults(local);
      setUniversalResults(universal
        .filter((hit) => hit.kind === 'generic_food')
        .map((hit) => ({
          id: hit.id,
          nameEn: hit.nameEn,
          ...(hit.matchedAliasFa === undefined ? {} : { matchedAliasFa: hit.matchedAliasFa }),
          sourceType: hit.sourceType,
          caloriesKcal: hit.caloriesKcal,
          score: hit.score,
        })));
      setIdentityResults(local.length > 0
        ? []
        : universal.filter((hit): hit is IranianIdentityHit => hit.kind === 'iranian_identity'));
      if (local.length === 0 && universal.length === 0) {
        setNotice(label('No local result was found.', 'نتیجه‌ای در کاتالوگ محلی پیدا نشد.'));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Food search failed.', 'جست‌وجوی غذا انجام نشد.'));
    } finally {
      setLoading(false);
    }
  }, [label, query]);

  React.useEffect(() => {
    const value = query.trim();
    if (value.length < 2) return;
    const timer = setTimeout(() => void runSearch(), 260);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  const selectLocal = (item: FoodCatalogItem) => {
    setSelected({ kind: 'local', item });
    setLocalMultiplier('1');
    setAmountMode('grams');
    setError(null);
    setNotice(null);
  };

  const selectUniversal = async (id: string, matchedAliasFa?: string) => {
    setSelectingId(id);
    setError(null);
    setNotice(null);
    try {
      const details = await getUniversalFoodDetails(id);
      if (!details) throw new Error(label('Food details are unavailable.', 'جزئیات غذا در دسترس نیست.'));
      setSelected({
        kind: 'universal',
        details,
        ...(matchedAliasFa === undefined ? {} : { matchedAliasFa }),
      });
      setAmountMode('grams');
      setGramsInput('100');
      setCountInput('1');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Food details could not be loaded.', 'جزئیات غذا بارگذاری نشد.'));
    } finally {
      setSelectingId(null);
    }
  };

  const estimate = React.useMemo<NutritionEstimate | null>(() => {
    if (!selected) return null;
    try {
      if (selected.kind === 'local') {
        const multiplier = positiveNumber(localMultiplier, 'Multiplier', 20);
        const scaled = scaleFood(selected.item, multiplier);
        const center: NutritionVector = {
          energyKcal: scaled.calories,
          proteinG: scaled.proteinG,
          carbsG: scaled.carbsG,
          fatG: scaled.fatG,
        };
        return {
          grams: selected.item.portionGrams === null ? null : selected.item.portionGrams * multiplier,
          center,
          range: relativeNutritionRange(center, selected.item.variabilityPct / 100),
        };
      }

      let grams: number;
      if (amountMode === 'grams') {
        grams = positiveNumber(gramsInput, 'Grams');
      } else {
        const portionId = Number(amountMode.slice('portion:'.length));
        const portion = selected.details.portions.find((item) => item.id === portionId);
        if (!portion) return null;
        grams = portion.gramWeight * positiveNumber(countInput, 'Count', 50);
      }
      const center = scaleNutritionVector(universalBaseVector(selected.details), grams / 100);
      return {
        grams,
        center,
        range: relativeNutritionRange(center, selected.details.sourceType === 'fndds' ? 0.15 : 0.08),
      };
    } catch {
      return null;
    }
  }, [amountMode, countInput, gramsInput, localMultiplier, selected]);

  const amountLabel = React.useMemo(() => {
    if (!selected) return '';
    if (selected.kind === 'local') {
      return `${locale === 'fa' ? selected.item.portionLabelFa : selected.item.portionLabelEn} × ${localMultiplier}`;
    }
    if (amountMode === 'grams') return `${gramsInput} g`;
    const portionId = Number(amountMode.slice('portion:'.length));
    const portion = selected.details.portions.find((item) => item.id === portionId);
    return portion ? `${countInput} × ${portion.label}` : '';
  }, [amountMode, countInput, gramsInput, localMultiplier, locale, selected]);

  const logSelected = async () => {
    if (!selected || !estimate) {
      setError(label('Choose a valid amount first.', 'ابتدا مقدار معتبر انتخاب کنید.'));
      return;
    }
    setLogging(true);
    setError(null);
    setNotice(null);
    try {
      const name = selected.kind === 'local'
        ? (locale === 'fa' ? selected.item.nameFa : selected.item.nameEn)
        : (locale === 'fa' ? selected.matchedAliasFa ?? selected.details.nameEn : selected.details.nameEn);
      const sourceId = selected.kind === 'local' ? selected.item.id : selected.details.id;
      const sourceType = selected.kind === 'local' && selected.item.sourceType === 'custom' ? 'custom' : 'food';
      await logNutritionEstimate({
        eatenAt: new Date().toISOString(),
        mealType,
        label: `${name} — ${amountLabel}`,
        sourceType,
        sourceId,
        estimate,
      });
      await refreshDailySummary();
      setNotice(label('The food was logged in the local diary.', 'غذا در دفتر محلی ثبت شد.'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Meal logging failed.', 'ثبت غذا انجام نشد.'));
    } finally {
      setLogging(false);
    }
  };

  const selectedName = selected?.kind === 'local'
    ? (locale === 'fa' ? selected.item.nameFa : selected.item.nameEn)
    : selected?.kind === 'universal'
      ? (locale === 'fa' ? selected.matchedAliasFa ?? selected.details.nameEn : selected.details.nameEn)
      : '';

  return (
    <Screen>
      <Stack.Screen options={{ title: label('Food search', 'جست‌وجوی غذا') }} />
      <InlineNotice>{label(
        'Search is fully local. Iranian foods are checked first, then the bundled USDA catalog. Identity-only Iranian records cannot be logged until a nutrition profile exists.',
        'جست‌وجو کاملاً محلی است. ابتدا غذاهای ایرانی بررسی می‌شوند و سپس کاتالوگ داخلی USDA. هویت‌های ایرانی بدون پروفایل تغذیه تا زمان تکمیل داده قابل ثبت نیستند.',
      )}</InlineNotice>

      <Card>
        <Field
          label={label('Food name', 'نام غذا')}
          value={query}
          onChangeText={setQuery}
          placeholder={label('Egg white, tomato, salad…', 'سفیده تخم مرغ، گوجه، سالاد…')}
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => void runSearch()}
        />
        <PrimaryButton title={label('Search offline', 'جست‌وجوی آفلاین')} onPress={runSearch} loading={loading} />
      </Card>

      {notice ? <InlineNotice tone="success">{notice}</InlineNotice> : null}
      {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}

      {selected && estimate ? (
        <Card>
          <AppText size={23} weight="800">{selectedName}</AppText>
          {selected.kind === 'local' ? (
            <>
              <AppText muted>{locale === 'fa' ? selected.item.sourceLabel : selected.item.sourceLabel}</AppText>
              <ChoiceGrid
                value={localMultiplier}
                onChange={setLocalMultiplier}
                options={['0.5', '1', '1.5', '2'].map((value) => ({ value, label: `× ${value}` }))}
                columns={4}
              />
            </>
          ) : (
            <>
              <AppText muted selectable>{selected.details.nameEn} · {selected.details.sourceType === 'fndds' ? 'USDA FNDDS' : 'USDA SR Legacy'}</AppText>
              <ChoiceGrid
                value={amountMode}
                onChange={setAmountMode}
                options={[
                  { value: 'grams' as AmountMode, label: label('Grams', 'گرم'), description: label('Enter exact weight', 'وزن دقیق را وارد کنید') },
                  ...uniquePortions(selected.details).map((portion) => ({
                    value: `portion:${portion.id}` as AmountMode,
                    label: portion.label,
                    description: `${Math.round(portion.gramWeight * 10) / 10} g`,
                  })),
                ]}
                columns={2}
              />
              {amountMode === 'grams' ? (
                <Field label={label('Weight in grams', 'وزن به گرم')} value={gramsInput} onChangeText={setGramsInput} keyboardType="decimal-pad" />
              ) : (
                <Field label={label('Number of portions', 'تعداد سهم')} value={countInput} onChangeText={setCountInput} keyboardType="decimal-pad" />
              )}
            </>
          )}

          <ChoiceGrid
            value={mealType}
            onChange={setMealType}
            options={[
              { value: 'breakfast', label: label('Breakfast', 'صبحانه') },
              { value: 'lunch', label: label('Lunch', 'ناهار') },
              { value: 'dinner', label: label('Dinner', 'شام') },
              { value: 'snack', label: label('Snack', 'میان‌وعده') },
            ]}
            columns={2}
          />

          <AppText muted>{amountLabel}{estimate.grams === null ? '' : ` · ${Math.round(estimate.grams * 10) / 10} g`}</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <MetricCard label={label('Calories', 'کالری')} value={Math.round(estimate.center.energyKcal ?? 0)} unit="kcal" />
            <MetricCard label={label('Protein', 'پروتئین')} value={Math.round((estimate.center.proteinG ?? 0) * 10) / 10} unit="g" />
            <MetricCard label={label('Carbs', 'کربوهیدرات')} value={Math.round((estimate.center.carbsG ?? 0) * 10) / 10} unit="g" />
            <MetricCard label={label('Fat', 'چربی')} value={Math.round((estimate.center.fatG ?? 0) * 10) / 10} unit="g" />
          </View>
          {estimate.range ? (
            <InlineNotice tone="warning">{label(
              `Estimated calorie range: ${Math.round(estimate.range.p10.energyKcal ?? 0)}–${Math.round(estimate.range.p90.energyKcal ?? 0)} kcal.`,
              `بازهٔ تخمینی کالری: ${Math.round(estimate.range.p10.energyKcal ?? 0)} تا ${Math.round(estimate.range.p90.energyKcal ?? 0)} کیلوکالری.`,
            )}</InlineNotice>
          ) : null}
          <PrimaryButton title={label('Log this food', 'ثبت این غذا')} onPress={logSelected} loading={logging} />
        </Card>
      ) : null}

      {localResults.length > 0 ? (
        <View style={{ gap: 12 }}>
          <AppText size={20} weight="800">{label('Iranian and personal foods', 'غذاهای ایرانی و شخصی')}</AppText>
          {localResults.map((item) => (
            <Card key={item.id}>
              <AppText weight="800">{locale === 'fa' ? item.nameFa : item.nameEn}</AppText>
              <AppText muted size={13}>{locale === 'fa' ? item.portionLabelFa : item.portionLabelEn} · {Math.round(item.calories)} kcal</AppText>
              <PrimaryButton title={label('Select', 'انتخاب')} variant="ghost" onPress={() => selectLocal(item)} />
            </Card>
          ))}
        </View>
      ) : null}

      {universalResults.length > 0 ? (
        <View style={{ gap: 12 }}>
          <AppText size={20} weight="800">{label('General foods and ingredients', 'غذاها و مواد عمومی')}</AppText>
          {universalResults.map((item) => (
            <Card key={item.id}>
              <AppText weight="800">{locale === 'fa' ? item.matchedAliasFa ?? item.nameEn : item.nameEn}</AppText>
              <AppText muted selectable size={13}>{item.nameEn}</AppText>
              <AppText muted size={13}>{item.sourceType === 'fndds' ? 'USDA FNDDS' : 'USDA SR Legacy'}{item.caloriesKcal === null ? '' : ` · ${Math.round(item.caloriesKcal)} kcal / 100 g`}</AppText>
              <PrimaryButton
                title={label('Choose amount', 'انتخاب مقدار')}
                variant="ghost"
                loading={selectingId === item.id}
                onPress={() => selectUniversal(item.id, item.matchedAliasFa)}
              />
            </Card>
          ))}
        </View>
      ) : null}

      {identityResults.length > 0 ? (
        <View style={{ gap: 12 }}>
          <AppText size={20} weight="800">{label('Iranian identities awaiting nutrition profiles', 'غذاهای ایرانی در انتظار پروفایل تغذیه')}</AppText>
          {identityResults.map((item) => (
            <Card key={item.canonId}>
              <AppText weight="800">{locale === 'fa' ? item.nameFa : item.nameEn}</AppText>
              <AppText muted selectable>{item.canonId}</AppText>
              <InlineNotice tone="warning">{label(
                'This food identity exists, but no app-ready nutrition profile has been approved yet. No fallback calorie is shown.',
                'هویت این غذا ثبت شده است، اما هنوز پروفایل تغذیهٔ آمادهٔ اپ تأیید نشده؛ بنابراین کالری جایگزین نمایش داده نمی‌شود.',
              )}</InlineNotice>
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
