import * as React from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider, useApp } from '@/providers/app-provider';
import { useAppTheme } from '@/theme/theme';

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isReady, direction } = useApp();
  const theme = useAppTheme();

  React.useEffect(() => {
    if (isReady) void SplashScreen.hideAsync();
  }, [isReady]);

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        contentStyle: {
          backgroundColor: theme.colors.background,
          direction,
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="language" options={{ headerShown: false }} />
      <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="ai-settings" options={{ title: direction === 'rtl' ? 'تنظیمات AvalAI' : 'AvalAI settings' }} />
      <Stack.Screen name="meal-estimator" options={{ title: direction === 'rtl' ? 'تخمین غذا' : 'Food estimate', presentation: 'modal' }} />
      <Stack.Screen name="workout-player/[id]" options={{ headerShown: false, gestureEnabled: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
