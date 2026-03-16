import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { orderService } from '@/services/orderService';
import type { Order } from '@/types/app';

export default function OrderConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    void orderService.getOrder(Number(id)).then(setOrder).catch(() => setError('Could not load order.'));
  }, [id]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.checkmark}>Order placed!</Text>
        <Text style={styles.heroSub}>
          Your order has been received. We will start preparing it shortly.
        </Text>
      </View>

      {error ? (
        <View style={styles.card}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : order ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order #{order.id}</Text>
          <Text style={styles.cardCopy}>
            {order.orderType} - {order.status}
          </Text>
          {order.items.map((item) => (
            <Text key={item.id} style={styles.cardCopy}>
              {item.quantity}x {item.itemName}
            </Text>
          ))}
          <Text style={styles.totalText}>Total: ${order.total.toFixed(2)}</Text>
          <Text style={styles.starsText}>+{order.starsEarned} stars earned</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardCopy}>Loading order details...</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <Pressable style={styles.primaryButton} onPress={() => router.push(`/order-status?id=${id}`)}>
          <Text style={styles.primaryButtonText}>Track order</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.replace('/(tabs)/menu')}>
          <Text style={styles.secondaryButtonText}>Back to menu</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6efe7' },
  content: { gap: 14, padding: 20, paddingBottom: 40 },
  heroCard: {
    borderRadius: 28,
    backgroundColor: '#40261a',
    padding: 28,
    gap: 10,
    alignItems: 'center',
  },
  checkmark: { fontSize: 26, fontWeight: '700', color: '#f2c57d' },
  heroSub: { color: '#eadcd1', textAlign: 'center' },
  card: { gap: 8, borderRadius: 22, backgroundColor: '#fffaf4', padding: 16 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  cardCopy: { color: '#6c5b4d' },
  totalText: { fontWeight: '700', color: '#1f1a17', marginTop: 4 },
  starsText: { color: '#8a5124', fontWeight: '700' },
  buttonRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  primaryButton: {
    borderRadius: 999,
    backgroundColor: '#1d2d3c',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryButtonText: { color: '#fffaf4', fontWeight: '700' },
  secondaryButton: {
    borderRadius: 999,
    backgroundColor: '#fffaf4',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  secondaryButtonText: { color: '#1d2d3c', fontWeight: '700' },
  errorText: { color: '#b33030' },
});
