import type {
  ExerciseDetails,
  FoodLookupResult,
  Meal,
  NutritionPlan,
  WorkoutPlan,
} from "@/lib/neofit-models";

const ingredients = (items: Array<[string, string, string]>) =>
  items.map(([name, quantity, category]) => ({ name, quantity, category }));

export const demoNutritionPlan: NutritionPlan = [
  {
    day: "امروز",
    totalCalories: 2200,
    meals: [
      {
        id: "today-breakfast",
        type: "صبحانه",
        name: "تخم‌مرغ آب‌پز، نان سنگک و خیار",
        calories: 420,
        ingredients: ingredients([
          ["تخم‌مرغ", "۲ عدد", "پروتئین"],
          ["نان سنگک", "یک‌چهارم نان", "غلات"],
          ["خیار", "۱ عدد", "سبزیجات"],
        ]),
      },
      {
        id: "today-lunch",
        type: "ناهار",
        name: "قورمه‌سبزی با چلو",
        calories: 710,
        ingredients: ingredients([
          ["خورش قورمه‌سبزی", "۱ پرس", "غذای ایرانی"],
          ["برنج پخته", "۲۵۰ گرم", "غلات"],
          ["سالاد شیرازی", "۱ کاسه", "سبزیجات"],
        ]),
      },
      {
        id: "today-dinner",
        type: "شام",
        name: "جوجه‌کباب با گوجه و نان",
        calories: 630,
        ingredients: ingredients([
          ["جوجه‌کباب", "۲۰۰ گرم", "پروتئین"],
          ["نان لواش", "۱ برگ", "غلات"],
          ["گوجه کبابی", "۲ عدد", "سبزیجات"],
        ]),
      },
      {
        id: "today-snack",
        type: "میان‌وعده",
        name: "ماست و موز",
        calories: 280,
        ingredients: ingredients([
          ["ماست کم‌چرب", "۱ لیوان", "لبنیات"],
          ["موز", "۱ عدد", "میوه"],
        ]),
      },
    ],
  },
  {
    day: "فردا",
    totalCalories: 2150,
    meals: [
      {
        id: "tomorrow-breakfast",
        type: "صبحانه",
        name: "عدسی با نان",
        calories: 430,
        ingredients: ingredients([
          ["عدسی", "۱ کاسه", "حبوبات"],
          ["نان سنگک", "یک‌چهارم نان", "غلات"],
        ]),
      },
      {
        id: "tomorrow-lunch",
        type: "ناهار",
        name: "زرشک‌پلو با مرغ",
        calories: 760,
        ingredients: ingredients([
          ["مرغ پخته", "۱ ران", "پروتئین"],
          ["زرشک‌پلو", "۲۵۰ گرم", "غلات"],
        ]),
      },
      {
        id: "tomorrow-dinner",
        type: "شام",
        name: "کوکو سبزی با ماست",
        calories: 520,
        ingredients: ingredients([
          ["کوکو سبزی", "۳ برش", "غذای ایرانی"],
          ["ماست", "۱ کاسه", "لبنیات"],
        ]),
      },
      {
        id: "tomorrow-snack",
        type: "میان‌وعده",
        name: "سیب و گردو",
        calories: 250,
        ingredients: ingredients([
          ["سیب", "۱ عدد", "میوه"],
          ["گردو", "۳ عدد", "مغزها"],
        ]),
      },
    ],
  },
  {
    day: "پس‌فردا",
    totalCalories: 2180,
    meals: [
      {
        id: "day3-breakfast",
        type: "صبحانه",
        name: "پنیر، گردو و نان",
        calories: 410,
        ingredients: ingredients([
          ["پنیر", "۶۰ گرم", "لبنیات"],
          ["گردو", "۲ عدد", "مغزها"],
          ["نان", "۱ سهم", "غلات"],
        ]),
      },
      {
        id: "day3-lunch",
        type: "ناهار",
        name: "چلوکباب کوبیده",
        calories: 820,
        ingredients: ingredients([
          ["کباب کوبیده", "۲ سیخ", "پروتئین"],
          ["چلو", "۲۵۰ گرم", "غلات"],
          ["گوجه", "۲ عدد", "سبزیجات"],
        ]),
      },
      {
        id: "day3-dinner",
        type: "شام",
        name: "سوپ جو و مرغ",
        calories: 430,
        ingredients: ingredients([
          ["سوپ جو", "۲ کاسه", "غذای ایرانی"],
          ["مرغ ریش‌ریش", "۸۰ گرم", "پروتئین"],
        ]),
      },
      {
        id: "day3-snack",
        type: "میان‌وعده",
        name: "شیر و خرما",
        calories: 260,
        ingredients: ingredients([
          ["شیر", "۱ لیوان", "لبنیات"],
          ["خرما", "۳ عدد", "میوه"],
        ]),
      },
    ],
  },
];

export const demoWorkoutPlan: WorkoutPlan = [
  {
    id: "push-a",
    day: "شنبه",
    title: "فشار بالاتنه",
    focus: "سینه، سرشانه و پشت بازو",
    duration: "۶۰ دقیقه",
    calories: 390,
    exercises: [
      { id: "bench-press", name: "پرس سینه هالتر", sets: 4, reps: "۸–۱۰", rest: "۹۰ ثانیه" },
      { id: "incline-db-press", name: "پرس بالا سینه دمبل", sets: 3, reps: "۱۰–۱۲", rest: "۷۵ ثانیه" },
      { id: "shoulder-press", name: "پرس سرشانه دمبل", sets: 3, reps: "۸–۱۰", rest: "۷۵ ثانیه" },
      { id: "triceps-pushdown", name: "پشت بازو سیم‌کش", sets: 3, reps: "۱۲–۱۵", rest: "۶۰ ثانیه" },
    ],
  },
  {
    id: "pull-a",
    day: "دوشنبه",
    title: "کشش بالاتنه",
    focus: "پشت و جلو بازو",
    duration: "۶۰ دقیقه",
    calories: 370,
    exercises: [
      { id: "lat-pulldown", name: "لت سیم‌کش", sets: 4, reps: "۸–۱۲", rest: "۹۰ ثانیه" },
      { id: "row", name: "قایقی سیم‌کش", sets: 3, reps: "۱۰–۱۲", rest: "۷۵ ثانیه" },
      { id: "rear-delt", name: "نشر خم", sets: 3, reps: "۱۲–۱۵", rest: "۶۰ ثانیه" },
      { id: "curl", name: "جلو بازو دمبل", sets: 3, reps: "۱۰–۱۲", rest: "۶۰ ثانیه" },
    ],
  },
  {
    id: "legs-a",
    day: "چهارشنبه",
    title: "پایین‌تنه",
    focus: "چهارسر، همسترینگ و باسن",
    duration: "۷۰ دقیقه",
    calories: 460,
    exercises: [
      { id: "squat", name: "اسکوات", sets: 4, reps: "۶–۸", rest: "۱۲۰ ثانیه" },
      { id: "rdl", name: "ددلیفت رومانیایی", sets: 3, reps: "۸–۱۰", rest: "۹۰ ثانیه" },
      { id: "leg-press", name: "پرس پا", sets: 3, reps: "۱۰–۱۲", rest: "۹۰ ثانیه" },
      { id: "calf-raise", name: "ساق پا ایستاده", sets: 4, reps: "۱۲–۱۵", rest: "۶۰ ثانیه" },
    ],
  },
];

const foodCatalog: FoodLookupResult[] = [
  { foodName: "قورمه‌سبزی با چلو", serving: "۱ پرس", calories: 710, protein: 31, carbohydrates: 79, fat: 28, source: "IFKB demo" },
  { foodName: "چلوکباب کوبیده", serving: "۱ پرس", calories: 820, protein: 43, carbohydrates: 76, fat: 36, source: "IFKB demo" },
  { foodName: "جوجه‌کباب", serving: "۲۰۰ گرم", calories: 420, protein: 58, carbohydrates: 4, fat: 18, source: "IFKB demo" },
  { foodName: "عدسی", serving: "۱ کاسه", calories: 290, protein: 17, carbohydrates: 47, fat: 5, source: "IFKB demo" },
  { foodName: "تخم‌مرغ آب‌پز", serving: "۲ عدد", calories: 156, protein: 12, carbohydrates: 2, fat: 10, source: "IFKB demo" },
  { foodName: "ماست کم‌چرب", serving: "۱ لیوان", calories: 150, protein: 9, carbohydrates: 14, fat: 6, source: "IFKB demo" },
  { foodName: "موز", serving: "۱ عدد متوسط", calories: 105, protein: 1, carbohydrates: 27, fat: 0, source: "IFKB demo" },
];

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll("ي", "ی")
    .replaceAll("ك", "ک")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\s+/g, " ");
}

export function lookupLocalFood(query: string): FoodLookupResult | null {
  const normalized = normalize(query);
  if (!normalized) return null;
  return (
    foodCatalog.find((item) => normalize(item.foodName) === normalized) ||
    foodCatalog.find((item) => normalize(item.foodName).includes(normalized) || normalized.includes(normalize(item.foodName))) ||
    null
  );
}

export function suggestLocalMeal(meal: Meal): Meal {
  const alternatives = foodCatalog.filter((item) => Math.abs(item.calories - meal.calories) <= 180);
  const candidate = alternatives.find((item) => item.foodName !== meal.name) || alternatives[0] || foodCatalog[0];
  return {
    id: `${meal.id}-alternative`,
    type: meal.type,
    name: candidate.foodName,
    calories: candidate.calories,
    ingredients: ingredients([[candidate.foodName, candidate.serving, "جایگزین محلی"]]),
  };
}

export function buildLocalRecipe(meal: Meal): string {
  const ingredientText = meal.ingredients.map((item) => `${item.name} (${item.quantity})`).join("، ");
  return `مواد لازم: ${ingredientText}.\n\nروش آماده‌سازی: مواد را با روش خانگی کم‌روغن آماده کن، اندازهٔ سهم را مطابق برنامه نگه دار و نمک و روغن افزوده را محدود کن.`;
}

export function suggestLocalExercise(name: string): { alternativeExercise: string; reason: string } {
  const normalized = normalize(name);
  if (normalized.includes("اسکوات")) return { alternativeExercise: "پرس پا", reason: "الگوی حرکتی مشابه با کنترل ساده‌تر دامنه حرکت" };
  if (normalized.includes("پرس سینه")) return { alternativeExercise: "پرس سینه دمبل", reason: "آزادی حرکت بیشتر برای شانه‌ها" };
  if (normalized.includes("لت")) return { alternativeExercise: "قایقی سیم‌کش", reason: "گزینهٔ کششی کنترل‌شده برای عضلات پشت" };
  return { alternativeExercise: "نسخهٔ دستگاهی همان حرکت", reason: "ثبات بیشتر و اجرای ساده‌تر" };
}

export function getLocalExerciseDetails(name: string): ExerciseDetails {
  return {
    name,
    summary: "حرکت را با دامنهٔ کنترل‌شده، ستون فقرات خنثی و وزنه‌ای اجرا کن که فرم صحیح را حفظ کند.",
    instructions: [
      "وضعیت شروع را پایدار کن و عضلات مرکزی را درگیر نگه دار.",
      "بخش اصلی حرکت را بدون ضربه و با سرعت کنترل‌شده انجام بده.",
      "در نقطهٔ پایانی مکث کوتاه داشته باش و به‌آرامی به شروع برگرد.",
    ],
    formTips: ["دامنهٔ بدون درد را انتخاب کن.", "نفس را حبس نکن.", "وزنه را فدای فرم نکن."],
    commonMistakes: ["سرعت زیاد", "قفل‌کردن مفصل", "استفاده از دامنه‌ای که کنترل نمی‌شود"],
  };
}
