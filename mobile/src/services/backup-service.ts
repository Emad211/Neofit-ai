import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  createDatabaseBackupBytes,
  restoreDatabaseBackupBytes,
} from '@/db/database';

function backupFileName(date = new Date()) {
  const stamp = date.toISOString().replace(/[:.]/g, '-');
  return `neofit-backup-${stamp}.db`;
}

export async function exportLocalBackup() {
  const bytes = await createDatabaseBackupBytes();
  const file = new File(Paths.cache, backupFileName());
  if (file.exists) file.delete();
  file.write(bytes);

  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('File sharing is unavailable on this device.');

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/vnd.sqlite3',
    dialogTitle: 'NeoFit local backup',
    UTI: 'public.database',
  });

  return { uri: file.uri, size: bytes.byteLength };
}

export async function importLocalBackup() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/vnd.sqlite3', 'application/x-sqlite3', 'application/octet-stream', '*/*'],
    multiple: false,
    copyToCacheDirectory: true,
  });

  if (result.canceled) return { imported: false as const };
  const asset = result.assets[0];
  if (!asset?.uri) throw new Error('The selected backup could not be read.');
  if (asset.size && asset.size > 250 * 1024 * 1024) {
    throw new Error('The selected backup is larger than the supported limit.');
  }

  const file = new File(asset.uri);
  const bytes = await file.bytes();
  await restoreDatabaseBackupBytes(bytes);
  return { imported: true as const, name: asset.name, size: bytes.byteLength };
}
