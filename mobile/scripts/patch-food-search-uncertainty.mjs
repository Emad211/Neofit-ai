import { readFileSync, writeFileSync } from 'node:fs';

const path = new URL('../app/food-search.tsx', import.meta.url);
let source = readFileSync(path, 'utf8');

function replaceOnce(before, after, label) {
  const occurrences = source.split(before).length - 1;
  if (occurrences !== 1) {
    throw new Error(`${label}: expected exactly one occurrence, found ${occurrences}`);
  }
  source = source.replace(before, after);
}

replaceOnce(
  `import {\n  calculateVariantNutrition,\n  type FoodConcept,`,
  `import {\n  calculateUniversalFoodEstimate,\n  calculateVariantNutrition,\n  type FoodConcept,`,
  'nutrition helper import',
);

replaceOnce(
  `function scaleVector(vector: NutritionVector, multiplier: number): NutritionVector {\n  return Object.fromEntries(\n    Object.entries(vector).map(([key, value]) => [key, value === undefined ? undefined : value * multiplier]),\n  ) as NutritionVector;\n}\n\nfunction universalVector(details: UniversalFoodDetails): NutritionVector {\n  return {\n    ...(details.caloriesKcal === null ? {} : { energyKcal: details.caloriesKcal }),\n    ...(details.proteinG === null ? {} : { proteinG: details.proteinG }),\n    ...(details.carbsG === null ? {} : { carbsG: details.carbsG }),\n    ...(details.fatG === null ? {} : { fatG: details.fatG }),\n    ...(details.fiberG === null ? {} : { fiberG: details.fiberG }),\n    ...(details.sugarsG === null ? {} : { sugarsG: details.sugarsG }),\n    ...(details.sodiumMg === null ? {} : { sodiumMg: details.sodiumMg }),\n    ...(details.cholesterolMg === null ? {} : { cholesterolMg: details.cholesterolMg }),\n    ...(details.calciumMg === null ? {} : { calciumMg: details.calciumMg }),\n    ...(details.ironMg === null ? {} : { ironMg: details.ironMg }),\n    ...(details.potassiumMg === null ? {} : { potassiumMg: details.potassiumMg }),\n    ...(details.vitaminCMg === null ? {} : { vitaminCMg: details.vitaminCMg }),\n  };\n}\n\n`,
  ``,
  'duplicate universal vector helpers',
);

replaceOnce(
  `      return {\n        grams: gramValue,\n        center: scaleVector(universalVector(selection.details), gramValue / 100),\n      };`,
  `      return calculateUniversalFoodEstimate(selection.details, gramValue);`,
  'generic estimate calculation',
);

replaceOnce(
  `              </View>\n              <AppText muted size={13}>{amountDescription}{estimate.grams === null ? \` · \${label('weight unknown', 'وزن نامشخص')}\` : ''}</AppText>`,
  `              </View>\n              {estimate.range ? (\n                <InlineNotice tone="warning">{label(\n                  \`Estimated range: \${Math.round(estimate.range.p10.energyKcal ?? 0)}–\${Math.round(estimate.range.p90.energyKcal ?? 0)} kcal.\`,\n                  \`بازهٔ تخمینی: \${Math.round(estimate.range.p10.energyKcal ?? 0)} تا \${Math.round(estimate.range.p90.energyKcal ?? 0)} کیلوکالری.\`,\n                )}</InlineNotice>\n              ) : null}\n              <AppText muted size={13}>{amountDescription}{estimate.grams === null ? \` · \${label('weight unknown', 'وزن نامشخص')}\` : ''}</AppText>`,
  'uncertainty display',
);

source = source.replace(`  type NutritionVector,\n`, '');
writeFileSync(path, source, 'utf8');
console.log('food-search uncertainty patch applied');
