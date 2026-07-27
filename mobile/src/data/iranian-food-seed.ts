import { FoodCatalogItem, FoodCatalogItemSchema } from '@/domain/models';

type SeedCategory = FoodCatalogItem['category'];
type SeedRow = readonly [
  id: string,
  nameFa: string,
  nameEn: string,
  category: SeedCategory,
  portionFa: string,
  portionEn: string,
  calories: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
  aliasesFa?: readonly string[],
  aliasesEn?: readonly string[],
  portionGrams?: number | null,
];

const CATALOG_VERSION_DATE = '2026-07-25T00:00:00.000Z';
const SOURCE_LABEL = 'NeoFit Iranian foods starter catalog v1 — standard serving estimates; recipe and oil can materially change values.';

const variabilityByCategory: Record<SeedCategory, number> = {
  stew: 25,
  rice: 22,
  kebab: 20,
  soup: 20,
  breakfast: 18,
  street_food: 24,
  bread: 12,
  dessert: 22,
  dairy_beverage: 12,
  ingredient: 10,
  custom: 20,
};

const rows: readonly SeedRow[] = [
  ['khoresh-kadoo', 'خورش کدو', 'Persian zucchini stew', 'stew', 'یک پرس بدون برنج', '1 serving without rice', 250, 17, 14, 13, ['خورشت کدو'], ['khoresh kadoo', 'zucchini stew']],
  ['khoresh-karafs', 'خورش کرفس', 'Persian celery stew', 'stew', 'یک پرس بدون برنج', '1 serving without rice', 260, 18, 12, 15, ['خورشت کرفس'], ['khoresh karafs', 'celery stew']],
  ['khoresh-aloo-esfenaj', 'خورش آلو اسفناج', 'Persian prune and spinach stew', 'stew', 'یک پرس بدون برنج', '1 serving without rice', 270, 18, 15, 14, ['خورشت آلو اسفناج', 'آلو اسفناج'], ['aloo esfenaj', 'prune spinach stew']],
  ['khoresh-loobia-sabz', 'خورش لوبیا سبز', 'Persian green bean stew', 'stew', 'یک پرس بدون برنج', '1 serving without rice', 280, 18, 16, 15, ['خورشت لوبیا سبز'], ['green bean stew', 'loobia sabz stew']],
  ['gheimeh', 'قیمه', 'Gheimeh stew', 'stew', 'یک پرس بدون برنج', '1 serving without rice', 300, 18, 20, 16, ['خورش قیمه', 'خورشت قیمه'], ['gheimeh', 'split pea stew']],
  ['khoresh-beh', 'خورش به', 'Persian quince stew', 'stew', 'یک پرس بدون برنج', '1 serving without rice', 300, 16, 24, 15, ['خورشت به'], ['quince stew', 'khoresh beh']],
  ['khoresh-bademjan', 'خورش بادمجان', 'Persian eggplant stew', 'stew', 'یک پرس بدون برنج', '1 serving without rice', 320, 19, 16, 20, ['خورشت بادمجان'], ['eggplant stew', 'khoresh bademjan']],
  ['ghormeh-sabzi', 'قورمه‌سبزی', 'Ghormeh sabzi', 'stew', 'یک پرس بدون برنج', '1 serving without rice', 330, 22, 14, 20, ['قورمه سبزی', 'قرمه سبزی', 'خورش قورمه‌سبزی'], ['ghormeh sabzi', 'herb stew']],
  ['gheimeh-bademjan', 'قیمه بادمجان', 'Gheimeh eggplant stew', 'stew', 'یک پرس بدون برنج', '1 serving without rice', 340, 18, 20, 20, ['قیمه بادمجون'], ['gheimeh bademjan']],
  ['fesenjan', 'فسنجان', 'Fesenjan walnut pomegranate stew', 'stew', 'یک پرس بدون برنج', '1 serving without rice', 450, 20, 18, 34, ['فسنجون', 'خورش فسنجان'], ['fesenjan', 'walnut pomegranate stew']],

  ['tahdig-potato', 'ته‌دیگ سیب‌زمینی', 'Potato tahdig', 'rice', 'یک تکه متوسط', '1 medium piece', 220, 3, 28, 11, ['ته دیگ سیب زمینی'], ['potato tahdig']],
  ['chelo-sefid', 'چلو سفید', 'Plain Persian rice', 'rice', 'حدود یک‌ونیم پیمانه پخته', 'about 1.5 cups cooked', 380, 7, 82, 4, ['برنج سفید', 'چلو'], ['chelo', 'white rice']],
  ['sabzi-polo', 'سبزی پلو', 'Persian herb rice', 'rice', 'یک پرس بدون ماهی', '1 serving without fish', 400, 9, 80, 6, ['سبزی‌پلو'], ['sabzi polo', 'herb rice']],
  ['baghali-polo-plain', 'شوید باقالی‌پلو', 'Dill fava bean rice', 'rice', 'یک پرس بدون گوشت', '1 serving without meat', 450, 12, 78, 10, ['باقالی پلو', 'باقلا پلو', 'شوید باقالی پلو'], ['baghali polo', 'dill fava rice']],
  ['estamboli-polo', 'استانبولی پلو', 'Estamboli polo', 'rice', 'یک پرس', '1 serving', 470, 17, 72, 14, ['استامبولی پلو', 'دمی گوجه'], ['estamboli polo', 'tomato rice']],
  ['adas-polo', 'عدس پلو', 'Lentil rice', 'rice', 'یک پرس', '1 serving', 480, 18, 78, 12, ['عدس‌پلو'], ['adas polo', 'lentil rice']],
  ['kalam-polo', 'کلم پلو', 'Cabbage herb rice', 'rice', 'یک پرس', '1 serving', 500, 20, 70, 16, ['کلم‌پلو'], ['kalam polo', 'cabbage rice']],
  ['loobia-polo', 'لوبیا پلو', 'Green bean rice', 'rice', 'یک پرس', '1 serving', 520, 22, 72, 16, ['لوبیاپلو'], ['loobia polo', 'green bean rice']],
  ['zereshk-polo-morgh', 'زرشک‌پلو با مرغ', 'Barberry rice with chicken', 'rice', 'یک پرس', '1 serving', 560, 35, 70, 18, ['زرشک پلو با مرغ', 'مرغ و زرشک پلو'], ['zereshk polo ba morgh', 'barberry rice chicken']],
  ['tahchin-morgh', 'ته‌چین مرغ', 'Chicken tahchin', 'rice', 'یک پرس', '1 serving', 600, 28, 65, 26, ['ته چین مرغ'], ['chicken tahchin']],
  ['baghali-polo-mahicheh', 'باقالی‌پلو با ماهیچه', 'Fava bean rice with lamb shank', 'rice', 'یک پرس', '1 serving', 650, 38, 70, 26, ['باقالی پلو با ماهیچه', 'باقلا پلو با ماهیچه'], ['baghali polo mahicheh', 'lamb shank rice']],

  ['jegar-kebab', 'جگر', 'Grilled liver skewer', 'kebab', 'یک سیخ', '1 skewer', 180, 22, 4, 8, ['جگر کبابی'], ['jegar', 'grilled liver']],
  ['joojeh-kebab', 'جوجه کباب', 'Joojeh kebab', 'kebab', 'یک پرس', '1 serving', 320, 40, 4, 15, ['جوجه‌کباب'], ['joojeh kebab', 'chicken kebab']],
  ['kebab-barg', 'کباب برگ', 'Kebab barg', 'kebab', 'یک پرس', '1 serving', 350, 45, 2, 18, ['برگ'], ['kebab barg', 'filet kebab']],
  ['chenjeh', 'چنجه', 'Chenjej kebab', 'kebab', 'یک پرس', '1 serving', 360, 46, 2, 18, ['کباب چنجه'], ['chenjeh', 'lamb chunk kebab']],
  ['kebab-torsh', 'کباب ترش', 'Torsh kebab', 'kebab', 'یک پرس', '1 serving', 380, 40, 6, 22, ['کباب‌ترش'], ['kebab torsh', 'sour kebab']],
  ['kebab-bakhtiari', 'کباب بختیاری', 'Bakhtiari kebab', 'kebab', 'یک پرس', '1 serving', 420, 44, 4, 25, ['بختیاری'], ['bakhtiari kebab']],
  ['kebab-koobideh', 'کباب کوبیده', 'Koobideh kebab', 'kebab', 'دو سیخ', '2 skewers', 480, 36, 2, 36, ['کوبیده', 'کباب‌کوبیده'], ['koobideh', 'ground meat kebab']],
  ['shishlik', 'شیشلیک', 'Shishlik', 'kebab', 'چهار تکه', '4 pieces', 700, 50, 4, 52, ['کباب شیشلیک'], ['shishlik', 'lamb rib kebab']],
  ['chelo-kebab-koobideh', 'چلوکباب کوبیده', 'Rice with koobideh kebab', 'kebab', 'یک پرس کامل', '1 full serving', 740, 40, 84, 30, ['چلو کباب کوبیده'], ['chelo kebab koobideh']],

  ['soup-jo', 'سوپ جو', 'Barley soup', 'soup', 'یک کاسه', '1 bowl', 150, 7, 22, 4, ['سوپ‌جو'], ['barley soup', 'soup jo']],
  ['eshkeneh', 'اشکنه', 'Eshkeneh', 'soup', 'یک کاسه', '1 bowl', 180, 7, 18, 9, ['اشکنه تخم مرغ'], ['eshkeneh']],
  ['ash-doogh', 'آش دوغ', 'Yogurt herb soup', 'soup', 'یک کاسه', '1 bowl', 200, 8, 28, 7, ['آش‌دوغ'], ['ash doogh', 'yogurt soup']],
  ['ash-anar', 'آش انار', 'Pomegranate soup', 'soup', 'یک کاسه', '1 bowl', 220, 8, 36, 5, ['آش‌انار'], ['ash anar', 'pomegranate soup']],
  ['ash-reshteh', 'آش رشته', 'Ash reshteh', 'soup', 'یک کاسه', '1 bowl', 250, 10, 40, 6, ['آش‌رشته'], ['ash reshteh', 'noodle herb soup']],
  ['haleem', 'حلیم', 'Halim wheat porridge', 'soup', 'یک کاسه متوسط', '1 medium bowl', 430, 22, 55, 12, ['هلیم'], ['halim', 'haleem']],
  ['abgoosht', 'آبگوشت', 'Abgoosht / dizi', 'soup', 'یک پرس کامل', '1 full serving', 550, 30, 40, 30, ['دیزی', 'آب گوشت'], ['abgoosht', 'dizi']],

  ['boiled-egg', 'تخم‌مرغ آب‌پز', 'Boiled egg', 'breakfast', 'یک عدد بزرگ', '1 large egg', 78, 6, 1, 5, ['تخم مرغ آب پز'], ['boiled egg'], 50],
  ['halva-ardeh', 'حلوا ارده', 'Tahini halva', 'breakfast', 'یک سهم کوچک', '1 small serving', 160, 4, 14, 10, ['حلواارده', 'ارده حلوا'], ['halva ardeh', 'tahini halva']],
  ['bread-cheese-tea', 'نان و پنیر و چای', 'Bread, cheese and tea', 'breakfast', 'یک صبحانه ساده', '1 simple breakfast', 200, 8, 28, 6, ['نان پنیر چای'], ['bread cheese tea']],
  ['nimroo', 'نیمرو', 'Fried eggs', 'breakfast', 'دو عدد با روغن معمول', '2 eggs with typical oil', 220, 14, 2, 17, ['تخم مرغ نیمرو'], ['nimroo', 'fried eggs']],
  ['adasi', 'عدسی', 'Lentil stew', 'breakfast', 'یک کاسه', '1 bowl', 230, 14, 36, 4, ['خوراک عدس'], ['adasi', 'lentil stew']],
  ['omelet-gojeh', 'املت گوجه', 'Tomato omelet', 'breakfast', 'یک پرس', '1 serving', 280, 15, 8, 20, ['املت گوجه فرنگی'], ['tomato omelet']],
  ['cream-honey', 'خامه و عسل', 'Cream and honey with bread', 'breakfast', 'یک سهم همراه نان', '1 serving with bread', 300, 6, 32, 17, ['عسل و خامه'], ['cream honey breakfast']],
  ['kaleh-pacheh', 'کله‌پاچه', 'Kaleh pacheh', 'breakfast', 'یک پرس متوسط', '1 medium serving', 480, 40, 4, 34, ['کله پاچه'], ['kaleh pacheh']],

  ['kuku-sabzi', 'کوکو سبزی', 'Kuku sabzi', 'street_food', 'یک تکه متوسط', '1 medium piece', 150, 7, 8, 10, ['کوکوسبزی'], ['kuku sabzi', 'herb frittata']],
  ['samboseh', 'سمبوسه', 'Samosa', 'street_food', 'یک عدد', '1 piece', 180, 5, 20, 9, ['سمبوسه سیب زمینی'], ['samboseh', 'samosa']],
  ['shami', 'شامی', 'Shami patty', 'street_food', 'یک عدد متوسط', '1 medium patty', 200, 12, 14, 10, ['شامی کباب'], ['shami']],
  ['kotlet', 'کتلت', 'Kotlet', 'street_food', 'یک عدد متوسط', '1 medium patty', 220, 11, 16, 12, ['کتلت گوشت'], ['kotlet', 'Persian meat potato patty']],
  ['dolmeh-barg-mo', 'دلمه برگ مو', 'Stuffed grape leaves', 'street_food', 'پنج عدد', '5 pieces', 250, 9, 26, 12, ['دلمه برگ', 'دلمه برگ انگور'], ['dolmeh barg mo', 'stuffed grape leaves']],
  ['loobia-chiti', 'خوراک لوبیا چیتی', 'Pinto bean stew', 'street_food', 'یک کاسه', '1 bowl', 280, 14, 40, 7, ['لوبیا چیتی', 'خوراک لوبیا'], ['pinto bean stew', 'loobia chiti']],
  ['pizza-slice', 'پیتزا', 'Pizza', 'street_food', 'یک برش متوسط', '1 medium slice', 285, 12, 34, 10, ['پیتزا مخلوط'], ['pizza slice']],
  ['haleem-bademjan', 'حلیم بادمجان', 'Halim bademjan', 'street_food', 'یک کاسه کوچک', '1 small bowl', 300, 11, 24, 18, ['هلیم بادمجان'], ['halim bademjan']],
  ['mirza-ghasemi', 'میرزاقاسمی', 'Mirza ghasemi', 'street_food', 'یک پرس', '1 serving', 320, 10, 18, 24, ['میرزا قاسمی'], ['mirza ghasemi']],
  ['french-fries', 'سیب‌زمینی سرخ‌کرده', 'French fries', 'street_food', 'یک سهم متوسط', '1 medium serving', 320, 4, 42, 16, ['سیب زمینی سرخ کرده'], ['french fries']],
  ['kashk-bademjan', 'کشک بادمجان', 'Kashk bademjan', 'street_food', 'یک پرس', '1 serving', 350, 12, 20, 25, ['کشک بادمجون'], ['kashk bademjan']],
  ['hamburger', 'همبرگر', 'Hamburger', 'street_food', 'یک ساندویچ', '1 sandwich', 350, 17, 32, 17, ['برگر'], ['burger', 'hamburger']],
  ['sausage-sandwich', 'ساندویچ سوسیس', 'Sausage sandwich', 'street_food', 'یک ساندویچ', '1 sandwich', 450, 16, 42, 24, ['هات داگ', 'سوسیس بندری'], ['sausage sandwich', 'hot dog']],
  ['macaroni-iranian', 'ماکارونی', 'Iranian-style macaroni', 'street_food', 'یک پرس', '1 serving', 450, 18, 60, 14, ['ماکارانی', 'پاستا ایرانی'], ['Iranian macaroni', 'Persian pasta']],
  ['olivieh-sandwich', 'الویه', 'Olivieh sandwich', 'street_food', 'یک ساندویچ', '1 sandwich', 480, 16, 38, 28, ['سالاد الویه', 'ساندویچ الویه'], ['olivieh', 'Persian potato salad sandwich']],
  ['falafel-sandwich', 'فلافل', 'Falafel sandwich', 'street_food', 'یک ساندویچ', '1 sandwich', 520, 14, 60, 25, ['ساندویچ فلافل'], ['falafel sandwich']],

  ['lavash', 'نان لواش', 'Lavash bread', 'bread', 'یک ورق متوسط', '1 medium sheet', 80, 3, 16, 1, ['لواش'], ['lavash']],
  ['taftoon', 'نان تافتون', 'Taftoon bread', 'bread', 'یک عدد متوسط', '1 medium bread', 130, 4, 26, 1, ['تافتون'], ['taftoon']],
  ['sangak', 'نان سنگک', 'Sangak bread', 'bread', 'یک کف دست بزرگ', '1 large palm-size piece', 160, 5, 32, 1, ['سنگک'], ['sangak']],
  ['barbari', 'نان بربری', 'Barbari bread', 'bread', 'نصف نان متوسط', 'half a medium bread', 200, 6, 40, 2, ['بربری'], ['barbari']],

  ['baklava', 'باقلوا', 'Baklava', 'dessert', 'یک تکه کوچک', '1 small piece', 130, 2, 16, 7, ['باقلوای ایرانی'], ['baklava']],
  ['fereni', 'فرنی', 'Fereni rice-flour pudding', 'dessert', 'یک کاسه کوچک', '1 small bowl', 200, 5, 34, 5, ['فرنی آرد برنج'], ['fereni', 'rice flour pudding']],
  ['bastani-sonnati', 'بستنی سنتی', 'Persian saffron ice cream', 'dessert', 'یک اسکوپ بزرگ', '1 large scoop', 200, 4, 26, 9, ['بستنی زعفرانی'], ['bastani sonnati', 'Persian ice cream']],
  ['shir-berenj', 'شیربرنج', 'Rice pudding', 'dessert', 'یک کاسه', '1 bowl', 230, 6, 38, 6, ['شیر برنج'], ['shir berenj', 'rice pudding']],
  ['halva', 'حلوا', 'Persian halva', 'dessert', 'یک سهم کوچک', '1 small serving', 240, 3, 32, 12, ['حلوای آرد'], ['Persian halva']],
  ['sholeh-zard', 'شله زرد', 'Saffron rice pudding', 'dessert', 'یک کاسه', '1 bowl', 250, 5, 48, 5, ['شله‌زرد'], ['sholeh zard', 'saffron rice pudding']],
  ['noon-khamei', 'نان خامه‌ای', 'Cream puff', 'dessert', 'یک عدد متوسط', '1 medium piece', 250, 4, 28, 14, ['نان خامه ای'], ['cream puff']],
  ['faloodeh', 'فالوده شیرازی', 'Shirazi faloodeh', 'dessert', 'یک کاسه', '1 bowl', 280, 2, 56, 5, ['فالوده'], ['faloodeh', 'faloodeh Shirazi']],
  ['ranginak', 'رنگینک', 'Ranginak date dessert', 'dessert', 'یک برش متوسط', '1 medium slice', 320, 5, 40, 16, ['رنگینک خرما'], ['ranginak', 'date walnut dessert']],
  ['zoolbia-bamieh', 'زولبیا و بامیه', 'Zoolbia and bamieh', 'dessert', 'صد گرم', '100 g', 380, 2, 60, 16, ['زولبیا بامیه'], ['zoolbia bamieh'], 100],

  ['tea-unsweetened', 'چای بدون قند', 'Unsweetened tea', 'dairy_beverage', 'یک فنجان', '1 cup', 2, 0, 0, 0, ['چای ساده', 'چای تلخ'], ['tea', 'unsweetened tea'], 240],
  ['doogh', 'دوغ', 'Doogh yogurt drink', 'dairy_beverage', 'یک لیوان', '1 glass', 70, 5, 8, 2, ['دوغ کم نمک'], ['doogh', 'yogurt drink'], 240],
  ['panir', 'پنیر', 'White cheese', 'dairy_beverage', 'سی گرم', '30 g', 80, 5, 1, 6, ['پنیر سفید', 'پنیر صبحانه'], ['white cheese', 'feta-style cheese'], 30],
  ['kashk', 'کشک', 'Kashk', 'dairy_beverage', 'دو قاشق غذاخوری', '2 tablespoons', 90, 8, 6, 4, ['کشک مایع'], ['kashk']],
  ['mast', 'ماست', 'Yogurt', 'dairy_beverage', 'یک کاسه', '1 bowl', 100, 8, 12, 3, ['ماست ساده'], ['yogurt']],
  ['shir', 'شیر', 'Milk', 'dairy_beverage', 'یک لیوان', '1 glass', 120, 8, 12, 5, ['شیر گاو'], ['milk'], 240],
  ['sharbat-ablimoo', 'شربت آبلیمو', 'Lemonade syrup drink', 'dairy_beverage', 'یک لیوان', '1 glass', 120, 0, 30, 0, ['شربت لیمو', 'آبلیمو شربت'], ['lemonade', 'lemon syrup drink'], 240],
  ['mast-chakideh', 'ماست چکیده', 'Strained yogurt', 'dairy_beverage', 'یک کاسه کوچک', '1 small bowl', 130, 9, 8, 8, ['ماست یونانی ایرانی'], ['strained yogurt', 'Greek yogurt']],
] as const;

export const IRANIAN_FOOD_SEED: FoodCatalogItem[] = rows.map((row) => {
  const [
    id,
    nameFa,
    nameEn,
    category,
    portionLabelFa,
    portionLabelEn,
    calories,
    proteinG,
    carbsG,
    fatG,
    aliasesFa = [],
    aliasesEn = [],
    portionGrams = null,
  ] = row;

  const mixedDish = ['stew', 'rice', 'kebab', 'soup', 'street_food', 'dessert'].includes(category);
  return FoodCatalogItemSchema.parse({
    id: `iranian-${id}`,
    nameFa,
    nameEn,
    aliasesFa: [...aliasesFa],
    aliasesEn: [...aliasesEn],
    category,
    portionLabelFa,
    portionLabelEn,
    portionGrams,
    calories,
    proteinG,
    carbsG,
    fatG,
    variabilityPct: variabilityByCategory[category],
    confidence: mixedDish ? 'medium' : 'high',
    sourceType: 'seeded',
    sourceLabel: SOURCE_LABEL,
    notesFa: mixedDish
      ? 'مقدار واقعی به دستور پخت، روغن و اندازه سهم وابسته است؛ بازه نمایش‌داده‌شده را مبنا قرار دهید.'
      : 'مقدار بر اساس یک سهم استاندارد تقریبی است.',
    notesEn: mixedDish
      ? 'Actual values vary with recipe, oil, and serving size; use the displayed range.'
      : 'Value is an estimate for one standard serving.',
    updatedAt: CATALOG_VERSION_DATE,
  });
});
