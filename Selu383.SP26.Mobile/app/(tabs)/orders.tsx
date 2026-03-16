import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { orderService } from '@/services/orderService';
import { useAuth } from '@/store/authStore';
import type { Order } from '@/types/app';

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [reordering, setReordering] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    void orderService.getOrders().then(setOrders).catch(() => setOrders([]));
  }, [user]);

  if (!user) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Order tracking</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in to see your orders</Text>
          <Text style={styles.cardCopy}>
            Log in to view your order history and track active orders.
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/Auth/login')}>
            <Text style={styles.primaryButtonText}>Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  async function handleReorder(orderId: number) {
    setReordering(orderId);
    try {
      const newOrder = await orderService.reorder(orderId);
      router.push(`/order-confirmation?id=${newOrder.id}`);
    } catch {
      // ignore
    } finally {
      setReordering(null);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Order tracking</Text>
      {orders.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No orders yet</Text>
          <Text style={styles.cardCopy}>Place an order from the menu to start tracking it here.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/(tabs)/menu')}>
            <Text style={styles.primaryButtonText}>Browse menu</Text>
          </Pressable>
        </View>
      ) : (
        orders.map((order) => (
          <View key={order.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Order #{order.id}</Text>
              <Text style={[styles.statusBadge,
                order.status.toLowerCase() === 'completed' && styles.statusCompleted,
                order.status.toLowerCase() === 'cancelled' && styles.statusCancelled,
                order.status.toLowerCase() === 'preparing' && styles.statusPreparing,
              ]}>
                {order.status}
              </Text>
            </View>
            <Text style={styles.cardCopy}>
              {order.orderType} • {new Date(order.createdAt).toLocaleDateString()}
            </Text>
            <Text style={styles.cardCopy}>
              {order.items.map((item) => `${item.quantity}x ${item.itemName}`).join(', ')}
            </Text>
            <Text style={styles.metaText}>
              ${order.total.toFixed(2)} • {order.paymentStatus}
            </Text>
            {order.starsEarned > 0 && (
              <Text style={styles.starsText}>+{order.starsEarned} stars earned</Text>
            )}
            <View style={styles.buttonRow}>
              {['received', 'preparing', 'ready'].includes(order.status.toLowerCase()) && (
                <Pressable
                  style={styles.trackButton}
                  onPress={() => router.push(`/order-status?id=${order.id}`)}>
                  <Text style={styles.trackButtonText}>Track order</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.reorderButton, reordering === order.id && styles.buttonDisabled]}
                onPress={() => handleReorder(order.id)}
                disabled={reordering === order.id}>
                <Text style={styles.reorderButtonText}>
                  {reordering === order.id ? 'Reordering...' : 'Reorder'}
                </Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6efe7' },
  content: { gap: 14, padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#1f1a17' },
  card: {
    gap: 8,
    borderRadius: 22,
    backgroundColor: '#fffaf4',
    padding: 16,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  cardCopy: { color: '#6c5b4d' },
  metaText: { color: '#8a5124', fontWeight: '700' },
  starsText: { color: '#6b4f0e', fontSize: 13 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#e0d6cc',
    fontSize: 12,
    fontWeight: '700',
    color: '#6c5b4d',
  },
  statusCompleted: { backgroundColor: '#c8e6c9', color: '#1a6b2a' },
  statusCancelled: { backgroundColor: '#ffcdd2', color: '#b33030' },
  statusPreparing: { backgroundColor: '#fff3cd', color: '#856404' },
  buttonRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  trackButton: {
    borderRadius: 999,
    backgroundColor: '#1d2d3c',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  trackButtonText: { color: '#fffaf4', fontWeight: '600', fontSize: 13 },
  reorderButton: {
    borderRadius: 999,
    backgroundColor: '#f6efe7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1d2d3c',
  },
  reorderButtonText: { color: '#1d2d3c', fontWeight: '600', fontSize: 13 },
  buttonDisabled: { opacity: 0.6 },
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#1d2d3c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 4,
  },
  primaryButtonText: { color: '#fffaf4', fontWeight: '700' },
});
