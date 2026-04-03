import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/store/authStore';
import { CartProvider, useCart } from '@/store/cartStore';
import { RewardsProvider } from '@/store/rewardsStore';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppNavigator() {
  const colorScheme = useColorScheme();
  const { cartNotice } = useCart();
  const insets = useSafeAreaInsets();
  const statusBarStyle = colorScheme === 'dark' ? 'light' : 'dark';
  const statusBarBackground = colorScheme === 'dark' ? '#151718' : '#f6efe7';

  return (
    <View style={styles.appShell}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="cart" options={{ title: 'Cart' }} />
        <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
        <Stack.Screen name="order-confirmation" options={{ title: 'Order confirmed' }} />
        <Stack.Screen name="order-status" options={{ title: 'Order status' }} />
        <Stack.Screen name="reservations" options={{ title: 'Reservations' }} />
        <Stack.Screen name="feedback" options={{ title: 'Feedback' }} />
        <Stack.Screen name="locations" options={{ title: 'Store finder' }} />
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

      {cartNotice ? (
        <View pointerEvents="none" style={[styles.toastWrap, { bottom: Math.max(insets.bottom, 16) + 12 }]}>
          <View style={styles.toastCard}>
            <Text style={styles.toastLabel}>Cart updated</Text>
            <Text style={styles.toastText}>{cartNotice.message}</Text>
          </View>
        </View>
      ) : null}

      <StatusBar backgroundColor={statusBarBackground} style={statusBarStyle} translucent={false} />
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <CartProvider>
            <RewardsProvider>
              <AppNavigator />
            </RewardsProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
  },
  toastWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 50,
  },
  toastCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(95,106,26,0.18)',
    backgroundColor: 'rgba(255,251,242,0.98)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#423620',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  toastLabel: {
    color: '#5f6a1a',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  toastText: {
    color: '#202118',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 4,
  },
});
