import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { listAllNutritionDiaryEntries } from '@/db/nutrition-diary-repository';
import { listFavoriteFoods } from '@/db/nutrition-favorite-repository';
import { listNutritionGoals } from '@/db/nutrition-goal-repository';
import { listNutritionRecipes } from '@/db/nutrition-recipe-repository';
import {
  diaryEntriesToCsv,
  stringifyNutritionBackup,
  type DiaryEntry,
} from '@/nutrition-core';

function safeTimestamp(value: Date): string {
  return value.toISOString().replaceAll(':', '-').replaceAll('.', '-');
}

function writeCacheFile(name: string, content: string): File {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(content);
  if (!file.exists || file.size === null || file.size <= 0) {
    throw new Error('Export file could not be written.');
  }
  return file;
}

async function shareFile(
  file: File,
  input: { readonly mimeType: string; readonly dialogTitle: string; readonly UTI?: string },
): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('File sharing is unavailable on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: input.mimeType,
    dialogTitle: input.dialogTitle,
    ...(input.UTI === undefined ? {} : { UTI: input.UTI }),
  });
}

export async function shareNutritionBackupJson(): Promise<string> {
  const exportedAt = new Date();
  const [diaryEntries, recipes, goals, favorites] = await Promise.all([
    listAllNutritionDiaryEntries(50_000),
    listNutritionRecipes(10_000),
    listNutritionGoals(10_000),
    listFavoriteFoods(),
  ]);
  const file = writeCacheFile(
    `neofit-nutrition-backup-${safeTimestamp(exportedAt)}.json`,
    stringifyNutritionBackup({
      exportedAt: exportedAt.toISOString(),
      diaryEntries,
      recipes,
      goals,
      favorites,
    }),
  );
  await shareFile(file, {
    mimeType: 'application/json',
    dialogTitle: 'Share NeoFit nutrition backup',
    UTI: 'public.json',
  });
  return file.uri;
}

export async function shareNutritionDiaryCsv(
  entries: readonly DiaryEntry[],
  input: { readonly dateFrom: string; readonly dateTo: string },
): Promise<string> {
  const file = writeCacheFile(
    `neofit-nutrition-diary-${input.dateFrom}-to-${input.dateTo}.csv`,
    `\uFEFF${diaryEntriesToCsv(entries)}`,
  );
  await shareFile(file, {
    mimeType: 'text/csv',
    dialogTitle: 'Share NeoFit nutrition diary CSV',
    UTI: 'public.comma-separated-values-text',
  });
  return file.uri;
}
