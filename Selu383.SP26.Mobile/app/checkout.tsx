import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { locationService } from '@/services/locationService';
import { orderService } from '@/services/orderService';
import { useAuth } from '@/store/authStore';
import { useCart } from '@/store/cartStore';
import type { Location } from '@/types/app';
import { calculatePointsEarned } from '@/utils/rewardsProgram';

const ORDER_TYPES = ['pickup', 'drive-thru'] as const;
type OrderType = (typeof ORDER_TYPES)[number];

const DEMO_CARD = {
  number: '4242 4242 4242 4242',
  exp: '12/34',
  cvc: '123',
  zip: '70402',
} as const;

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  const groups = digits.match(/.{1,4}/g) ?? [];
  return groups.join(' ');
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

function formatCardPreview(value: string) {
  const lastFour = digitsOnly(value).slice(-4) || '4242';
  return `•••• •••• •••• ${lastFour}`;
}

export default function CheckoutScreen() {
  const { user } = useAuth();
  const { clear, items, subtotal } = useCart();
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState<number | null>(items[0]?.locationId ?? null);
  const [orderType, setOrderType] = useState<OrderType>('pickup');
  const initialName = user?.displayName ?? user?.userName ?? '';
  const [pickupName, setPickupName] = useState(initialName);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [note, setNote] = useState('');
  const [cardNumber, setCardNumber] = useState(DEMO_CARD.number);
  const [cardExpiry, setCardExpiry] = useState(DEMO_CARD.exp);
  const [cardCvc, setCardCvc] = useState(DEMO_CARD.cvc);
  const [cardZip, setCardZip] = useState(DEMO_CARD.zip);
  const [cardName, setCardName] = useState(initialName);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    void locationService.getLocations().then((locs) => {
      setLocations(locs);
      setLocationId((currentLocationId) => currentLocationId ?? locs[0]?.id ?? null);
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

    const trimmedPickupName = pickupName.trim();
    if (!trimmedPickupName) {
      setErrorMessage('Pickup name is required.');
      return;
    }

    const cardLastFour = digitsOnly(cardNumber).slice(-4) || '4242';
    setSubmitting(true);
    setErrorMessage('');
    try {
      const order = await orderService.createOrder({
        locationId,
        orderType,
        pickupName: trimmedPickupName,
        specialInstructions: specialInstructions + (note ? `\nNote: ${note}` : ''),
        total: subtotal,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          itemName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          total: item.quantity * item.price,
          customizations: item.customizations,
          specialInstructions: '',
        })),
      });

      await orderService.checkout({
        orderId: order.id,
        paymentMethod: 'Card',
        amount: subtotal,
        cardLastFour,
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
            <Text style={styles.guestBannerLink}>Sign in to earn points</Text>
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
        <Text style={styles.cardTitle}>Pickup name (required)</Text>
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
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Payment method</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Demo</Text>
          </View>
        </View>
        <Text style={styles.cardCopy}>
          This is a demo checkout — no real charges are made.
        </Text>

        <View style={styles.paymentPreview}>
          <MaterialIcons name="credit-card" size={22} color="#fffaf4" />
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentPreviewLabel}>Card</Text>
            <Text style={styles.paymentPreviewNumber}>
              {formatCardPreview(cardNumber)}
            </Text>
          </View>
          <MaterialIcons name="lock" size={18} color="#f2c57d" />
        </View>

        <Text style={styles.inputLabel}>Card number</Text>
        <TextInput
          style={styles.input}
          value={cardNumber}
          onChangeText={(value) => setCardNumber(formatCardNumber(value))}
          placeholder="4242 4242 4242 4242"
          placeholderTextColor="#8f7d70"
          keyboardType="number-pad"
          maxLength={19}
        />

        <View style={styles.inputRow}>
          <View style={styles.inputCol}>
            <Text style={styles.inputLabel}>Expiry</Text>
            <TextInput
              style={styles.input}
              value={cardExpiry}
              onChangeText={(value) => setCardExpiry(formatExpiry(value))}
              placeholder="MM/YY"
              placeholderTextColor="#8f7d70"
              keyboardType="number-pad"
              maxLength={5}
            />
          </View>
          <View style={styles.inputCol}>
            <Text style={styles.inputLabel}>CVC</Text>
            <TextInput
              style={styles.input}
              value={cardCvc}
              onChangeText={(value) => setCardCvc(digitsOnly(value).slice(0, 4))}
              placeholder="123"
              placeholderTextColor="#8f7d70"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
          </View>
        </View>

        <Text style={styles.inputLabel}>Name on card</Text>
        <TextInput
          style={styles.input}
          value={cardName}
          onChangeText={setCardName}
          placeholder="Your name"
          placeholderTextColor="#8f7d70"
        />

        <Text style={styles.inputLabel}>ZIP code</Text>
        <TextInput
          style={styles.input}
          value={cardZip}
          onChangeText={(value) => setCardZip(digitsOnly(value).slice(0, 10))}
          placeholder="70402"
          placeholderTextColor="#8f7d70"
          keyboardType="number-pad"
          maxLength={10}
        />

        <Pressable
          style={styles.secondaryButton}
          onPress={() => {
            setCardNumber(DEMO_CARD.number);
            setCardExpiry(DEMO_CARD.exp);
            setCardCvc(DEMO_CARD.cvc);
            setCardZip(DEMO_CARD.zip);
            setCardName((name) => name || initialName || 'Demo User');
          }}>
          <MaterialIcons name="auto-awesome" size={18} color="#1d2d3c" />
          <Text style={styles.secondaryButtonText}>Use demo card</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order summary</Text>
        {items.map((item) => (
          <Text key={item.id} style={styles.cardCopy}>
            {item.quantity}x {item.name} - ${(item.price * item.quantity).toFixed(2)}
          </Text>
        ))}
        <Text style={styles.cardCopy}>
          Payment: Card •••• {digitsOnly(cardNumber).slice(-4) || '4242'}
        </Text>
        <Text style={[styles.cardCopy, styles.total]}>Total: ${subtotal.toFixed(2)}</Text>
        <Text style={styles.cardCopy}>
          Estimated points: {calculatePointsEarned(subtotal)}
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
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  cardCopy: { color: '#6c5b4d' },
  total: { fontWeight: '700', color: '#1f1a17', marginTop: 4 },
  badge: {
    borderRadius: 999,
    backgroundColor: '#ead7c5',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: '#40261a', fontWeight: '800', fontSize: 12, letterSpacing: 0.4 },
  paymentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    backgroundColor: '#1d2d3c',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  paymentPreviewLabel: { color: '#eadcd1', fontWeight: '700', fontSize: 12 },
  paymentPreviewNumber: { color: '#fffaf4', fontWeight: '800', letterSpacing: 1.1, marginTop: 2 },
  inputLabel: { color: '#6c5b4d', fontWeight: '700', fontSize: 13, marginTop: 6 },
  inputRow: { flexDirection: 'row', gap: 10 },
  inputCol: { flex: 1, minWidth: 120 },
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
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: '#f6efe7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 4,
  },
  secondaryButtonText: { color: '#1d2d3c', fontWeight: '800' },
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
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: '#1d2d3c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 4,
  },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fffaf4', fontWeight: '700', textAlign: 'center' },
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
