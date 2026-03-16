import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { orderService } from '@/services/orderService';
import { reservationService } from '@/services/reservationService';
import { useAuth } from '@/store/authStore';
import type { Order, Reservation } from '@/types/app';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [o, r] = await Promise.allSettled([
          orderService.getOrders(),
          reservationService.getReservations(),
        ]);
        if (o.status === 'fulfilled') setOrders(o.value);
        if (r.status === 'fulfilled') setReservations(r.value);
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Manager'))) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Admin dashboard</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Access denied</Text>
          <Text style={styles.cardCopy}>You need admin or manager privileges to view this page.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Go back</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const activeOrders = orders.filter((o) =>
    ['received', 'preparing', 'ready'].includes(o.status.toLowerCase()),
  );
  const totalRevenue = orders
    .filter((o) => o.status.toLowerCase() === 'completed')
    .reduce((sum, o) => sum + o.total, 0);
  const pendingReservations = reservations.filter((r) =>
    r.status.toLowerCase() === 'pending' || r.status.toLowerCase() === 'confirmed',
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Admin dashboard</Text>

      {loading ? (
        <View style={styles.card}>
          <Text style={styles.cardCopy}>Loading stats...</Text>
        </View>
      ) : (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{orders.length}</Text>
              <Text style={styles.statLabel}>Total orders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{activeOrders.length}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>${totalRevenue.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{reservations.length}</Text>
              <Text style={styles.statLabel}>Reservations</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{pendingReservations.length}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>

          {activeOrders.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Active orders</Text>
              {activeOrders.slice(0, 5).map((order) => (
                <View key={order.id} style={styles.orderRow}>
                  <Text style={styles.orderText}>#{order.id} - {order.orderType}</Text>
                  <Text style={[styles.statusBadge,
                    order.status.toLowerCase() === 'preparing' && styles.statusPreparing,
                    order.status.toLowerCase() === 'ready' && styles.statusReady,
                  ]}>
                    {order.status}
                  </Text>
                </View>
              ))}
              {activeOrders.length > 5 && (
                <Text style={styles.moreText}>+{activeOrders.length - 5} more</Text>
              )}
            </View>
          )}
        </>
      )}

      <View style={styles.navSection}>
        <Text style={styles.navTitle}>Manage</Text>
        <Pressable style={styles.navCard} onPress={() => router.push('/admin/orders')}>
          <Text style={styles.navCardTitle}>Orders</Text>
          <Text style={styles.navCardCopy}>View and update all orders</Text>
        </Pressable>
        <Pressable style={styles.navCard} onPress={() => router.push('/admin/reservations')}>
          <Text style={styles.navCardTitle}>Reservations</Text>
          <Text style={styles.navCardCopy}>View and manage reservations</Text>
        </Pressable>
        <Pressable style={styles.navCard} onPress={() => router.push('/admin/menu-management')}>
          <Text style={styles.navCardTitle}>Menu</Text>
          <Text style={styles.navCardCopy}>Add, edit, and remove menu items</Text>
        </Pressable>
        <Pressable style={styles.navCard} onPress={() => router.push('/admin/tables')}>
          <Text style={styles.navCardTitle}>Tables</Text>
          <Text style={styles.navCardCopy}>View table layout per location</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6efe7' },
  content: { gap: 14, padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#1f1a17' },
  card: { gap: 8, borderRadius: 22, backgroundColor: '#fffaf4', padding: 16 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  cardCopy: { color: '#6c5b4d' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#1d2d3c',
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontSize: 26, fontWeight: '700', color: '#fffaf4' },
  statLabel: { fontSize: 12, color: '#9eb4c8', textAlign: 'center' },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  orderText: { color: '#1f1a17', flex: 1 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#e0d6cc',
    fontSize: 12,
    fontWeight: '700',
    color: '#6c5b4d',
  },
  statusPreparing: { backgroundColor: '#fff3cd', color: '#856404' },
  statusReady: { backgroundColor: '#c8e6c9', color: '#1a6b2a' },
  moreText: { color: '#8f7d70', fontSize: 13 },
  navSection: { gap: 10 },
  navTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  navCard: {
    gap: 4,
    borderRadius: 22,
    backgroundColor: '#fffaf4',
    padding: 16,
  },
  navCardTitle: { fontSize: 16, fontWeight: '700', color: '#1f1a17' },
  navCardCopy: { color: '#6c5b4d' },
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
