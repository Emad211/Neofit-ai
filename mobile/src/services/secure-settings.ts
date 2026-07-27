import * as SecureStore from 'expo-secure-store';
import { createId } from '@/lib/id';

const AVALAI_API_KEY = 'neofit.avalai.api-key';
const YOUTUBE_API_KEY = 'neofit.youtube.api-key';
const INSTALLATION_ID = 'neofit.installation-id';
const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function isSecureStorageAvailable() {
  return SecureStore.isAvailableAsync();
}

async function requireSecureStorage() {
  const available = await isSecureStorageAvailable();
  if (!available) throw new Error('Secure storage is unavailable on this device.');
}

export async function getAvalAiApiKey() {
  await requireSecureStorage();
  return SecureStore.getItemAsync(AVALAI_API_KEY, SECURE_OPTIONS);
}

export async function setAvalAiApiKey(apiKey: string) {
  const normalized = apiKey.trim();
  if (normalized.length < 10 || normalized.length > 500) {
    throw new Error('AvalAI API key format is invalid.');
  }

  await requireSecureStorage();
  await SecureStore.setItemAsync(AVALAI_API_KEY, normalized, SECURE_OPTIONS);
}

export async function deleteAvalAiApiKey() {
  const available = await isSecureStorageAvailable();
  if (!available) return;
  await SecureStore.deleteItemAsync(AVALAI_API_KEY, SECURE_OPTIONS);
}

export async function getYouTubeApiKey() {
  await requireSecureStorage();
  return SecureStore.getItemAsync(YOUTUBE_API_KEY, SECURE_OPTIONS);
}

export async function setYouTubeApiKey(apiKey: string) {
  const normalized = apiKey.trim();
  if (normalized.length < 20 || normalized.length > 300 || /\s/.test(normalized)) {
    throw new Error('YouTube Data API key format is invalid.');
  }

  await requireSecureStorage();
  await SecureStore.setItemAsync(YOUTUBE_API_KEY, normalized, SECURE_OPTIONS);
}

export async function deleteYouTubeApiKey() {
  const available = await isSecureStorageAvailable();
  if (!available) return;
  await SecureStore.deleteItemAsync(YOUTUBE_API_KEY, SECURE_OPTIONS);
}

export async function getOrCreateInstallationId() {
  await requireSecureStorage();
  const existing = await SecureStore.getItemAsync(INSTALLATION_ID, SECURE_OPTIONS);
  if (existing) return existing;
  const installationId = createId('install');
  await SecureStore.setItemAsync(INSTALLATION_ID, installationId, SECURE_OPTIONS);
  return installationId;
}

export async function deletePersonalSecrets() {
  const available = await isSecureStorageAvailable();
  if (!available) return;
  await Promise.all([
    SecureStore.deleteItemAsync(AVALAI_API_KEY, SECURE_OPTIONS),
    SecureStore.deleteItemAsync(YOUTUBE_API_KEY, SECURE_OPTIONS),
    SecureStore.deleteItemAsync(INSTALLATION_ID, SECURE_OPTIONS),
  ]);
}
