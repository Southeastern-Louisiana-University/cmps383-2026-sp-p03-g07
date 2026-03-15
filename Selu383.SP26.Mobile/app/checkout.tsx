import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { orderService } from '@/services/orderService';
import { useAuth } from '@/store/authStore';
import { useCart } from '@/store/cartStore';

export default function CheckoutScreen() {
  const { user } = useAuth();
  const { clear, items, subtotal } = useCart();
  const [pickupName, setPickupName] = useState(user?.userName ?? '');
  const [statusMessage, setStatusMessage] = useState('');

  async function submitOrder() {
    try {
      const order = await orderService.createOrder({
        locationId: items[0]?.locationId ?? 1,
        orderType: 'pickup',
        pickupName,
        specialInstructions: '',
        total: subtotal,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          itemName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.quantity * item.price,
          customizations: '',
          specialInstructions: '',
        })),
      });

      await orderService.checkout({
        orderId: order.id,
        paymentMethod: 'Card',
        amount: subtotal,
        cardLastFour: '4242',
      });

      clear();
      router.push('/(tabs)/orders');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Checkout failed.');
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Checkout</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pickup name</Text>
        <TextInput
          style={styles.input}
          value={pickupName}
          onChangeText={setPickupName}
          placeholder="Enter a pickup name"
          placeholderTextColor="#8f7d70"
        />
        <Text style={styles.cardCopy}>Total ${subtotal.toFixed(2)}</Text>
        <Text style={styles.cardCopy}>Estimated stars {Math.max(Math.floor(subtotal), 1)}</Text>
        {statusMessage ? <Text style={styles.errorText}>{statusMessage}</Text> : null}
        <Pressable style={styles.primaryButton} onPress={submitOrder}>
          <Text style={styles.primaryButtonText}>Place order</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6efe7' },
  content: { gap: 14, padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#1f1a17' },
  card: { gap: 10, borderRadius: 22, backgroundColor: '#fffaf4', padding: 16 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  cardCopy: { color: '#6c5b4d' },
  input: {
    borderRadius: 18,
    backgroundColor: '#f6efe7',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#1f1a17',
  },
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#1d2d3c',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: { color: '#fffaf4', fontWeight: '700' },
  errorText: { color: '#b33030' },
});
