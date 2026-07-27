import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

const CATALOG_ASSET_MODULE = require('../../assets/ifkb/ifkb-universal-v1.db') as number;
const EXPECTED_CATALOG_VERSION = '1.1.0';
const EXPECTED_GENERIC_FOODS = 13_225;
const EXPECTED_IRANIAN_CANON = 261;

let catalogPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openBundledCatalog(): Promise<SQLite.SQLiteDatabase> {
  const asset = Asset.fromModule(CATALOG_ASSET_MODULE);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  if (!uri) throw new Error('Bundled IFKB catalog asset is unavailable.');
  const bytes = await new File(uri).bytes();
  if (bytes.byteLength < 1024 * 1024) throw new Error('Bundled IFKB catalog is unexpectedly small.');
  const database = await SQLite.deserializeDatabaseAsync(bytes);
  await database.execAsync('PRAGMA foreign_keys=ON; PRAGMA query_only=ON;');
  const rows = await database.getAllAsync<{ key: string; value: string }>(
    `SELECT key,value FROM meta WHERE key IN ('version','genericFoodCount','iranianCanonCount');`,
  );
  const meta = new Map(rows.map((row) => [row.key, row.value]));
  if (meta.get('version') !== EXPECTED_CATALOG_VERSION) {
    throw new Error(`Unsupported IFKB catalog version: ${meta.get('version') ?? 'missing'}`);
  }
  if (Number(meta.get('genericFoodCount')) !== EXPECTED_GENERIC_FOODS) {
    throw new Error('Bundled IFKB generic-food count failed validation.');
  }
  if (Number(meta.get('iranianCanonCount')) !== EXPECTED_IRANIAN_CANON) {
    throw new Error('Bundled IFKB Iranian-canon count failed validation.');
  }
  return database;
}

export async function getUniversalCatalogDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!catalogPromise) {
    catalogPromise = openBundledCatalog().catch((error) => {
      catalogPromise = null;
      throw error;
    });
  }
  return catalogPromise;
}

export async function closeUniversalCatalogDatabase(): Promise<void> {
  if (!catalogPromise) return;
  const database = await catalogPromise;
  catalogPromise = null;
  await database.closeAsync();
}
