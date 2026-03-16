import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { locationService } from '@/services/locationService';
import { orderService } from '@/services/orderService';
import { useAuth } from '@/store/authStore';
import { useCart } from '@/store/cartStore';
import type { Location } from '@/types/app';

const ORDER_TYPES = ['pickup', 'drive-thru', 'dine-in'] as const;
type OrderType = (typeof ORDER_TYPES)[number];

export default function CheckoutScreen() {
  const { user } = useAuth();
  const { clear, items, subtotal } = useCart();
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState<number | null>(items[0]?.locationId ?? null);
  const [orderType, setOrderType] = useState<OrderType>('pickup');
  const [pickupName, setPickupName] = useState(user?.displayName ?? user?.userName ?? '');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    void locationService.getLocations().then((locs) => {
      setLocations(locs);
      if (!locationId && locs.length > 0) {
        setLocationId(locs[0].id);
      }
    }).catch(() => {});
  }, []);

  if (items.length === 0) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Checkout</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your cart is empty</Text>
          <Text style={styles.cardCopy}>Add items from the menu to place an order.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/(tabs)/menu')}>
            <Text style={styles.primaryButtonText}>Browse menu</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  async function submitOrder() {
    if (!locationId) {
      setErrorMessage('Please select a location.');
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      const order = await orderService.createOrder({
        locationId,
        orderType,
        pickupName,
        specialInstructions: specialInstructions + (note ? `\nNote: ${note}` : ''),
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
      router.replace(`/order-confirmation?id=${order.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Checkout failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Checkout</Text>

      {!user && (
        <View style={styles.guestBanner}>
          <Text style={styles.guestBannerText}>Checking out as guest - no points earned.</Text>
          <Pressable onPress={() => router.push('/Auth/login')}>
            <Text style={styles.guestBannerLink}>Sign in to earn stars</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Location</Text>
        {locations.map((loc) => (
          <Pressable
            key={loc.id}
            style={[styles.option, locationId === loc.id && styles.optionSelected]}
            onPress={() => setLocationId(loc.id)}>
            <Text style={[styles.optionText, locationId === loc.id && styles.optionTextSelected]}>
              {loc.name}
            </Text>
            <Text style={styles.optionSub}>{loc.address}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order type</Text>
        <View style={styles.pillRow}>
          {ORDER_TYPES.map((type) => (
            <Pressable
              key={type}
              style={[styles.pill, orderType === type && styles.pillSelected]}
              onPress={() => setOrderType(type)}>
              <Text style={[styles.pillText, orderType === type && styles.pillTextSelected]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pickup name</Text>
        <TextInput
          style={styles.input}
          value={pickupName}
          onChangeText={setPickupName}
          placeholder="Enter a pickup name"
          placeholderTextColor="#8f7d70"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Special instructions</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={specialInstructions}
          onChangeText={setSpecialInstructions}
          placeholder="Allergies, substitutions, etc."
          placeholderTextColor="#8f7d70"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Note for kitchen</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={note}
          onChangeText={setNote}
          placeholder="Any additional notes"
          placeholderTextColor="#8f7d70"
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order summary</Text>
        {items.map((item) => (
          <Text key={item.id} style={styles.cardCopy}>
            {item.quantity}x {item.name} - ${(item.price * item.quantity).toFixed(2)}
          </Text>
        ))}
        <Text style={[styles.cardCopy, styles.total]}>Total: ${subtotal.toFixed(2)}</Text>
        <Text style={styles.cardCopy}>
          Estimated stars: {Math.max(Math.floor(subtotal), 1)}
        </Text>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <Pressable
          style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
          onPress={submitOrder}
          disabled={submitting}>
          <Text style={styles.primaryButtonText}>
            {submitting ? 'Placing order...' : 'Place order'}
          </Text>
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
  total: { fontWeight: '700', color: '#1f1a17', marginTop: 4 },
  input: {
    borderRadius: 18,
    backgroundColor: '#f6efe7',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#1f1a17',
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  option: {
    borderRadius: 14,
    backgroundColor: '#f6efe7',
    padding: 12,
    gap: 2,
  },
  optionSelected: {
    backgroundColor: '#1d2d3c',
  },
  optionText: { fontWeight: '600', color: '#1f1a17' },
  optionTextSelected: { color: '#fffaf4' },
  optionSub: { fontSize: 13, color: '#8f7d70' },
  pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: {
    borderRadius: 999,
    backgroundColor: '#f6efe7',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pillSelected: { backgroundColor: '#1d2d3c' },
  pillText: { fontWeight: '600', color: '#1f1a17' },
  pillTextSelected: { color: '#fffaf4' },
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#1d2d3c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 4,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fffaf4', fontWeight: '700' },
  errorText: { color: '#b33030' },
  guestBanner: {
    borderRadius: 14,
    backgroundColor: '#fff3cd',
    padding: 12,
    gap: 6,
  },
  guestBannerText: { color: '#856404' },
  guestBannerLink: { color: '#1d2d3c', fontWeight: '700', textDecorationLine: 'underline' },
});
