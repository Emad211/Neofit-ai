import * as SecureStore from 'expo-secure-store';

const AVALAI_API_KEY = 'neofit.avalai.api-key';
const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function isSecureStorageAvailable() {
  return SecureStore.isAvailableAsync();
}

export async function getAvalAiApiKey() {
  const available = await isSecureStorageAvailable();
  if (!available) throw new Error('Secure storage is unavailable on this device.');
  return SecureStore.getItemAsync(AVALAI_API_KEY, SECURE_OPTIONS);
}

export async function setAvalAiApiKey(apiKey: string) {
  const normalized = apiKey.trim();
  if (normalized.length < 10 || normalized.length > 500) {
    throw new Error('AvalAI API key format is invalid.');
  }

  const available = await isSecureStorageAvailable();
  if (!available) throw new Error('Secure storage is unavailable on this device.');
  await SecureStore.setItemAsync(AVALAI_API_KEY, normalized, SECURE_OPTIONS);
}

export async function deleteAvalAiApiKey() {
  const available = await isSecureStorageAvailable();
  if (!available) return;
  await SecureStore.deleteItemAsync(AVALAI_API_KEY, SECURE_OPTIONS);
}
