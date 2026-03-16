import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { locationService } from '@/services/locationService';
import { reservationService } from '@/services/reservationService';
import { useAuth } from '@/store/authStore';
import type { Location, Reservation } from '@/types/app';

export default function ReservationsScreen() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [reservationDate, setReservationDate] = useState('');
  const [reservationTime, setReservationTime] = useState('');
  const [partySize, setPartySize] = useState('2');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    void locationService.getLocations().then((locs) => {
      setLocations(locs);
      if (locs.length > 0) setLocationId(locs[0].id);
    }).catch(() => {});

    if (user) {
      void reservationService.getReservations().then(setReservations).catch(() => {});
    }
  }, [user]);

  if (!user) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Reservations</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in to book a table</Text>
          <Text style={styles.cardCopy}>
            Create an account or log in to make and manage reservations.
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/Auth/login')}>
            <Text style={styles.primaryButtonText}>Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  async function submitReservation() {
    if (!locationId) {
      setErrorMessage('Please select a location.');
      return;
    }
    if (!reservationDate || !reservationTime) {
      setErrorMessage('Please enter a date and time.');
      return;
    }
    const size = parseInt(partySize, 10);
    if (!size || size < 1 || size > 20) {
      setErrorMessage('Party size must be between 1 and 20.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const isoDateTime = `${reservationDate}T${reservationTime}:00`;
      await reservationService.create({
        locationId: locationId!,
        reservationTime: isoDateTime,
        partySize: size,
      });
      setSuccessMessage('Reservation booked successfully!');
      setReservationDate('');
      setReservationTime('');
      setPartySize('2');
      const updated = await reservationService.getReservations().catch(() => reservations);
      setReservations(updated);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Reservations</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Book a table</Text>

        <Text style={styles.label}>Location</Text>
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

        <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={reservationDate}
          onChangeText={setReservationDate}
          placeholder="2026-04-15"
          placeholderTextColor="#8f7d70"
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.label}>Time (HH:MM)</Text>
        <TextInput
          style={styles.input}
          value={reservationTime}
          onChangeText={setReservationTime}
          placeholder="18:30"
          placeholderTextColor="#8f7d70"
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.label}>Party size</Text>
        <TextInput
          style={styles.input}
          value={partySize}
          onChangeText={setPartySize}
          placeholder="2"
          placeholderTextColor="#8f7d70"
          keyboardType="numeric"
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <Pressable
          style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
          onPress={submitReservation}
          disabled={submitting}>
          <Text style={styles.primaryButtonText}>
            {submitting ? 'Booking...' : 'Book table'}
          </Text>
        </Pressable>
      </View>

      {reservations.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your reservations</Text>
          {reservations.map((res) => (
            <View key={res.id} style={styles.reservationRow}>
              <Text style={styles.reservationText}>
                {new Date(res.reservationTime).toLocaleString()} - Party of {res.partySize}
              </Text>
              <Text style={[styles.statusBadge,
                res.status.toLowerCase() === 'confirmed' && styles.statusConfirmed,
                res.status.toLowerCase() === 'cancelled' && styles.statusCancelled,
              ]}>
                {res.status}
              </Text>
            </View>
          ))}
        </View>
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
  cardCopy: { color: '#6c5b4d' },
  label: { fontSize: 13, fontWeight: '600', color: '#6c5b4d', textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    borderRadius: 18,
    backgroundColor: '#f6efe7',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#1f1a17',
  },
  option: { borderRadius: 14, backgroundColor: '#f6efe7', padding: 12, gap: 2 },
  optionSelected: { backgroundColor: '#1d2d3c' },
  optionText: { fontWeight: '600', color: '#1f1a17' },
  optionTextSelected: { color: '#fffaf4' },
  optionSub: { fontSize: 13, color: '#8f7d70' },
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
  successText: { color: '#1a6b2a', fontWeight: '600' },
  reservationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  reservationText: { color: '#1f1a17', flex: 1 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#e0d6cc',
    fontSize: 12,
    fontWeight: '700',
    color: '#6c5b4d',
  },
  statusConfirmed: { backgroundColor: '#c8e6c9', color: '#1a6b2a' },
  statusCancelled: { backgroundColor: '#ffcdd2', color: '#b33030' },
});
