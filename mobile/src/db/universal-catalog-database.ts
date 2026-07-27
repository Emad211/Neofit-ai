import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { IFKB_CATALOG_RELEASE } from '@/nutrition-core/catalog-release';

const CATALOG_ASSET_MODULE = require('../../assets/ifkb/ifkb-universal-v1.db') as number;

let catalogPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openBundledCatalog(): Promise<SQLite.SQLiteDatabase> {
  const asset = Asset.fromModule(CATALOG_ASSET_MODULE);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  if (!uri) throw new Error('Bundled IFKB catalog asset is unavailable.');
  const bytes = await new File(uri).bytes();
  if (bytes.byteLength !== IFKB_CATALOG_RELEASE.databaseBytes) {
    throw new Error(`Bundled IFKB catalog size mismatch: ${bytes.byteLength} bytes.`);
  }
  const database = await SQLite.deserializeDatabaseAsync(bytes);
  await database.execAsync('PRAGMA foreign_keys=ON; PRAGMA query_only=ON;');
  const rows = await database.getAllAsync<{ key: string; value: string }>(
    `SELECT key,value FROM meta WHERE key IN (
       'version','genericFoodCount','genericVariantMappingCount','iranianCanonCount'
     );`,
  );
  const meta = new Map(rows.map((row) => [row.key, row.value]));
  if (meta.get('version') !== IFKB_CATALOG_RELEASE.version) {
    throw new Error(`Unsupported IFKB catalog version: ${meta.get('version') ?? 'missing'}`);
  }
  if (Number(meta.get('genericFoodCount')) !== IFKB_CATALOG_RELEASE.genericFoodCount) {
    throw new Error('Bundled IFKB generic-food count failed validation.');
  }
  if (Number(meta.get('genericVariantMappingCount')) !== IFKB_CATALOG_RELEASE.genericVariantMappingCount) {
    throw new Error('Bundled IFKB generic Concept/Variant mapping failed validation.');
  }
  if (Number(meta.get('iranianCanonCount')) !== IFKB_CATALOG_RELEASE.iranianCanonCount) {
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
