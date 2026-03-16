import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { locationService } from '@/services/locationService';
import { menuService } from '@/services/menuService';
import { useAuth } from '@/store/authStore';
import { useCart } from '@/store/cartStore';
import { useRewards } from '@/store/rewardsStore';
import type { Location, MenuItem } from '@/types/app';

export default function HomeScreen() {
  const { user } = useAuth();
  const { items } = useCart();
  const { balance } = useRewards();
  const [locations, setLocations] = useState<Location[]>([]);
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    void Promise.all([locationService.getLocations(), menuService.getMenu()]).then(
      ([nextLocations, nextMenu]) => {
        setLocations(nextLocations.slice(0, 2));
        setFeaturedItems(nextMenu.filter((item) => item.isFeatured).slice(0, 2));
      },
    );
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Mobile quick order</Text>
        <Text style={styles.heroTitle}>Coffee ready before you park.</Text>
        <Text style={styles.heroCopy}>
          Jump from featured drinks to checkout, then watch your order move through pickup.
        </Text>
        <View style={styles.row}>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/(tabs)/menu')}>
            <Text style={styles.primaryButtonText}>Browse menu</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => router.push('/cart')}>
            <Text style={styles.secondaryButtonText}>Cart {items.length}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Stars</Text>
          <Text style={styles.metricValue}>{balance?.points ?? 0}</Text>
          <Text style={styles.metricCopy}>{balance?.currentTier ?? 'Sign in'} tier</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Profile</Text>
          <Text style={styles.metricValue}>{user?.userName ?? 'Guest'}</Text>
          <Text style={styles.metricCopy}>{user ? 'Signed in' : 'Tap profile to login'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured</Text>
        {featuredItems.map((item) => (
          <View key={item.id} style={styles.listCard}>
            <View>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardCopy}>{item.description}</Text>
            </View>
            <Text style={styles.priceText}>${item.price.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nearby stores</Text>
        {locations.map((location) => (
          <Pressable key={location.id} style={styles.listCard} onPress={() => router.push('/locations')}>
            <View>
              <Text style={styles.cardTitle}>{location.name}</Text>
              <Text style={styles.cardCopy}>{location.address}</Text>
            </View>
            <Text style={styles.cardBadge}>Map</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6efe7',
  },
  content: {
    gap: 16,
    padding: 20,
    paddingBottom: 40,
  },
  heroCard: {
    gap: 12,
    borderRadius: 28,
    padding: 20,
    backgroundColor: '#1d2d3c',
  },
  eyebrow: {
    color: '#f2c57d',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#fff7ef',
    fontSize: 30,
    fontWeight: '700',
  },
  heroCopy: {
    color: '#d4dce3',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    borderRadius: 999,
    backgroundColor: '#f0b45b',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#2c1908',
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 999,
    backgroundColor: '#314656',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#fff7ef',
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    gap: 6,
    borderRadius: 24,
    backgroundColor: '#fffaf4',
    padding: 16,
  },
  metricLabel: {
    color: '#7f6b59',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: '#1f1a17',
    fontSize: 22,
    fontWeight: '700',
  },
  metricCopy: {
    color: '#6c5b4d',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#1f1a17',
    fontSize: 20,
    fontWeight: '700',
  },
  listCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 22,
    backgroundColor: '#fffaf4',
    padding: 16,
  },
  cardTitle: {
    color: '#1f1a17',
    fontSize: 16,
    fontWeight: '700',
  },
  cardCopy: {
    color: '#6c5b4d',
    marginTop: 4,
    maxWidth: 240,
  },
  priceText: {
    color: '#8a5124',
    fontWeight: '700',
  },
  cardBadge: {
    color: '#8a5124',
    fontWeight: '700',
  },
});
