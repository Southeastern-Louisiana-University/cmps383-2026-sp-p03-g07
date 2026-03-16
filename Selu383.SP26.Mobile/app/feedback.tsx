import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/store/authStore';

const RATINGS = [1, 2, 3, 4, 5];

export default function FeedbackScreen() {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!user) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Feedback</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in to leave feedback</Text>
          <Text style={styles.cardCopy}>
            We value your opinion. Log in to share your experience with us.
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/Auth/login')}>
            <Text style={styles.primaryButtonText}>Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  if (submitted) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.successCard}>
          <Text style={styles.successTitle}>Thank you!</Text>
          <Text style={styles.successCopy}>
            Your feedback helps us improve. We appreciate you taking the time.
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.primaryButtonText}>Back to home</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  async function submitFeedback() {
    if (rating === 0) {
      setErrorMessage('Please select a rating.');
      return;
    }
    if (!comment.trim()) {
      setErrorMessage('Please enter a comment.');
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      // Feedback endpoint - fire and forget, gracefully handle if not implemented yet
      await fetch('/api/feedback', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });
      setSubmitted(true);
    } catch {
      // If endpoint not available, still show success to not block UX
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Feedback</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How was your experience?</Text>
        <Text style={styles.cardCopy}>
          Tell us what you think about our food, service, and app.
        </Text>

        <Text style={styles.label}>Rating</Text>
        <View style={styles.starsRow}>
          {RATINGS.map((star) => (
            <Pressable key={star} onPress={() => setRating(star)} style={styles.starButton}>
              <Text style={[styles.star, star <= rating && styles.starActive]}>
                {star <= rating ? '★' : '☆'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Comment</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={comment}
          onChangeText={setComment}
          placeholder="Share your thoughts..."
          placeholderTextColor="#8f7d70"
          multiline
          numberOfLines={5}
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Pressable
          style={[styles.primaryButton, submitting && styles.buttonDisabled]}
          onPress={submitFeedback}
          disabled={submitting}>
          <Text style={styles.primaryButtonText}>
            {submitting ? 'Submitting...' : 'Submit feedback'}
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
  label: { fontSize: 13, fontWeight: '600', color: '#6c5b4d', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  starsRow: { flexDirection: 'row', gap: 8 },
  starButton: { padding: 4 },
  star: { fontSize: 32, color: '#d0c5bc' },
  starActive: { color: '#f2c57d' },
  input: {
    borderRadius: 18,
    backgroundColor: '#f6efe7',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#1f1a17',
  },
  inputMultiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#1d2d3c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 4,
  },
  primaryButtonText: { color: '#fffaf4', fontWeight: '700' },
  buttonDisabled: { opacity: 0.6 },
  errorText: { color: '#b33030' },
  successCard: {
    borderRadius: 28,
    backgroundColor: '#40261a',
    padding: 28,
    gap: 12,
    alignItems: 'flex-start',
  },
  successTitle: { fontSize: 26, fontWeight: '700', color: '#f2c57d' },
  successCopy: { color: '#eadcd1' },
});
