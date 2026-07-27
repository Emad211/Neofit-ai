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
  deleteYouTubeApiKey,
  getAvalAiApiKey,
  getYouTubeApiKey,
  setAvalAiApiKey,
  setYouTubeApiKey,
} from '@/services/secure-settings';
import { testYouTubeConnection } from '@/services/youtube-video-agent';
import { useApp } from '@/providers/app-provider';

export default function AiSettingsScreen() {
  const { locale, t, refreshApiKeyState } = useApp();
  const [apiKey, setApiKey] = React.useState('');
  const [youTubeKey, setYouTubeKey] = React.useState('');
  const [hasStoredKey, setHasStoredKey] = React.useState(false);
  const [hasStoredYouTubeKey, setHasStoredYouTubeKey] = React.useState(false);
  const [settings, setSettings] = React.useState<AvalAiSettings | null>(null);
  const [busy, setBusy] = React.useState<'save' | 'test' | 'delete' | 'youtube-save' | 'youtube-test' | 'youtube-delete' | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const label = (en: string, fa: string) => locale === 'fa' ? fa : en;

  React.useEffect(() => {
    const load = async () => {
      const [storedSettings, storedKey, storedYouTubeKey] = await Promise.all([
        getAvalAiSettings(),
        getAvalAiApiKey(),
        getYouTubeApiKey(),
      ]);
      setSettings(storedSettings);
      setHasStoredKey(Boolean(storedKey));
      setHasStoredYouTubeKey(Boolean(storedYouTubeKey));
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
        `AvalAI connection succeeded through ${result.origin}. Remaining credit: ${balance}.`,
        `اتصال AvalAI از مسیر ${result.origin} موفق بود. اعتبار باقی‌مانده: ${balance}.`,
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
      setNotice(label('The AvalAI API key was removed from SecureStore.', 'کلید AvalAI از SecureStore حذف شد.'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Removing the key failed.', 'حذف کلید انجام نشد.'));
    } finally {
      setBusy(null);
    }
  };

  const saveYouTube = async (shouldTest: boolean) => {
    const kind = shouldTest ? 'youtube-test' : 'youtube-save';
    setBusy(kind);
    setError(null);
    setNotice(null);
    try {
      if (youTubeKey.trim()) await setYouTubeApiKey(youTubeKey);
      if (!youTubeKey.trim() && !hasStoredYouTubeKey) {
        throw new Error(label('Enter a YouTube Data API v3 key first.', 'ابتدا یک کلید YouTube Data API v3 وارد کنید.'));
      }
      if (shouldTest) {
        const result = await testYouTubeConnection();
        setNotice(label(
          `YouTube search is working. Test results: ${result.resultCount}.`,
          `جست‌وجوی YouTube فعال است. تعداد نتیجه تست: ${result.resultCount}.`,
        ));
      } else {
        setNotice(label('The YouTube API key was saved securely on this phone.', 'کلید YouTube به‌صورت امن روی همین گوشی ذخیره شد.'));
      }
      setYouTubeKey('');
      setHasStoredYouTubeKey(true);
      await refreshApiKeyState();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('YouTube setup failed.', 'تنظیم YouTube انجام نشد.'));
    } finally {
      setBusy(null);
    }
  };

  const removeYouTubeKey = async () => {
    setBusy('youtube-delete');
    setError(null);
    setNotice(null);
    try {
      await deleteYouTubeApiKey();
      setHasStoredYouTubeKey(false);
      setYouTubeKey('');
      await refreshApiKeyState();
      setNotice(label('The YouTube API key was removed. Cached tutorial results remain local.', 'کلید YouTube حذف شد؛ نتیجه‌های آموزشی کش‌شده روی گوشی باقی می‌مانند.'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : label('Removing the YouTube key failed.', 'حذف کلید YouTube انجام نشد.'));
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
        'This personal build sends only requests you explicitly trigger. API keys are stored in the device Keystore/Keychain, never in SQLite or backups.',
        'این نسخه شخصی فقط درخواست‌هایی را می‌فرستد که خودتان اجرا می‌کنید. کلیدها در Keystore/Keychain گوشی ذخیره می‌شوند و وارد SQLite یا فایل پشتیبان نمی‌شوند.',
      )}</InlineNotice>

      <Card>
        <AppText size={21} weight="800">AvalAI</AppText>
        <AppText muted size={13}>{hasStoredKey ? label('A personal key is stored securely. Enter a new key only to replace it.', 'یک کلید شخصی به‌صورت امن ذخیره شده است. فقط برای جایگزینی، کلید جدید وارد کنید.') : t('ai.missingKey')}</AppText>
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
        <AppText size={20} weight="800">{label('AvalAI models', 'مدل‌های AvalAI')}</AppText>
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
        <PrimaryButton title={t('settings.testConnection')} onPress={test} loading={busy === 'test'} disabled={busy !== null && busy !== 'test'} />
        <PrimaryButton title={t('common.save')} variant="secondary" onPress={save} loading={busy === 'save'} disabled={busy !== null && busy !== 'save'} />
        {hasStoredKey ? <PrimaryButton title={label('Remove AvalAI key', 'حذف کلید AvalAI')} variant="danger" onPress={removeKey} loading={busy === 'delete'} disabled={busy !== null && busy !== 'delete'} /> : null}
      </Card>

      <Card>
        <AppText size={21} weight="800">YouTube exercise tutorials</AppText>
        <AppText muted size={13}>{label(
          'A personal YouTube Data API v3 key lets the on-device agent search only public, embeddable tutorial videos. Search results are cached locally to reduce quota use.',
          'کلید شخصی YouTube Data API v3 به ایجنت داخل گوشی اجازه می‌دهد فقط ویدئوهای عمومی و قابل‌نمایش آموزشی را جست‌وجو کند. نتیجه‌ها برای کاهش مصرف سهمیه روی گوشی کش می‌شوند.',
        )}</AppText>
        <Field
          label={label('YouTube Data API key', 'کلید YouTube Data API')}
          value={youTubeKey}
          onChangeText={setYouTubeKey}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={hasStoredYouTubeKey ? '••••••••••••••••' : 'AIza...'}
        />
        <InlineNotice tone="warning">{label(
          'Use a separate Google Cloud key with YouTube Data API v3 enabled and restrict it to this Android app when possible. Each new search consumes YouTube quota; cached results do not.',
          'یک کلید جدا در Google Cloud بسازید، YouTube Data API v3 را فعال کنید و در صورت امکان آن را به همین اپ Android محدود کنید. هر جست‌وجوی جدید سهمیه مصرف می‌کند؛ کش محلی سهمیه مصرف نمی‌کند.',
        )}</InlineNotice>
        <PrimaryButton title={label('Test YouTube search', 'تست جست‌وجوی YouTube')} onPress={() => saveYouTube(true)} loading={busy === 'youtube-test'} disabled={busy !== null && busy !== 'youtube-test'} />
        <PrimaryButton title={label('Save YouTube key', 'ذخیره کلید YouTube')} variant="secondary" onPress={() => saveYouTube(false)} loading={busy === 'youtube-save'} disabled={busy !== null && busy !== 'youtube-save'} />
        {hasStoredYouTubeKey ? <PrimaryButton title={label('Remove YouTube key', 'حذف کلید YouTube')} variant="danger" onPress={removeYouTubeKey} loading={busy === 'youtube-delete'} disabled={busy !== null && busy !== 'youtube-delete'} /> : null}
      </Card>

      {notice ? <InlineNotice tone="success">{notice}</InlineNotice> : null}
      {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}

      <View style={{ gap: 10 }}>
        <PrimaryButton title={t('common.back')} variant="ghost" onPress={() => router.back()} disabled={busy !== null} />
      </View>
    </Screen>
  );
}
