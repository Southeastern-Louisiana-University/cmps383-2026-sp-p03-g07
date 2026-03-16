import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { orderService } from '@/services/orderService';
import type { Order } from '@/types/app';

const STATUS_STEPS = ['Received', 'Preparing', 'Ready', 'Completed'];

function StatusBar({ status }: { status: string }) {
  const currentIndex = STATUS_STEPS.findIndex(
    (s) => s.toLowerCase() === status.toLowerCase(),
  );
  return (
    <View style={statusStyles.track}>
      {STATUS_STEPS.map((step, index) => (
        <View key={step} style={statusStyles.stepWrapper}>
          <View style={[statusStyles.dot, index <= currentIndex && statusStyles.dotActive]} />
          <Text style={[statusStyles.stepLabel, index <= currentIndex && statusStyles.stepLabelActive]}>
            {step}
          </Text>
        </View>
      ))}
    </View>
  );
}

const statusStyles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  stepWrapper: { alignItems: 'center', flex: 1, gap: 4 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#e0d6cc',
  },
  dotActive: { backgroundColor: '#40261a' },
  stepLabel: { fontSize: 11, color: '#8f7d70', textAlign: 'center' },
  stepLabelActive: { color: '#40261a', fontWeight: '700' },
});

export default function OrderStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadOrder() {
    if (!id) return;
    try {
      const data = await orderService.getOrder(Number(id));
      setOrder(data);
      if (data.status.toLowerCase() === 'completed' || data.status.toLowerCase() === 'cancelled') {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    } catch {
      setError('Could not load order status.');
    }
  }

  useEffect(() => {
    void loadOrder();
    intervalRef.current = setInterval(() => { void loadOrder(); }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [id]);

  if (error) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Order status</Text>
        <View style={styles.card}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Go back</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Order status</Text>

      {order ? (
        <>
          <View style={styles.heroCard}>
            <Text style={styles.heroStatus}>{order.status}</Text>
            <Text style={styles.heroSub}>Order #{order.id} - {order.orderType}</Text>
            <StatusBar status={order.status} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Items</Text>
            {order.items.map((item) => (
              <Text key={item.id} style={styles.cardCopy}>
                {item.quantity}x {item.itemName}
              </Text>
            ))}
            <Text style={styles.totalText}>Total: ${order.total.toFixed(2)}</Text>
          </View>

          <Text style={styles.refreshNote}>Refreshes automatically every 5 seconds</Text>

          <Pressable style={styles.primaryButton} onPress={() => router.replace('/(tabs)/orders')}>
            <Text style={styles.primaryButtonText}>View all orders</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardCopy}>Loading order status...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6efe7' },
  content: { gap: 14, padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#1f1a17' },
  heroCard: {
    borderRadius: 28,
    backgroundColor: '#40261a',
    padding: 20,
    gap: 6,
  },
  heroStatus: { fontSize: 28, fontWeight: '700', color: '#f2c57d' },
  heroSub: { color: '#eadcd1' },
  card: { gap: 8, borderRadius: 22, backgroundColor: '#fffaf4', padding: 16 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  cardCopy: { color: '#6c5b4d' },
  totalText: { fontWeight: '700', color: '#1f1a17', marginTop: 4 },
  refreshNote: { fontSize: 12, color: '#8f7d70', textAlign: 'center' },
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#1d2d3c',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryButtonText: { color: '#fffaf4', fontWeight: '700' },
  errorText: { color: '#b33030' },
});
