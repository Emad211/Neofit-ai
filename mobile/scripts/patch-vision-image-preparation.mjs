import { readFileSync, writeFileSync } from 'node:fs';

const path = new URL('../app/meal-estimator.tsx', import.meta.url);
let source = readFileSync(path, 'utf8');

function replaceOnce(before, after, label) {
  const occurrences = source.split(before).length - 1;
  if (occurrences !== 1) {
    throw new Error(`${label}: expected exactly one occurrence, found ${occurrences}`);
  }
  source = source.replace(before, after);
}

replaceOnce(
  `import { View } from 'react-native';`,
  `import { Alert, View } from 'react-native';`,
  'Alert import',
);

replaceOnce(
  `import { recognizeFoodFromPhoto, type VisionFoodCandidate } from '@/services/vision-food-recognition';`,
  `import { prepareVisionImage } from '@/services/vision-image-preparation';\nimport { recognizeFoodFromPhoto, type VisionFoodCandidate } from '@/services/vision-food-recognition';`,
  'Vision preparation import',
);

replaceOnce(
  `function parseNonNegative(value: string, label: string) {\n  const number = Number(value);\n  if (!Number.isFinite(number) || number < 0) throw new Error(\`${'${label}'} is invalid.\`);\n  return number;\n}\n`,
  `function parseNonNegative(value: string, label: string) {\n  const number = Number(value);\n  if (!Number.isFinite(number) || number < 0) throw new Error(\`${'${label}'} is invalid.\`);\n  return number;\n}\n\nfunction confirmVisionUpload(input: {\n  readonly title: string;\n  readonly message: string;\n  readonly cancel: string;\n  readonly send: string;\n}): Promise<boolean> {\n  return new Promise((resolve) => {\n    Alert.alert(input.title, input.message, [\n      { text: input.cancel, style: 'cancel', onPress: () => resolve(false) },\n      { text: input.send, onPress: () => resolve(true) },\n    ], { cancelable: true, onDismiss: () => resolve(false) });\n  });\n}\n`,
  'consent helper',
);

replaceOnce(
  `      const pickerResult = source === 'camera'\n        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], base64: true, quality: 0.5, allowsEditing: false })\n        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.5, allowsEditing: false });\n\n      if (pickerResult.canceled) return;\n      const asset = pickerResult.assets[0];\n      if (!asset?.base64) throw new Error(label('The selected image could not be read.', 'تصویر انتخاب‌شده قابل خواندن نبود.'));\n      const mime = asset.mimeType || 'image/jpeg';\n      const observation = await recognizeFoodFromPhoto({\n        imageDataUrl: \`data:${'${mime}'};base64,${'${asset.base64}'}\`,\n        description,\n        locale,\n      });`,
  `      const pickerResult = source === 'camera'\n        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], base64: false, quality: 0.9, allowsEditing: false })\n        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: false, quality: 0.9, allowsEditing: false });\n\n      if (pickerResult.canceled) return;\n      const asset = pickerResult.assets[0];\n      if (!asset?.uri || !asset.width || !asset.height) {\n        throw new Error(label('The selected image could not be read.', 'تصویر انتخاب‌شده قابل خواندن نبود.'));\n      }\n      const consented = await confirmVisionUpload({\n        title: label('Send prepared photo?', 'ارسال نسخهٔ آماده‌شدهٔ تصویر؟'),\n        message: label(\n          'NeoFit will resize and compress this photo on your phone, then send only that JPEG to the configured Vision API for food identification. The API is not used to calculate nutrition.',\n          'NeoFit تصویر را روی گوشی کوچک و فشرده می‌کند و فقط همان JPEG را برای شناسایی غذا به API بینایی تنظیم‌شده می‌فرستد. محاسبهٔ تغذیه توسط API انجام نمی‌شود.',\n        ),\n        cancel: label('Cancel', 'انصراف'),\n        send: label('Prepare and send', 'آماده‌سازی و ارسال'),\n      });\n      if (!consented) return;\n      const prepared = await prepareVisionImage({\n        uri: asset.uri,\n        width: asset.width,\n        height: asset.height,\n      });\n      const observation = await recognizeFoodFromPhoto({\n        imageDataUrl: prepared.imageDataUrl,\n        description,\n        locale,\n      });`,
  'photo picker and upload preparation',
);

replaceOnce(
  `        label(\n          \`Vision API candidate: ${'${best.candidate.query}'}. Nutrition was calculated locally, not by the API.\`,\n          \`کاندید API بینایی: ${'${best.candidate.query}'}. مقدارهای تغذیه‌ای در گوشی محاسبه شدند، نه توسط API.\`,\n        ),`,
  `        label(\n          \`Vision API candidate: ${'${best.candidate.query}'}. Nutrition was calculated locally, not by the API.\`,\n          \`کاندید API بینایی: ${'${best.candidate.query}'}. مقدارهای تغذیه‌ای در گوشی محاسبه شدند، نه توسط API.\`,\n        ),\n        label(\n          \`Prepared JPEG: ${'${prepared.width}'}×${'${prepared.height}'} px, ${'${Math.round(prepared.byteLength / 1_000)}'} KB.\`,\n          \`JPEG آماده‌شده: ${'${prepared.width}'}×${'${prepared.height}'} پیکسل، ${'${Math.round(prepared.byteLength / 1_000)}'} کیلوبایت.\`,\n        ),`,
  'prepared image audit assumption',
);

writeFileSync(path, source, 'utf8');
console.log('Vision image preparation patch applied');
