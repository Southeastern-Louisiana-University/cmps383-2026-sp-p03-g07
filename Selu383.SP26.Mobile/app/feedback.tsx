import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { feedbackService } from '@/services/feedbackService';
import { useAuth } from '@/store/authStore';

const RATINGS = [1, 2, 3, 4, 5];
const SAMPLE_FEEDBACK = [
  { rating: 5, category: 'Coffee Quality', name: 'Maya', comment: 'Cold brew was smooth and not too bitter. Perfect start to the day.', when: '2 days ago' },
  { rating: 4, category: 'Service', name: 'Jordan', comment: 'Quick pickup and super friendly staff. My drink was ready right on time.', when: 'This week' },
  { rating: 5, category: 'Food', name: 'Avery', comment: 'Crepe was warm and filling. Great portion for the price.', when: 'Last week' },
  { rating: 4, category: 'Atmosphere', name: 'Sam', comment: 'Cozy vibe and a good spot to study. Music volume was just right.', when: 'Last week' },
  { rating: 5, category: 'Overall', name: 'Lena', comment: 'Loved the new menu—super easy to customize and everything tasted fresh.', when: 'Yesterday' },
  { rating: 4, category: 'Cleanliness', name: 'Chris', comment: 'Tables were clean and the pickup area stayed organized even during the rush.', when: 'This week' },
  { rating: 5, category: 'Service', name: 'Nina', comment: 'Barista helped me pick the perfect drink and got my order out fast.', when: 'This month' },
  { rating: 4, category: 'Food', name: 'Diego', comment: 'Bagel was toasted just right and the add-ons made it even better.', when: 'This month' },
] as const;

function renderStars(rating: number) {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));
  return `${'★'.repeat(safeRating)}${'☆'.repeat(5 - safeRating)}`;
}

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
	        <View style={styles.samplesSection}>
	          <Text style={styles.samplesHeading}>Recent feedback</Text>
	          {SAMPLE_FEEDBACK.map((entry) => (
	            <View style={styles.sampleCard} key={`${entry.name}-${entry.category}-${entry.when}`}>
	              <Text style={styles.sampleMeta}>
	                {renderStars(entry.rating)} • {entry.category} • {entry.when}
	              </Text>
	              <Text style={styles.sampleComment}>{entry.comment}</Text>
	              <Text style={styles.sampleAuthor}>— {entry.name}</Text>
	            </View>
	          ))}
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
    if (!user) {
      setErrorMessage('Please sign in to leave feedback.');
      return;
    }
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
      await feedbackService.submit({
        category: 'Overall',
        rating,
        name: user.displayName || user.userName,
        comment: comment.trim(),
      });
      setSubmitted(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to submit feedback.');
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

	        <Text style={styles.ratingLabel}>Overall rating</Text>
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

	      <View style={styles.samplesSection}>
	        <Text style={styles.samplesHeading}>Recent feedback</Text>
	        {SAMPLE_FEEDBACK.map((entry) => (
	          <View style={styles.sampleCard} key={`${entry.name}-${entry.category}-${entry.when}`}>
	            <Text style={styles.sampleMeta}>
	              {renderStars(entry.rating)} • {entry.category} • {entry.when}
	            </Text>
	            <Text style={styles.sampleComment}>{entry.comment}</Text>
	            <Text style={styles.sampleAuthor}>— {entry.name}</Text>
	          </View>
	        ))}
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
	  ratingLabel: { fontSize: 13, fontWeight: '800', color: '#1f1a17', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
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
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: '#1d2d3c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 4,
  },
  primaryButtonText: { color: '#fffaf4', fontWeight: '700', textAlign: 'center' },
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
	  samplesSection: { gap: 10, marginTop: 4 },
	  samplesHeading: { fontSize: 17, fontWeight: '700', color: '#1f1a17', marginTop: 10 },
	  sampleCard: { gap: 6, borderRadius: 22, backgroundColor: '#fffaf4', padding: 16 },
	  sampleMeta: { color: '#6c5b4d', fontWeight: '600' },
	  sampleComment: { color: '#1f1a17' },
	  sampleAuthor: { color: '#8a5124', fontWeight: '700' },
	});
