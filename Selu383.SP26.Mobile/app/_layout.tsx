import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/store/authStore';
import { CartProvider } from '@/store/cartStore';
import { RewardsProvider } from '@/store/rewardsStore';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <CartProvider>
          <RewardsProvider>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="cart" options={{ title: 'Cart' }} />
              <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
              <Stack.Screen name="locations" options={{ title: 'Store finder' }} />
              <Stack.Screen name="gift-card" options={{ title: 'Gift cards' }} />
              <Stack.Screen name="Auth/login" options={{ title: 'Login' }} />
              <Stack.Screen name="Auth/signup" options={{ title: 'Register' }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="auto" />
          </RewardsProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
