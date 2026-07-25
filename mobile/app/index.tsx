import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { AppText, PrimaryButton } from '@/components/ui';
import { useApp } from '@/providers/app-provider';
import { useAppTheme } from '@/theme/theme';

export default function IndexRoute() {
  const { isReady, error, hasChosenLocale, profile, t, refreshAll } = useApp();
  const theme = useAppTheme();

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 18, backgroundColor: theme.colors.background }}>
        <AppText size={24} weight="800">{t('app.name')}</AppText>
        <AppText selectable style={{ color: theme.colors.danger }}>{error}</AppText>
        <PrimaryButton title={t('common.retry')} onPress={refreshAll} />
      </View>
    );
  }

  if (!hasChosenLocale) return <Redirect href="/language" />;
  if (!profile) return <Redirect href="/profile-setup" />;
  return <Redirect href="/(tabs)/today" />;
}
