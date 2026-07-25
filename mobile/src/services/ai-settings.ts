import { z } from 'zod';
import { getSetting, setSetting } from '@/db/settings-repository';

export const AvalAiSettingsSchema = z.object({
  endpointMode: z.enum(['auto', 'iran-primary', 'iran-secondary', 'international']),
  textModel: z.string().trim().min(1).max(120),
  visionModel: z.string().trim().min(1).max(120),
  timeoutMs: z.number().int().min(10_000).max(180_000),
});
export type AvalAiSettings = z.infer<typeof AvalAiSettingsSchema>;

export const defaultAvalAiSettings: AvalAiSettings = {
  endpointMode: 'auto',
  textModel: 'gpt-5.4-mini',
  visionModel: 'gpt-5.4-mini',
  timeoutMs: 60_000,
};

const SETTINGS_KEY = 'avalai.settings';

export async function getAvalAiSettings() {
  return getSetting(SETTINGS_KEY, AvalAiSettingsSchema, defaultAvalAiSettings);
}

export async function saveAvalAiSettings(input: AvalAiSettings) {
  const settings = AvalAiSettingsSchema.parse(input);
  await setSetting(SETTINGS_KEY, settings);
  return settings;
}

export function resolveAvalAiOrigins(mode: AvalAiSettings['endpointMode']) {
  const iranPrimary = 'https://api.avalai.ir';
  const iranSecondary = 'https://api.avalapis.ir';
  const international = 'https://api.avalai.org';

  switch (mode) {
    case 'iran-primary':
      return [iranPrimary, iranSecondary, international];
    case 'iran-secondary':
      return [iranSecondary, iranPrimary, international];
    case 'international':
      return [international, iranPrimary, iranSecondary];
    case 'auto':
      return [international, iranPrimary, iranSecondary];
  }
}
