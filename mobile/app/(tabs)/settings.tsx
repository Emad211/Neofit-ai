import * as React from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Card, ChoiceGrid, InlineNotice, PageTitle, PrimaryButton, Screen } from '@/components/ui';
import { healthCheckDatabase } from '@/db/database';
import { useApp } from '@/providers/app-provider';
import { exportLocalBackup, importLocalBackup } from '@/services/backup-service';

export default function SettingsScreen() {
  const {
    locale,
    profile,
    hasAvalAiKey,
    t,
    setLocale,
    refreshAll,
    deleteAllLocalData,
  } = useApp();
  const [busy, setBusy] = React.useState<'export' | 'import' | 'reset' | 'health' | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const label = (en: string, fa: string) => locale === 'fa' ? fa : en;

  const run = async (
    kind: NonNullable<typeof busy>,
    operation: () => Promise<void>,
  ) => {
    setBusy(kind);
    setNotice(null);
    setError(null);
    try {
      await operation();
    } catch (caught) {
      console.error(`${kind} operation failed:`, caught);
      setError(caught instanceof Error ? caught.message : label('Operation failed.', 'عملیات انجام نشد.'));
    } finally {
      setBusy(null);
    }
  };

  const exportBackup = () => run('export', async () => {
    const result = await exportLocalBackup();
    setNotice(label(
      `Backup prepared (${Math.max(1, Math.round(result.size / 1024))} KB). Choose a private and trusted location to save it.`,
      `فایل پشتیبان آماده شد (${Math.max(1, Math.round(result.size / 1024))} کیلوبایت). آن را فقط در محل خصوصی و مطمئن ذخیره کنید.`,
    ));
  });

  const importBackup = () => run('import', async () => {
    const result = await importLocalBackup();
    if (!result.imported) return;
    await refreshAll();
    setNotice(label(
      `Backup restored from ${result.name}. The AvalAI key was not changed.`,
      `فایل پشتیبان ${result.name} بازیابی شد. کلید AvalAI تغییر نکرد.`,
    ));
  });

  const checkDatabase = () => run('health', async () => {
    const healthy = await healthCheckDatabase();
    if (!healthy) throw new Error(label('The local database health check failed.', 'بررسی سلامت دیتابیس محلی ناموفق بود.'));
    setNotice(label('The local SQLite database is healthy.', 'دیتابیس محلی SQLite سالم است.'));
  });

  const confirmReset = () => {
    Alert.alert(
      t('settings.reset'),
      t('settings.resetWarning'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            void run('reset', async () => {
              await deleteAllLocalData();
              router.replace('/language');
            });
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <PageTitle title={t('settings.title')} subtitle={t('settings.localDataDescription')} />

      {notice ? <InlineNotice tone="success">{notice}</InlineNotice> : null}
      {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}

      <Card>
        <AppText size={20} weight="800">{t('settings.language')}</AppText>
        <ChoiceGrid
          value={locale}
          onChange={(value) => void setLocale(value)}
          options={[
            { value: 'fa', label: 'فارسی' },
            { value: 'en', label: 'English' },
          ]}
        />
      </Card>

      <Card>
        <AppText size={20} weight="800">{label('Personal profile', 'پروفایل شخصی')}</AppText>
        <View style={{ gap: 4 }}>
          <AppText weight="700">{profile?.name || t('common.notSet')}</AppText>
          <AppText muted size={13}>{profile ? `${profile.weightKg} kg · ${profile.heightCm} cm · ${profile.trainingDays} ${label('training days', 'روز تمرین')}` : t('common.notSet')}</AppText>
        </View>
        <PrimaryButton title={label('Edit profile', 'ویرایش پروفایل')} variant="secondary" onPress={() => router.push('/profile-setup')} />
      </Card>

      <Card>
        <AppText size={20} weight="800">{t('settings.avalai')}</AppText>
        <AppText muted>{hasAvalAiKey ? label('A personal key is stored in SecureStore.', 'کلید شخصی در SecureStore ذخیره شده است.') : t('ai.missingKey')}</AppText>
        <PrimaryButton title={t('settings.avalai')} onPress={() => router.push('/ai-settings')} />
      </Card>

      <Card>
        <AppText size={20} weight="800">{label('Backup and restore', 'پشتیبان‌گیری و بازیابی')}</AppText>
        <AppText muted size={13}>{label(
          'The backup contains the local SQLite database. It does not include the AvalAI API key.',
          'فایل پشتیبان شامل دیتابیس محلی SQLite است و کلید AvalAI را شامل نمی‌شود.',
        )}</AppText>
        <InlineNotice tone="warning">{label(
          'The exported database file is not encrypted. Anyone who obtains the file may be able to read profile, health, nutrition, and workout data. Store it only in a private location.',
          'فایل دیتابیس خروجی رمزگذاری نشده است. هر کسی که به فایل دسترسی پیدا کند ممکن است اطلاعات پروفایل، سلامت، تغذیه و تمرین را بخواند. آن را فقط در محل خصوصی نگه دارید.',
        )}</InlineNotice>
        <PrimaryButton title={label('Export backup', 'خروجی فایل پشتیبان')} variant="secondary" onPress={exportBackup} loading={busy === 'export'} disabled={busy !== null && busy !== 'export'} />
        <PrimaryButton title={label('Import backup', 'بازیابی از فایل')} variant="secondary" onPress={importBackup} loading={busy === 'import'} disabled={busy !== null && busy !== 'import'} />
        <PrimaryButton title={label('Check database health', 'بررسی سلامت دیتابیس')} variant="ghost" onPress={checkDatabase} loading={busy === 'health'} disabled={busy !== null && busy !== 'health'} />
      </Card>

      <Card>
        <AppText size={20} weight="800" style={{ color: '#DC2626' }}>{t('settings.reset')}</AppText>
        <AppText muted>{t('settings.resetWarning')}</AppText>
        <PrimaryButton title={t('settings.reset')} variant="danger" onPress={confirmReset} loading={busy === 'reset'} disabled={busy !== null && busy !== 'reset'} />
      </Card>
    </Screen>
  );
}
