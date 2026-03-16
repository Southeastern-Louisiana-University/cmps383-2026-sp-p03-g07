import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { orderService } from '@/services/orderService';
import { useAuth } from '@/store/authStore';
import type { Order } from '@/types/app';

const STATUS_OPTIONS = ['Received', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

export default function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    void loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await orderService.getOrders();
      setOrders(data);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: number, status: string) {
    setUpdating(orderId);
    try {
      await orderService.updateStatus(orderId, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
    } catch {
      // ignore
    } finally {
      setUpdating(null);
    }
  }

  if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Manager'))) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Manage orders</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Access denied</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Go back</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter((o) => o.status.toLowerCase() === filterStatus.toLowerCase());

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Manage orders</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterRow}>
          {['all', ...STATUS_OPTIONS].map((status) => (
            <Pressable
              key={status}
              style={[styles.filterPill, filterStatus === status && styles.filterPillActive]}
              onPress={() => setFilterStatus(status)}>
              <Text style={[styles.filterPillText, filterStatus === status && styles.filterPillTextActive]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {loading ? (
        <View style={styles.card}>
          <Text style={styles.cardCopy}>Loading orders...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardCopy}>No orders found.</Text>
        </View>
      ) : (
        filteredOrders.map((order) => (
          <View key={order.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Order #{order.id}</Text>
              <Text style={[styles.statusBadge,
                order.status.toLowerCase() === 'completed' && styles.statusCompleted,
                order.status.toLowerCase() === 'cancelled' && styles.statusCancelled,
                order.status.toLowerCase() === 'preparing' && styles.statusPreparing,
                order.status.toLowerCase() === 'ready' && styles.statusReady,
              ]}>
                {order.status}
              </Text>
            </View>
            <Text style={styles.cardCopy}>
              {order.orderType} • ${order.total.toFixed(2)}
            </Text>
            <Text style={styles.cardCopy}>
              {order.items.map((item) => `${item.quantity}x ${item.itemName}`).join(', ')}
            </Text>
            <Text style={styles.dateText}>{new Date(order.createdAt).toLocaleString()}</Text>

            <Text style={styles.actionLabel}>Update status:</Text>
            <View style={styles.actionRow}>
              {STATUS_OPTIONS.filter((s) => s.toLowerCase() !== order.status.toLowerCase()).map((status) => (
                <Pressable
                  key={status}
                  style={[styles.actionButton, updating === order.id && styles.actionButtonDisabled]}
                  onPress={() => updateStatus(order.id, status)}
                  disabled={updating === order.id}>
                  <Text style={styles.actionButtonText}>{status}</Text>
                </Pressable>
              ))}
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
  card: { gap: 8, borderRadius: 22, backgroundColor: '#fffaf4', padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  cardCopy: { color: '#6c5b4d' },
  dateText: { fontSize: 12, color: '#8f7d70' },
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterPill: {
    borderRadius: 999,
    backgroundColor: '#fffaf4',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterPillActive: { backgroundColor: '#1d2d3c' },
  filterPillText: { fontWeight: '600', color: '#1f1a17', fontSize: 13 },
  filterPillTextActive: { color: '#fffaf4' },
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
  statusReady: { backgroundColor: '#dce8ff', color: '#1a3f6b' },
  actionLabel: { fontSize: 13, color: '#6c5b4d', fontWeight: '600', marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  actionButton: {
    borderRadius: 999,
    backgroundColor: '#f6efe7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#1d2d3c',
  },
  actionButtonDisabled: { opacity: 0.4 },
  actionButtonText: { color: '#1d2d3c', fontWeight: '600', fontSize: 12 },
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
