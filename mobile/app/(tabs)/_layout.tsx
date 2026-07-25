import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useApp } from '@/providers/app-provider';
import { useAppTheme } from '@/theme/theme';

const icons = {
  today: '◉',
  nutrition: '◒',
  workout: '◆',
  progress: '↗',
  settings: '⚙',
} as const;

export default function TabsLayout() {
  const { t } = useApp();
  const theme = useAppTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color }) => (
          <Text style={{ color, fontSize: 22, fontWeight: '800' }}>
            {icons[route.name as keyof typeof icons] || '•'}
          </Text>
        ),
      })}
    >
      <Tabs.Screen name="today" options={{ title: t('tabs.today') }} />
      <Tabs.Screen name="nutrition" options={{ title: t('tabs.nutrition') }} />
      <Tabs.Screen name="workout" options={{ title: t('tabs.workout') }} />
      <Tabs.Screen name="progress" options={{ title: t('tabs.progress') }} />
      <Tabs.Screen name="settings" options={{ title: t('tabs.settings') }} />
    </Tabs>
  );
}
