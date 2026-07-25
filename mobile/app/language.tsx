import { View } from 'react-native';
import { router } from 'expo-router';
import { AppText, Card, PrimaryButton, Screen } from '@/components/ui';
import { useApp } from '@/providers/app-provider';

export default function LanguageScreen() {
  const { setLocale } = useApp();

  const choose = async (locale: 'fa' | 'en') => {
    await setLocale(locale);
    router.replace('/profile-setup');
  };

  return (
    <Screen gap={28}>
      <View style={{ paddingTop: 56, gap: 12 }}>
        <AppText size={38} weight="800">NeoFit AI</AppText>
        <AppText muted size={17}>Personal fitness data stays on this phone.</AppText>
        <AppText muted size={17}>اطلاعات شخصی تمرین فقط روی همین گوشی می‌ماند.</AppText>
      </View>

      <Card>
        <AppText size={24} weight="800">Choose your language</AppText>
        <AppText muted>زبان خود را انتخاب کنید</AppText>
        <View style={{ gap: 12, paddingTop: 6 }}>
          <PrimaryButton title="فارسی" onPress={() => choose('fa')} />
          <PrimaryButton title="English" variant="secondary" onPress={() => choose('en')} />
        </View>
      </Card>

      <AppText muted size={13}>
        SQLite database, settings, plans, and logs are stored locally. Only the AI requests you explicitly make are sent to AvalAI.
      </AppText>
    </Screen>
  );
}
