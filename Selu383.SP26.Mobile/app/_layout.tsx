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
              <Stack.Screen name="order-confirmation" options={{ title: 'Order confirmed' }} />
              <Stack.Screen name="order-status" options={{ title: 'Order status' }} />
              <Stack.Screen name="reservations" options={{ title: 'Reservations' }} />
              <Stack.Screen name="feedback" options={{ title: 'Feedback' }} />
              <Stack.Screen name="locations" options={{ title: 'Store finder' }} />
              <Stack.Screen name="gift-card" options={{ title: 'Gift cards' }} />
              <Stack.Screen name="favorites" options={{ title: 'Favorites' }} />
              <Stack.Screen name="receipt" options={{ title: 'Receipt' }} />
              <Stack.Screen name="drive-thru" options={{ title: 'Drive-thru' }} />
              <Stack.Screen name="Auth/login" options={{ title: 'Login' }} />
              <Stack.Screen name="Auth/signup" options={{ title: 'Register' }} />
              <Stack.Screen name="admin/login" options={{ title: 'Admin login' }} />
              <Stack.Screen name="admin/dashboard" options={{ title: 'Admin dashboard' }} />
              <Stack.Screen name="admin/orders" options={{ title: 'Manage orders' }} />
              <Stack.Screen name="admin/reservations" options={{ title: 'Manage reservations' }} />
              <Stack.Screen name="admin/menu-management" options={{ title: 'Menu management' }} />
              <Stack.Screen name="admin/tables" options={{ title: 'Tables' }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="auto" />
          </RewardsProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
