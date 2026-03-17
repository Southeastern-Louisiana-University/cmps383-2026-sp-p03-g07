import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useCart } from '@/store/cartStore';

export default function CartScreen() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Cart</Text>
      {items.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your cart is empty.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/(tabs)/menu')}>
            <Text style={styles.primaryButtonText}>Browse menu</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {items.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Pressable onPress={() => removeItem(item.id)}>
                  <Text style={styles.removeBtn}>Remove</Text>
                </Pressable>
              </View>
              <View style={styles.row}>
                <Pressable style={styles.secondaryButton} onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                  <Text style={styles.secondaryButtonText}>-</Text>
                </Pressable>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <Pressable style={styles.secondaryButton} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                  <Text style={styles.secondaryButtonText}>+</Text>
                </Pressable>
                <Text style={styles.price}>${(item.quantity * item.price).toFixed(2)}</Text>
              </View>
            </View>
          ))}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Subtotal ${subtotal.toFixed(2)}</Text>
            <Pressable style={styles.primaryButton} onPress={() => router.push('/checkout')}>
              <Text style={styles.primaryButtonText}>Checkout</Text>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6efe7' },
  content: { gap: 14, padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#1f1a17' },
  card: { gap: 10, borderRadius: 22, backgroundColor: '#fffaf4', padding: 16 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  removeBtn: { color: '#c0392b', fontSize: 13, fontWeight: '600' },
  quantityText: { fontSize: 15, fontWeight: '700', color: '#1f1a17', minWidth: 24, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#1d2d3c',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: { color: '#fffaf4', fontWeight: '700' },
  secondaryButton: {
    borderRadius: 999,
    backgroundColor: '#ead7c5',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  secondaryButtonText: { color: '#40261a', fontWeight: '700' },
  price: { color: '#8a5124', fontWeight: '700' },
});
