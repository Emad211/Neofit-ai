import * as React from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Card, ChoiceGrid, InlineNotice, PageTitle, PrimaryButton, Screen } from '@/components/ui';
import { healthCheckDatabase } from '@/db/database';
import { countFoodCatalog, deleteImportedFoodCatalog } from '@/db/food-repository';
import { useApp } from '@/providers/app-provider';
import { exportLocalBackup, importLocalBackup } from '@/services/backup-service';
import {
  exportFoodCatalogFile,
  importFoodCatalogFile,
} from '@/services/food-catalog-file-service';

type BusyOperation =
  | 'export'
  | 'import'
  | 'reset'
  | 'health'
  | 'catalog-import'
  | 'catalog-export'
  | 'catalog-delete';

export default function SettingsScreen() {
  const {
    locale,
    profile,
    hasAvalAiKey,
    hasYouTubeKey,
    t,
    setLocale,
    refreshAll,
    deleteAllLocalData,
  } = useApp();
  const [foodCount, setFoodCount] = React.useState(0);
  const [busy, setBusy] = React.useState<BusyOperation | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const label = React.useCallback((en: string, fa: string) => locale === 'fa' ? fa : en, [locale]);

  React.useEffect(() => {
    void countFoodCatalog().then(setFoodCount).catch((caught) => console.error('Food catalog count failed:', caught));
  }, []);

  const run = async (
    kind: BusyOperation,
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
    setFoodCount(await countFoodCatalog());
    setNotice(label(
      `Backup restored from ${result.name}. Personal API keys were not changed.`,
      `فایل پشتیبان ${result.name} بازیابی شد. کلیدهای شخصی API تغییر نکردند.`,
    ));
  });

  const importCatalog = () => run('catalog-import', async () => {
    const result = await importFoodCatalogFile();
    if (!result.imported) return;
    const count = await countFoodCatalog();
    setFoodCount(count);
    setNotice(label(
      `${result.importedCount} validated foods were imported from ${result.name}. Previous imported datasets were replaced; built-in and custom foods were preserved.`,
      `${result.importedCount} غذای اعتبارسنجی‌شده از فایل ${result.name} وارد شد. دیتاست وارداتی قبلی جایگزین شد و غذاهای داخلی و سفارشی حفظ شدند.`,
    ));
  });

  const exportCatalog = () => run('catalog-export', async () => {
    const result = await exportFoodCatalogFile();
    setNotice(label(
      `${result.count} food entries were prepared as a validated NeoFit JSON catalog.`,
      `${result.count} قلم غذا به‌صورت فایل JSON اعتبارسنجی‌شده نئوفیت آماده شد.`,
    ));
  });

  const confirmDeleteImportedCatalog = () => {
    Alert.alert(
      label('Remove imported food dataset?', 'دیتاست غذایی وارداتی حذف شود؟'),
      label(
        'Built-in and personally added foods will remain.',
        'غذاهای داخلی و غذاهایی که خودتان اضافه کرده‌اید باقی می‌مانند.',
      ),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            void run('catalog-delete', async () => {
              const removed = await deleteImportedFoodCatalog();
              const count = await countFoodCatalog();
              setFoodCount(count);
              setNotice(label(
                `${removed} imported food entries were removed.`,
                `${removed} قلم غذای وارداتی حذف شد.`,
              ));
            });
          },
        },
      ],
    );
  };

  const checkDatabase = () => run('health', async () => {
    const healthy = await healthCheckDatabase();
    if (!healthy) throw new Error(label('The local database health check failed.', 'بررسی سلامت دیتابیس محلی ناموفق بود.'));
    const count = await countFoodCatalog();
    setFoodCount(count);
    setNotice(label(
      `The local SQLite database is healthy and contains ${count} food entries.`,
      `دیتابیس محلی SQLite سالم است و ${count} قلم غذا دارد.`,
    ));
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
          <AppText muted size={13}>{profile ? `${profile.weightKg} kg · ${profile.heightCm} cm · ${profile.trainingDays} ${label('training days', 'روز تمرین')} · ${profile.details.mealsPerDay} ${label('meals/day', 'وعده در روز')}` : t('common.notSet')}</AppText>
        </View>
        <PrimaryButton title={label('Edit rich profile', 'ویرایش پروفایل کامل')} variant="secondary" onPress={() => router.push('/profile-setup')} />
      </Card>

      <Card>
        <AppText size={20} weight="800">{label('AI and exercise-video services', 'هوش مصنوعی و ویدئوی آموزشی')}</AppText>
        <View style={{ gap: 8 }}>
          <AppText muted>{hasAvalAiKey
            ? label('AvalAI: personal key stored securely', 'AvalAI: کلید شخصی به‌صورت امن ذخیره شده')
            : label('AvalAI: not configured', 'AvalAI: تنظیم نشده')}</AppText>
          <AppText muted>{hasYouTubeKey
            ? label('YouTube tutorial agent: personal API key stored securely', 'ایجنت ویدئوی YouTube: کلید شخصی به‌صورت امن ذخیره شده')
            : label('YouTube tutorial agent: direct search only until configured', 'ایجنت ویدئوی YouTube: تا زمان تنظیم فقط جست‌وجوی مستقیم')}</AppText>
        </View>
        <PrimaryButton title={label('Configure AI and YouTube', 'تنظیم AvalAI و YouTube')} onPress={() => router.push('/ai-settings')} />
      </Card>

      <Card>
        <AppText size={20} weight="800">{label('Iranian food catalog', 'کاتالوگ غذاهای ایرانی')}</AppText>
        <AppText muted>{label(
          `${foodCount} local entries, including built-in, imported, and personally added foods.`,
          `${foodCount} قلم محلی، شامل غذاهای داخلی، وارداتی و سفارشی.`,
        )}</AppText>
        <InlineNotice>{label(
          'NeoFit catalog JSON files are schema-validated before import. Importing replaces only the previous imported dataset and preserves built-in and custom foods.',
          'فایل‌های JSON کاتالوگ نئوفیت پیش از ورود اعتبارسنجی ساختاری می‌شوند. ورود جدید فقط دیتاست وارداتی قبلی را جایگزین می‌کند و غذاهای داخلی و سفارشی را حفظ می‌کند.',
        )}</InlineNotice>
        <PrimaryButton title={label('Open and edit food catalog', 'بازکردن و ویرایش کاتالوگ غذا')} variant="secondary" onPress={() => router.push('/iranian-foods')} />
        <PrimaryButton title={label('Import licensed catalog JSON', 'ورود فایل JSON دیتاست دارای مجوز')} variant="secondary" onPress={importCatalog} loading={busy === 'catalog-import'} disabled={busy !== null && busy !== 'catalog-import'} />
        <PrimaryButton title={label('Export current catalog JSON', 'خروجی JSON کاتالوگ فعلی')} variant="ghost" onPress={exportCatalog} loading={busy === 'catalog-export'} disabled={busy !== null && busy !== 'catalog-export'} />
        <PrimaryButton title={label('Remove imported dataset', 'حذف دیتاست وارداتی')} variant="danger" onPress={confirmDeleteImportedCatalog} loading={busy === 'catalog-delete'} disabled={busy !== null && busy !== 'catalog-delete'} />
      </Card>

      <Card>
        <AppText size={20} weight="800">{label('Backup and restore', 'پشتیبان‌گیری و بازیابی')}</AppText>
        <AppText muted size={13}>{label(
          'The backup contains the local SQLite database, including custom foods and cached tutorial results. It does not include AvalAI or YouTube API keys.',
          'فایل پشتیبان شامل دیتابیس محلی SQLite، غذاهای سفارشی و نتیجه‌های کش‌شده ویدئو است؛ کلیدهای AvalAI و YouTube را شامل نمی‌شود.',
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
