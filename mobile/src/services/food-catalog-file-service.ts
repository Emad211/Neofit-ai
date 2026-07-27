import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { z } from 'zod';
import { FoodCatalogItemSchema } from '@/domain/models';
import {
  importFoodCatalogItems,
  listAllFoodCatalog,
  normalizeFoodSearch,
} from '@/db/food-repository';

const MAX_CATALOG_FILE_BYTES = 25 * 1024 * 1024;

export const FoodCatalogFileSchema = z.object({
  format: z.literal('neofit-food-catalog'),
  version: z.literal(1),
  sourceLabel: z.string().trim().min(2).max(300),
  exportedAt: z.string().datetime().optional(),
  foods: z.array(FoodCatalogItemSchema).min(1).max(10_000),
});
export type FoodCatalogFile = z.infer<typeof FoodCatalogFileSchema>;

function stableHash(value: string) {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(36);
}

function importedId(sourceLabel: string, originalId: string) {
  const sourcePart = stableHash(normalizeFoodSearch(sourceLabel)).slice(0, 10);
  const idPart = normalizeFoodSearch(originalId).replaceAll(' ', '-').slice(0, 90) || stableHash(originalId);
  return `imported-${sourcePart}-${idPart}`.slice(0, 120);
}

export async function importFoodCatalogFile() {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/json', 'text/plain'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (picked.canceled) return { imported: false as const };

  const asset = picked.assets[0];
  if (!asset) throw new Error('No catalog file was selected.');
  if (asset.size !== undefined && asset.size > MAX_CATALOG_FILE_BYTES) {
    throw new Error('Food catalog file is larger than the 25 MB limit.');
  }

  const file = new File(asset.uri);
  const text = await file.text();
  if (new TextEncoder().encode(text).byteLength > MAX_CATALOG_FILE_BYTES) {
    throw new Error('Food catalog file is larger than the 25 MB limit.');
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text) as unknown;
  } catch {
    throw new Error('Food catalog file is not valid JSON.');
  }

  const parsed = FoodCatalogFileSchema.safeParse(parsedJson);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`Food catalog validation failed at ${issue?.path.join('.') || 'root'}: ${issue?.message || 'invalid data'}`);
  }

  const ids = new Set<string>();
  const foods = parsed.data.foods.map((food) => {
    const id = importedId(parsed.data.sourceLabel, food.id);
    if (ids.has(id)) throw new Error(`Food catalog contains duplicate imported id: ${food.id}`);
    ids.add(id);
    return FoodCatalogItemSchema.parse({
      ...food,
      id,
      sourceType: 'imported',
      sourceLabel: parsed.data.sourceLabel,
      updatedAt: new Date().toISOString(),
    });
  });

  const importedCount = await importFoodCatalogItems({
    items: foods,
    sourceLabel: parsed.data.sourceLabel,
    replacePreviousImports: true,
  });

  return {
    imported: true as const,
    importedCount,
    sourceLabel: parsed.data.sourceLabel,
    name: asset.name,
  };
}

export async function exportFoodCatalogFile() {
  const foods = await listAllFoodCatalog();
  if (foods.length === 0) throw new Error('There are no food catalog entries to export.');

  const payload: FoodCatalogFile = FoodCatalogFileSchema.parse({
    format: 'neofit-food-catalog',
    version: 1,
    sourceLabel: 'NeoFit on-device food catalog export',
    exportedAt: new Date().toISOString(),
    foods,
  });
  const date = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `neofit-food-catalog-${date}.json`);
  file.create({ overwrite: true, intermediates: true });
  file.write(JSON.stringify(payload, null, 2));

  const sharingAvailable = await Sharing.isAvailableAsync();
  if (!sharingAvailable) throw new Error('File sharing is unavailable on this device.');
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export NeoFit food catalog',
    UTI: 'public.json',
  });

  return {
    count: foods.length,
    size: file.size,
    uri: file.uri,
  };
}
