import * as React from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
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
  countFoodCatalog,
  deleteCustomFood,
  listFoodCatalog,
  saveCustomFood,
  scaleFood,
  searchFoodCatalog,
} from '@/db/food-repository';
import { logMeal } from '@/db/nutrition-meal-repository';
import { FoodCatalogItem, Meal } from '@/domain/models';
import { useApp } from '@/providers/app-provider';

const categories: Array<FoodCatalogItem['category'] | 'all'> = [
  'all',
  'stew',
  'rice',
  'kebab',
  'soup',
  'breakfast',
  'street_food',
  'bread',
  'dessert',
  'dairy_beverage',
  'custom',
];

export default function IranianFoodsScreen() {
  const { locale, refreshDailySummary } = useApp();
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState<(typeof categories)[number]>('all');
  const [foods, setFoods] = React.useState<FoodCatalogItem[]>([]);
  const [selected, setSelected] = React.useState<FoodCatalogItem | null>(null);
  const [multiplier, setMultiplier] = React.useState('1');
  const [mealType, setMealType] = React.useState<Meal['type']>('lunch');
  const [catalogCount, setCatalogCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [logging, setLogging] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showCustom, setShowCustom] = React.useState(false);
  const [customName, setCustomName] = React.useState('');
  const [customPortion, setCustomPortion] = React.useState('');
  const [customCalories, setCustomCalories] = React.useState('');
  const [customProtein, setCustomProtein] = React.useState('');
  const [customCarbs, setCustomCarbs] = React.useState('');
  const [customFat, setCustomFat] = React.useState('');
  const label = React.useCallback((en: string, fa: string) => locale === 'fa' ? fa : en, [locale]);

  const categoryLabel = React.useCallback((value: (typeof categories)[number]) => ({
    all: label('All', 'همه'),
    stew: label('Stews', 'خورش‌ها'),
    rice: label('Rice dishes', 'پلو و برنج'),
    kebab: label('Kebabs', 'کباب‌ها'),
    soup: label('Soups and ash', 'آش و سوپ'),
    breakfast: label('Breakfast', 'صبحانه'),
    street_food: label('Meals and street food', 'غذا و ساندویچ'),
    bread: label('Breads', 'نان‌ها'),
    dessert: label('Desserts', 'دسر و شیرینی'),
    dairy_beverage: label('Dairy and drinks', 'لبنیات و نوشیدنی'),
    ingredient: label('Ingredients', 'مواد اولیه'),
    custom: label('My foods', 'غذاهای من'),
  })[value], [label]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = query.trim()
        ? await searchFoodCatalog(query, 80)
        : await listFoodCatalog({
            ...(category !== 'all' ? { category } : {}),
            limit: 150,
          });
      setFoods(category === 'all' || !query.trim()
        ? result
        : result.filter((item) => item.category === category));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Food search failed.', 'جست‌وجوی غذا انجام نشد.'));
    } finally {
      setLoading(false);
    }
  }, [category, label, query]);

  React.useEffect(() => {
    const timer = setTimeout(() => void load(), 180);
    return () => clearTimeout(timer);
  }, [load]);

  React.useEffect(() => {
    void countFoodCatalog().then(setCatalogCount).catch(() => undefined);
  }, []);

  const selectedScale = selected ? scaleFood(selected, Number(multiplier)) : null;

  const logSelected = async () => {
    if (!selected || !selectedScale) return;
    setLogging(true);
    setError(null);
    try {
      await logMeal({
        eatenAt: new Date().toISOString(),
        mealType,
        description: `${locale === 'fa' ? selected.nameFa : selected.nameEn} — ${locale === 'fa' ? selected.portionLabelFa : selected.portionLabelEn} × ${selectedScale.multiplier}`,
        calories: selectedScale.calories,
        proteinG: selectedScale.proteinG,
        carbsG: selectedScale.carbsG,
        fatG: selectedScale.fatG,
        source: 'catalog',
      });
      await refreshDailySummary();
      setNotice(label('The food was logged locally.', 'غذا به‌صورت محلی ثبت شد.'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Meal logging failed.', 'ثبت غذا انجام نشد.'));
    } finally {
      setLogging(false);
    }
  };

  const saveCustom = async () => {
    setError(null);
    try {
      const calories = Number(customCalories);
      const proteinG = Number(customProtein || 0);
      const carbsG = Number(customCarbs || 0);
      const fatG = Number(customFat || 0);
      if (!customName.trim() || !customPortion.trim()) throw new Error(label('Name and serving are required.', 'نام و اندازه سهم لازم است.'));
      if (![calories, proteinG, carbsG, fatG].every((value) => Number.isFinite(value) && value >= 0)) {
        throw new Error(label('Enter valid nutrition numbers.', 'مقادیر تغذیه‌ای معتبر وارد کنید.'));
      }
      const item = await saveCustomFood({
        nameFa: customName.trim(),
        nameEn: customName.trim(),
        aliasesFa: [],
        aliasesEn: [],
        category: 'custom',
        portionLabelFa: customPortion.trim(),
        portionLabelEn: customPortion.trim(),
        portionGrams: null,
        calories,
        proteinG,
        carbsG,
        fatG,
        variabilityPct: 10,
        confidence: 'high',
        sourceLabel: label('Entered by the device owner', 'واردشده توسط صاحب گوشی'),
        notesFa: 'این مقدار بر اساس اطلاعات واردشده توسط شماست.',
        notesEn: 'This value is based on information entered by you.',
      });
      setSelected(item);
      setCategory('custom');
      setCustomName('');
      setCustomPortion('');
      setCustomCalories('');
      setCustomProtein('');
      setCustomCarbs('');
      setCustomFat('');
      setShowCustom(false);
      setCatalogCount((value) => value + 1);
      setNotice(label('Custom food saved on this phone.', 'غذای سفارشی روی گوشی ذخیره شد.'));
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Custom food could not be saved.', 'غذای سفارشی ذخیره نشد.'));
    }
  };

  const removeSelectedCustom = () => {
    if (!selected || selected.sourceType !== 'custom') return;
    Alert.alert(
      label('Delete custom food?', 'غذای سفارشی حذف شود؟'),
      locale === 'fa' ? selected.nameFa : selected.nameEn,
      [
        { text: label('Cancel', 'انصراف'), style: 'cancel' },
        {
          text: label('Delete', 'حذف'),
          style: 'destructive',
          onPress: () => {
            void deleteCustomFood(selected.id).then(async () => {
              setSelected(null);
              setCatalogCount((value) => Math.max(0, value - 1));
              await load();
            });
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <AppText size={30} weight="800">{label('Iranian food catalog', 'کاتالوگ غذاهای ایرانی')}</AppText>
        <AppText muted>{label(
          `${catalogCount} local entries. Mixed-dish values are ranges because recipes, oil, and serving sizes vary.`,
          `${catalogCount} قلم محلی. برای غذاهای ترکیبی بازه نمایش داده می‌شود چون دستور، روغن و اندازه سهم متفاوت است.`,
        )}</AppText>
      </View>

      <InlineNotice tone="warning">{label(
        'This is an expandable local catalog, not a claim that every regional recipe has one exact calorie value. Add your own weighed recipes for the highest personal accuracy.',
        'این یک کاتالوگ محلی قابل‌گسترش است، نه ادعای وجود یک کالری دقیق برای تمام دستورهای منطقه‌ای. برای بیشترین دقت، دستورهای وزن‌شده خودتان را اضافه کنید.',
      )}</InlineNotice>

      <Card>
        <Field
          label={label('Search Persian or English food name', 'جست‌وجوی نام فارسی یا انگلیسی غذا')}
          value={query}
          onChangeText={setQuery}
          placeholder={label('Example: ghormeh sabzi, قورمه سبزی', 'مثلاً قورمه سبزی یا ghormeh sabzi')}
          autoCorrect={false}
        />
        <ChoiceGrid
          value={category}
          onChange={setCategory}
          options={categories.map((value) => ({ value, label: categoryLabel(value) }))}
          columns={2}
        />
        <PrimaryButton title={label('Add my own food', 'افزودن غذای خودم')} variant="secondary" onPress={() => setShowCustom((value) => !value)} />
      </Card>

      {showCustom ? (
        <Card>
          <AppText size={20} weight="800">{label('Custom measured food', 'غذای اندازه‌گیری‌شده سفارشی')}</AppText>
          <Field label={label('Food name', 'نام غذا')} value={customName} onChangeText={setCustomName} />
          <Field label={label('Serving description', 'توضیح اندازه سهم')} value={customPortion} onChangeText={setCustomPortion} placeholder={label('Example: my 350 g bowl', 'مثلاً کاسه ۳۵۰ گرمی من')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <View style={{ flex: 1, minWidth: 130 }}><Field label="kcal" value={customCalories} onChangeText={setCustomCalories} keyboardType="decimal-pad" /></View>
            <View style={{ flex: 1, minWidth: 130 }}><Field label={label('Protein g', 'پروتئین g')} value={customProtein} onChangeText={setCustomProtein} keyboardType="decimal-pad" /></View>
            <View style={{ flex: 1, minWidth: 130 }}><Field label={label('Carbs g', 'کربوهیدرات g')} value={customCarbs} onChangeText={setCustomCarbs} keyboardType="decimal-pad" /></View>
            <View style={{ flex: 1, minWidth: 130 }}><Field label={label('Fat g', 'چربی g')} value={customFat} onChangeText={setCustomFat} keyboardType="decimal-pad" /></View>
          </View>
          <PrimaryButton title={label('Save custom food', 'ذخیره غذای سفارشی')} onPress={saveCustom} />
        </Card>
      ) : null}

      {notice ? <InlineNotice tone="success">{notice}</InlineNotice> : null}
      {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}
      {loading ? <AppText muted>{label('Searching local catalog…', 'در حال جست‌وجوی کاتالوگ محلی…')}</AppText> : null}

      {selected && selectedScale ? (
        <Card>
          <AppText size={23} weight="800">{locale === 'fa' ? selected.nameFa : selected.nameEn}</AppText>
          <AppText muted>{locale === 'fa' ? selected.portionLabelFa : selected.portionLabelEn}</AppText>
          <ChoiceGrid
            value={multiplier}
            onChange={setMultiplier}
            options={['0.5', '1', '1.5', '2'].map((value) => ({ value, label: `× ${value}` }))}
            columns={4}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <MetricCard label={label('Calories', 'کالری')} value={selectedScale.calories} unit="kcal" />
            <MetricCard label={label('Likely range', 'بازه محتمل')} value={`${selectedScale.caloriesLow}–${selectedScale.caloriesHigh}`} unit="kcal" />
            <MetricCard label={label('Protein', 'پروتئین')} value={selectedScale.proteinG} unit="g" />
            <MetricCard label={label('Carbs', 'کربوهیدرات')} value={selectedScale.carbsG} unit="g" />
            <MetricCard label={label('Fat', 'چربی')} value={selectedScale.fatG} unit="g" />
          </View>
          <AppText muted size={13}>{locale === 'fa' ? selected.notesFa : selected.notesEn}</AppText>
          <AppText weight="600">{label('Meal type', 'نوع وعده')}</AppText>
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
          <PrimaryButton title={label('Log this serving', 'ثبت این مقدار')} onPress={logSelected} loading={logging} />
          {selected.sourceType === 'custom' ? <PrimaryButton title={label('Delete this custom food', 'حذف این غذای سفارشی')} variant="danger" onPress={removeSelectedCustom} /> : null}
        </Card>
      ) : null}

      <View style={{ gap: 10 }}>
        {foods.map((item) => {
          const scaled = scaleFood(item, 1);
          const active = selected?.id === item.id;
          return (
            <Card key={item.id} style={active ? { borderWidth: 2 } : undefined}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText weight="800" size={17}>{locale === 'fa' ? item.nameFa : item.nameEn}</AppText>
                  <AppText muted size={12}>{locale === 'fa' ? item.portionLabelFa : item.portionLabelEn}</AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <AppText weight="800">{scaled.calories} kcal</AppText>
                  <AppText muted size={11}>{scaled.caloriesLow}–{scaled.caloriesHigh}</AppText>
                </View>
              </View>
              <AppText muted size={12}>P {scaled.proteinG}g · C {scaled.carbsG}g · F {scaled.fatG}g</AppText>
              <PrimaryButton title={label('Select and adjust serving', 'انتخاب و تنظیم مقدار')} variant={active ? 'primary' : 'secondary'} onPress={() => {
                setSelected(item);
                setMultiplier('1');
                setNotice(null);
              }} />
            </Card>
          );
        })}
        {!loading && foods.length === 0 ? <InlineNotice>{label('No local match. Try another spelling or add a custom food.', 'نتیجه محلی پیدا نشد. املای دیگری امتحان کنید یا غذای سفارشی اضافه کنید.')}</InlineNotice> : null}
      </View>

      <PrimaryButton title={label('Back', 'بازگشت')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
