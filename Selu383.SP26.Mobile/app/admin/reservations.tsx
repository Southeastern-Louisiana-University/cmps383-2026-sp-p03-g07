import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { locationService } from '@/services/locationService';
import { reservationService } from '@/services/reservationService';
import { useAuth } from '@/store/authStore';
import type { Location, Reservation } from '@/types/app';

export default function AdminReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    void Promise.all([
      reservationService.getReservations(),
      locationService.getLocations(),
    ])
      .then(([res, locs]) => {
        setReservations(res);
        setLocations(locs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Manager'))) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Reservations</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Access denied</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Go back</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  async function handleCancel(id: number) {
    setCancelling(id);
    try {
      await reservationService.cancel(id);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'Cancelled' } : r)),
      );
    } catch {
      // ignore
    } finally {
      setCancelling(null);
    }
  }

  const locationName = (id: number) =>
    locations.find((l) => l.id === id)?.name ?? `Location #${id}`;

  const STATUS_FILTERS = ['all', 'confirmed', 'cancelled'];

  const filtered = filterStatus === 'all'
    ? reservations
    : reservations.filter((r) => r.status.toLowerCase() === filterStatus);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Reservations</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterRow}>
          {STATUS_FILTERS.map((s) => (
            <Pressable
              key={s}
              style={[styles.filterPill, filterStatus === s && styles.filterPillActive]}
              onPress={() => setFilterStatus(s)}>
              <Text style={[styles.filterPillText, filterStatus === s && styles.filterPillTextActive]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {loading ? (
        <View style={styles.card}>
          <Text style={styles.cardCopy}>Loading reservations...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardCopy}>No reservations found.</Text>
        </View>
      ) : (
        filtered.map((res) => (
          <View key={res.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>#{res.id} - {locationName(res.locationId)}</Text>
              <Text style={[
                styles.statusBadge,
                res.status.toLowerCase() === 'confirmed' && styles.statusConfirmed,
                res.status.toLowerCase() === 'cancelled' && styles.statusCancelled,
              ]}>
                {res.status}
              </Text>
            </View>
            <Text style={styles.cardCopy}>
              {new Date(res.reservationTime).toLocaleString()} - Party of {res.partySize}
            </Text>
            <Text style={styles.metaText}>User #{res.userId}</Text>
            {res.status.toLowerCase() !== 'cancelled' && (
              <Pressable
                style={[styles.cancelButton, cancelling === res.id && styles.buttonDisabled]}
                onPress={() => handleCancel(res.id)}
                disabled={cancelling === res.id}>
                <Text style={styles.cancelButtonText}>
                  {cancelling === res.id ? 'Cancelling...' : 'Cancel reservation'}
                </Text>
              </Pressable>
            )}
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
  card: { gap: 8, borderRadius: 22, backgroundColor: '#fffaf4', padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1f1a17', flex: 1 },
  cardCopy: { color: '#6c5b4d' },
  metaText: { fontSize: 12, color: '#8f7d70' },
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterPill: { borderRadius: 999, backgroundColor: '#fffaf4', paddingHorizontal: 14, paddingVertical: 8 },
  filterPillActive: { backgroundColor: '#1d2d3c' },
  filterPillText: { fontWeight: '600', color: '#1f1a17', fontSize: 13 },
  filterPillTextActive: { color: '#fffaf4' },
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
    backgroundColor: '#ffcdd2',
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 4,
  },
  cancelButtonText: { color: '#b33030', fontWeight: '700', fontSize: 13 },
  buttonDisabled: { opacity: 0.5 },
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#1d2d3c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 4,
  },
  primaryButtonText: { color: '#fffaf4', fontWeight: '700' },
});
