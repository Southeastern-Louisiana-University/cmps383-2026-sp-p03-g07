import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/store/authStore';

export default function ProfileScreen() {
  const { logout, user } = useAuth();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>{user?.userName ?? 'Guest'}</Text>
        <Text style={styles.copy}>
          {user ? `${user.points} stars • ${user.roles.join(', ')}` : 'Sign in for saved orders and payment methods.'}
        </Text>
      </View>

      <Pressable style={styles.actionCard} onPress={() => router.push('/locations')}>
        <Text style={styles.actionTitle}>Store finder</Text>
        <Text style={styles.copy}>Map, hours, and directions</Text>
      </Pressable>

      <Pressable style={styles.actionCard} onPress={() => router.push('/gift-card')}>
        <Text style={styles.actionTitle}>Gift cards</Text>
        <Text style={styles.copy}>Buy, redeem, and check balance</Text>
      </Pressable>

      <Pressable
        style={styles.actionCard}
        onPress={() => router.push(user ? '/cart' : '/Auth/login')}>
        <Text style={styles.actionTitle}>{user ? 'Go to cart' : 'Login or register'}</Text>
        <Text style={styles.copy}>Use cookie auth and continue your session</Text>
      </Pressable>

      {user ? (
        <Pressable style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6efe7' },
  content: { gap: 14, padding: 20, paddingBottom: 40 },
  card: {
    gap: 8,
    borderRadius: 28,
    backgroundColor: '#1d2d3c',
    padding: 20,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#fffaf4' },
  copy: { color: '#6c5b4d' },
  actionCard: {
    gap: 6,
    borderRadius: 22,
    backgroundColor: '#fffaf4',
    padding: 16,
  },
  actionTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  logoutButton: {
    borderRadius: 999,
    backgroundColor: '#40261a',
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  logoutButtonText: { color: '#fffaf4', fontWeight: '700' },
});
