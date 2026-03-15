import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { apiRequest } from '@/services/api';

export default function GiftCardScreen() {
  const [amount, setAmount] = useState('25');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  async function buyGiftCard() {
    try {
      const giftCard = await apiRequest<{ code: string; balance: number }>('/api/payments/gift-cards/purchase', {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(amount),
          recipientName: 'Mobile Guest',
          recipientEmail: 'guest@example.com',
          message: 'Enjoy your next coffee break.',
        }),
      });

      setCode(giftCard.code);
      setMessage(`Gift card ${giftCard.code} created with $${giftCard.balance.toFixed(2)}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create gift card.');
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Gift cards</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Load balance</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <Pressable style={styles.primaryButton} onPress={buyGiftCard}>
          <Text style={styles.primaryButtonText}>Buy gift card</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gift card code</Text>
        <Text style={styles.cardCopy}>{code || 'No code created yet.'}</Text>
        {message ? <Text style={styles.cardCopy}>{message}</Text> : null}
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
});
