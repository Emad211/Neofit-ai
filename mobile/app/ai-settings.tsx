import * as React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Card, ChoiceGrid, Field, InlineNotice, PrimaryButton, Screen } from '@/components/ui';
import {
  AvalAiSettings,
  getAvalAiSettings,
  saveAvalAiSettings,
} from '@/services/ai-settings';
import { testAvalAiConnection } from '@/services/avalai-client';
import {
  deleteAvalAiApiKey,
  getAvalAiApiKey,
  setAvalAiApiKey,
} from '@/services/secure-settings';
import { useApp } from '@/providers/app-provider';

export default function AiSettingsScreen() {
  const { locale, t, refreshApiKeyState } = useApp();
  const [apiKey, setApiKey] = React.useState('');
  const [hasStoredKey, setHasStoredKey] = React.useState(false);
  const [settings, setSettings] = React.useState<AvalAiSettings | null>(null);
  const [busy, setBusy] = React.useState<'save' | 'test' | 'delete' | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const label = (en: string, fa: string) => locale === 'fa' ? fa : en;

  React.useEffect(() => {
    const load = async () => {
      const [storedSettings, storedKey] = await Promise.all([
        getAvalAiSettings(),
        getAvalAiApiKey(),
      ]);
      setSettings(storedSettings);
      setHasStoredKey(Boolean(storedKey));
    };
    void load();
  }, []);

  const save = async () => {
    if (!settings) return;
    setBusy('save');
    setError(null);
    setNotice(null);
    try {
      if (apiKey.trim()) {
        await setAvalAiApiKey(apiKey);
        setApiKey('');
        setHasStoredKey(true);
      }
      await saveAvalAiSettings(settings);
      await refreshApiKeyState();
      setNotice(label('AvalAI settings were saved on this phone.', 'تنظیمات AvalAI روی همین گوشی ذخیره شد.'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Saving failed.', 'ذخیره انجام نشد.'));
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    if (!settings) return;
    setBusy('test');
    setError(null);
    setNotice(null);
    try {
      if (apiKey.trim()) await setAvalAiApiKey(apiKey);
      await saveAvalAiSettings(settings);
      const result = await testAvalAiConnection();
      setApiKey('');
      setHasStoredKey(true);
      await refreshApiKeyState();
      const balance = result.credit.remaining_irt !== undefined
        ? `${Math.round(result.credit.remaining_irt).toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US')} IRT`
        : result.credit.remaining_unit !== undefined
          ? String(result.credit.remaining_unit)
          : label('available', 'در دسترس');
      setNotice(label(
        `Connection succeeded through ${result.origin}. Remaining credit: ${balance}.`,
        `اتصال از مسیر ${result.origin} موفق بود. اعتبار باقی‌مانده: ${balance}.`,
      ));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('ai.networkError'));
    } finally {
      setBusy(null);
    }
  };

  const removeKey = async () => {
    setBusy('delete');
    setError(null);
    setNotice(null);
    try {
      await deleteAvalAiApiKey();
      setHasStoredKey(false);
      setApiKey('');
      await refreshApiKeyState();
      setNotice(label('The API key was removed from SecureStore.', 'کلید API از SecureStore حذف شد.'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Removing the key failed.', 'حذف کلید انجام نشد.'));
    } finally {
      setBusy(null);
    }
  };

  if (!settings) {
    return <Screen><AppText>{t('common.loading')}</AppText></Screen>;
  }

  return (
    <Screen>
      <InlineNotice>{label(
        'This personal build sends only the AI requests you trigger to AvalAI. The API key is stored in the device Keystore/Keychain, not SQLite.',
        'این نسخه شخصی فقط درخواست‌هایی را که خودتان اجرا می‌کنید به AvalAI می‌فرستد. کلید API در Keystore/Keychain گوشی ذخیره می‌شود، نه SQLite.',
      )}</InlineNotice>

      <Card>
        <AppText size={20} weight="800">{t('settings.apiKey')}</AppText>
        <AppText muted size={13}>{hasStoredKey ? label('A key is stored securely. Enter a new key only to replace it.', 'یک کلید به‌صورت امن ذخیره شده است. فقط برای جایگزینی، کلید جدید وارد کنید.') : t('ai.missingKey')}</AppText>
        <Field
          label={t('settings.apiKey')}
          value={apiKey}
          onChangeText={setApiKey}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={hasStoredKey ? '••••••••••••••••' : 'aa-...'}
        />
      </Card>

      <Card>
        <AppText size={20} weight="800">{label('Models', 'مدل‌ها')}</AppText>
        <Field
          label={t('settings.textModel')}
          value={settings.textModel}
          onChangeText={(textModel) => setSettings((current) => current ? { ...current, textModel } : current)}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Field
          label={t('settings.visionModel')}
          value={settings.visionModel}
          onChangeText={(visionModel) => setSettings((current) => current ? { ...current, visionModel } : current)}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Card>

      <Card>
        <AppText size={20} weight="800">{t('settings.endpoint')}</AppText>
        <ChoiceGrid
          value={settings.endpointMode}
          onChange={(endpointMode) => setSettings((current) => current ? { ...current, endpointMode } : current)}
          options={[
            { value: 'auto', label: t('settings.endpointAuto') },
            { value: 'international', label: t('settings.endpointInternational') },
            { value: 'iran-primary', label: t('settings.endpointIran') },
            { value: 'iran-secondary', label: t('settings.endpointIranSecondary') },
          ]}
          columns={1}
        />
        <Field
          label={label('Timeout (milliseconds)', 'مهلت اتصال (میلی‌ثانیه)')}
          value={String(settings.timeoutMs)}
          onChangeText={(value) => {
            const timeoutMs = Number(value);
            if (Number.isFinite(timeoutMs)) setSettings((current) => current ? { ...current, timeoutMs } : current);
          }}
          keyboardType="number-pad"
        />
      </Card>

      {notice ? <InlineNotice tone="success">{notice}</InlineNotice> : null}
      {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}

      <View style={{ gap: 10 }}>
        <PrimaryButton title={t('settings.testConnection')} onPress={test} loading={busy === 'test'} disabled={busy !== null && busy !== 'test'} />
        <PrimaryButton title={t('common.save')} variant="secondary" onPress={save} loading={busy === 'save'} disabled={busy !== null && busy !== 'save'} />
        {hasStoredKey ? <PrimaryButton title={t('settings.removeKey')} variant="danger" onPress={removeKey} loading={busy === 'delete'} disabled={busy !== null && busy !== 'delete'} /> : null}
        <PrimaryButton title={t('common.back')} variant="ghost" onPress={() => router.back()} disabled={busy !== null} />
      </View>
    </Screen>
  );
}
