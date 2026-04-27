import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { locationService } from '@/services/locationService';
import { reservationService } from '@/services/reservationService';
import { useAuth } from '@/store/authStore';
import type { Location, Reservation } from '@/types/app';

const QUICK_TIMES = ['5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM'] as const;

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default function ReservationsScreen() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [reservationDate, setReservationDate] = useState(() => formatLocalDate(new Date()));
  const [reservationTime, setReservationTime] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingReservationId, setCancellingReservationId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const today = useMemo(() => formatLocalDate(new Date()), []);
  const tomorrow = useMemo(() => formatLocalDate(addDays(new Date(), 1)), []);
  const locationNameById = useMemo(() => new Map(locations.map((loc) => [loc.id, loc.name])), [locations]);

  function parse12HourTime(value: string) {
    const normalized = value.trim().toLowerCase();
    const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
    if (!match) return null;

    let hours = Number(match[1]);
    const minutes = match[2] ? Number(match[2]) : 0;
    const meridiem = match[3].toLowerCase();

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    if (hours < 1 || hours > 12) return null;
    if (minutes < 0 || minutes > 59) return null;

    if (meridiem === 'am') {
      if (hours === 12) hours = 0;
    } else if (meridiem === 'pm') {
      if (hours !== 12) hours += 12;
    } else {
      return null;
    }

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

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
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroIcon}>
              <MaterialIcons name="event-seat" size={22} color="#f2c57d" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Reserve a table</Text>
              <Text style={styles.heroSub}>Sign in to book and manage your reservations.</Text>
            </View>
          </View>
          <View style={styles.heroBadges}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>No payment required</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Demo booking</Text>
            </View>
          </View>
        </View>

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

  async function cancelReservation(id: number) {
    setCancellingReservationId(id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updated = await reservationService.cancel(id);
      setReservations((prev) => prev.map((res) => (res.id === id ? updated : res)));
      setSuccessMessage('Reservation cancelled.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to cancel reservation.');
    } finally {
      setCancellingReservationId(null);
    }
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

    const time24 = parse12HourTime(reservationTime);
    if (!time24) {
      setErrorMessage('Please enter the time like 6:30 PM.');
      return;
    }

    if (!partySize || partySize < 1 || partySize > 20) {
      setErrorMessage('Party size must be between 1 and 20.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const isoDateTime = `${reservationDate}T${time24}:00`;
      await reservationService.create({
        locationId: locationId!,
        reservationTime: isoDateTime,
        partySize,
      });
      setSuccessMessage('Reservation booked successfully!');
      setReservationDate(today);
      setReservationTime('');
      setPartySize(2);
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
      <View style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={styles.heroIcon}>
            <MaterialIcons name="event-seat" size={22} color="#f2c57d" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Reserve a table</Text>
            <Text style={styles.heroSub}>Pick a location, date, and time — we’ll save your spot.</Text>
          </View>
        </View>
        <View style={styles.heroBadges}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>No pre-payment</Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Instant confirmation</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Booking details</Text>

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

        <View style={styles.formRow}>
          <View style={styles.formCol}>
            <Text style={styles.label}>Date</Text>
            <View style={styles.chipRow}>
              <Pressable
                style={[styles.chip, reservationDate === today && styles.chipSelected]}
                onPress={() => setReservationDate(today)}>
                <Text style={[styles.chipText, reservationDate === today && styles.chipTextSelected]}>Today</Text>
              </Pressable>
              <Pressable
                style={[styles.chip, reservationDate === tomorrow && styles.chipSelected]}
                onPress={() => setReservationDate(tomorrow)}>
                <Text style={[styles.chipText, reservationDate === tomorrow && styles.chipTextSelected]}>Tomorrow</Text>
              </Pressable>
            </View>
            <TextInput
              style={styles.input}
              value={reservationDate}
              onChangeText={setReservationDate}
              placeholder={today}
              placeholderTextColor="#8f7d70"
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <View style={styles.formCol}>
            <Text style={styles.label}>Time</Text>
            <View style={styles.chipRow}>
              {QUICK_TIMES.map((time) => (
                <Pressable
                  key={time}
                  style={[styles.chip, reservationTime === time && styles.chipSelected]}
                  onPress={() => setReservationTime(time)}>
                  <Text style={[styles.chipText, reservationTime === time && styles.chipTextSelected]}>{time}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.input}
              value={reservationTime}
              onChangeText={setReservationTime}
              placeholder="6:30 PM"
              placeholderTextColor="#8f7d70"
            />
          </View>
        </View>

        <View style={styles.partyHeader}>
          <Text style={styles.label}>Party size</Text>
          <Text style={styles.hint}>1–20 guests</Text>
        </View>
        <View style={styles.stepperRow}>
          <Pressable
            style={[styles.stepperButton, partySize <= 1 && styles.stepperButtonDisabled]}
            onPress={() => setPartySize((size) => Math.max(1, size - 1))}
            disabled={partySize <= 1}>
            <MaterialIcons name="remove" size={18} color={partySize <= 1 ? '#8f7d70' : '#40261a'} />
          </Pressable>
          <View style={styles.stepperValue}>
            <Text style={styles.stepperValueText}>{partySize}</Text>
            <Text style={styles.stepperValueSub}>{partySize === 1 ? 'guest' : 'guests'}</Text>
          </View>
          <Pressable
            style={[styles.stepperButton, partySize >= 20 && styles.stepperButtonDisabled]}
            onPress={() => setPartySize((size) => Math.min(20, size + 1))}
            disabled={partySize >= 20}>
            <MaterialIcons name="add" size={18} color={partySize >= 20 ? '#8f7d70' : '#40261a'} />
          </Pressable>
        </View>

        {errorMessage ? (
          <View style={[styles.messageBanner, styles.messageError]}>
            <MaterialIcons name="error-outline" size={18} color="#b33030" />
            <Text style={styles.messageText}>{errorMessage}</Text>
          </View>
        ) : null}
        {successMessage ? (
          <View style={[styles.messageBanner, styles.messageSuccess]}>
            <MaterialIcons name="check-circle-outline" size={18} color="#1a6b2a" />
            <Text style={styles.messageText}>{successMessage}</Text>
          </View>
        ) : null}

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
          {reservations.map((res) => {
            const locationName = locationNameById.get(res.locationId) ?? `Location #${res.locationId}`;
            const isCancelled = res.status.toLowerCase() === 'cancelled';
            const canCancel = !isCancelled;
            const isCancelling = cancellingReservationId === res.id;

            return (
              <View key={res.id} style={styles.reservationCard}>
                <View style={styles.reservationTopRow}>
                  <Text style={styles.reservationTitle}>
                    {new Date(res.reservationTime).toLocaleString()}
                  </Text>
                  <Text style={[styles.statusBadge,
                    res.status.toLowerCase() === 'confirmed' && styles.statusConfirmed,
                    isCancelled && styles.statusCancelled,
                  ]}>
                    {res.status}
                  </Text>
                </View>
                <Text style={styles.reservationMeta}>
                  {locationName} • Party of {res.partySize}
                </Text>
                {canCancel ? (
                  <Pressable
                    style={[styles.cancelButton, isCancelling && styles.primaryButtonDisabled]}
                    onPress={() => cancelReservation(res.id)}
                    disabled={isCancelling}>
                    <Text style={styles.cancelButtonText}>
                      {isCancelling ? 'Cancelling...' : 'Cancel'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6efe7' },
  content: { gap: 14, padding: 20, paddingBottom: 40 },
  card: { gap: 10, borderRadius: 22, backgroundColor: '#fffaf4', padding: 16 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  cardCopy: { color: '#6c5b4d' },
  heroCard: {
    borderRadius: 28,
    backgroundColor: '#1d2d3c',
    padding: 20,
    gap: 12,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(242, 197, 125, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fffaf4' },
  heroSub: { color: '#9eb4c8', marginTop: 4, lineHeight: 18 },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  heroBadge: {
    borderRadius: 999,
    backgroundColor: 'rgba(255, 250, 244, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroBadgeText: { color: '#eadcd1', fontWeight: '700', fontSize: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#6c5b4d', textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    borderRadius: 18,
    backgroundColor: '#f6efe7',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#1f1a17',
  },
  formRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  formCol: { flex: 1, minWidth: 220 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    backgroundColor: '#f6efe7',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: { backgroundColor: '#1d2d3c' },
  chipText: { color: '#1f1a17', fontWeight: '700', fontSize: 12 },
  chipTextSelected: { color: '#fffaf4' },
  partyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hint: { color: '#8f7d70', fontWeight: '700', fontSize: 12 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ead7c5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: { opacity: 0.55 },
  stepperValue: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: '#f6efe7',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  stepperValueText: { fontSize: 18, fontWeight: '900', color: '#1f1a17' },
  stepperValueSub: { fontSize: 12, color: '#6c5b4d', fontWeight: '700' },
  messageBanner: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  messageError: { backgroundColor: '#ffe7e7' },
  messageSuccess: { backgroundColor: '#e7f6ea' },
  messageText: { flex: 1, color: '#1f1a17', fontWeight: '700' },
  option: { borderRadius: 14, backgroundColor: '#f6efe7', padding: 12, gap: 2 },
  optionSelected: { backgroundColor: '#1d2d3c' },
  optionText: { fontWeight: '600', color: '#1f1a17' },
  optionTextSelected: { color: '#fffaf4' },
  optionSub: { fontSize: 13, color: '#8f7d70' },
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
  reservationCard: {
    borderRadius: 18,
    backgroundColor: '#f6efe7',
    padding: 12,
    gap: 8,
  },
  reservationTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  reservationTitle: { color: '#1f1a17', fontWeight: '800', flex: 1 },
  reservationMeta: { color: '#6c5b4d', fontWeight: '700' },
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
  cancelButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#fffaf4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ead7c5',
  },
  cancelButtonText: { color: '#b33030', fontWeight: '800' },
});
