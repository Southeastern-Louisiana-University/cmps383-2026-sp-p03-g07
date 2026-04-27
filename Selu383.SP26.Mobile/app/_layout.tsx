import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/store/authStore';
import { CartProvider, useCart } from '@/store/cartStore';
import { RewardsProvider } from '@/store/rewardsStore';

export const unstable_settings = {
  anchor: '(tabs)',
};

function CartNoticeToast() {
  const { notice, dismissNotice } = useCart();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!notice) return;

    const timeoutId = setTimeout(() => {
      dismissNotice();
    }, 2200);

    return () => clearTimeout(timeoutId);
  }, [dismissNotice, notice?.id]);

  if (!notice) return null;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View style={[styles.toast, { bottom: insets.bottom + 12 }]}>
        <Text style={styles.toastText}>{notice.message}</Text>
        <Pressable
          style={styles.toastAction}
          onPress={() => {
            dismissNotice();
            router.push('/cart');
          }}>
          <Text style={styles.toastActionText}>View</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const statusBarStyle = colorScheme === 'dark' ? 'light' : 'dark';
  const statusBarBackground = colorScheme === 'dark' ? '#151718' : '#f6efe7';

  return (
    <SafeAreaProvider>
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
                <Stack.Screen name="reservations" options={{ title: 'Reserve a table' }} />
                <Stack.Screen name="feedback" options={{ title: 'Feedback' }} />
                <Stack.Screen name="locations" options={{ title: 'Store finder' }} />
                <Stack.Screen name="favorites" options={{ title: 'Favorites' }} />
                <Stack.Screen name="receipt" options={{ title: 'Receipt' }} />
	                <Stack.Screen name="drive-thru" options={{ title: 'Drive-thru' }} />
	                <Stack.Screen name="Auth/login" options={{ title: 'Login' }} />
	                <Stack.Screen name="Auth/signup" options={{ title: 'Register' }} />
	                <Stack.Screen name="Auth/reset" options={{ title: 'Reset password' }} />
	                <Stack.Screen name="admin/login" options={{ title: 'Admin login' }} />
	                <Stack.Screen name="admin/dashboard" options={{ title: 'Admin dashboard' }} />
	                <Stack.Screen name="admin/orders" options={{ title: 'Manage orders' }} />
	                <Stack.Screen name="admin/reservations" options={{ title: 'Manage reservations' }} />
                <Stack.Screen name="admin/menu-management" options={{ title: 'Menu management' }} />
                <Stack.Screen name="admin/tables" options={{ title: 'Tables' }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
              <CartNoticeToast />
              <StatusBar backgroundColor={statusBarBackground} style={statusBarStyle} translucent={false} />
            </RewardsProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#1d2d3c',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  toastText: { flex: 1, color: '#fffaf4', fontWeight: '700' },
  toastAction: {
    borderRadius: 999,
    backgroundColor: '#f2c57d',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toastActionText: { color: '#40261a', fontWeight: '800' },
});
