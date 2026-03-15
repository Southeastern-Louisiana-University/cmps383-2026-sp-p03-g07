import { DarkTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { StorefrontPalette } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const storefrontTheme: Theme = {
    ...DarkTheme,
    dark: true,
    colors: {
      ...DarkTheme.colors,
      primary: StorefrontPalette.accent,
      background: StorefrontPalette.background,
      card: StorefrontPalette.panelMuted,
      text: StorefrontPalette.text,
      border: StorefrontPalette.border,
      notification: StorefrontPalette.accentLight,
    },
  };

  return (
    <ThemeProvider value={storefrontTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: StorefrontPalette.background,
          },
        }}
      />
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
