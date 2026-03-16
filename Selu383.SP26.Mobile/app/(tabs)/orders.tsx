import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { orderService } from '@/services/orderService';
import type { Order } from '@/types/app';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    void orderService.getOrders().then(setOrders).catch(() => setOrders([]));
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Order tracking</Text>
      {orders.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No orders yet</Text>
          <Text style={styles.cardCopy}>Place an order from the menu to start tracking it here.</Text>
        </View>
      ) : (
        orders.map((order) => (
          <View key={order.id} style={styles.card}>
            <Text style={styles.cardTitle}>Order #{order.id}</Text>
            <Text style={styles.cardCopy}>
              {order.orderType} • {order.status}
            </Text>
            <Text style={styles.cardCopy}>
              {order.items.map((item) => `${item.quantity}x ${item.itemName}`).join(', ')}
            </Text>
            <Text style={styles.metaText}>
              ${order.total.toFixed(2)} • {order.paymentStatus}
            </Text>
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
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  cardCopy: { color: '#6c5b4d' },
  metaText: { color: '#8a5124', fontWeight: '700' },
});
