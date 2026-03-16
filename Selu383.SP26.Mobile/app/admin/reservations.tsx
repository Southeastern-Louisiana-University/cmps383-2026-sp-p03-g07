import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { reservationService } from '@/services/reservationService';
import { useAuth } from '@/store/authStore';
import type { Reservation } from '@/types/app';

export default function AdminReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void reservationService.getReservations()
      .then(setReservations)
      .catch(() => setReservations([]))
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Reservations</Text>

      {loading ? (
        <View style={styles.card}>
          <Text style={styles.cardCopy}>Loading reservations...</Text>
        </View>
      ) : reservations.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardCopy}>No reservations found.</Text>
        </View>
      ) : (
        reservations.map((res) => (
          <View key={res.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Reservation #{res.id}</Text>
              <Text style={[styles.statusBadge,
                res.status.toLowerCase() === 'confirmed' && styles.statusConfirmed,
                res.status.toLowerCase() === 'cancelled' && styles.statusCancelled,
              ]}>
                {res.status}
              </Text>
            </View>
            <Text style={styles.cardCopy}>
              {new Date(res.reservationTime).toLocaleString()}
            </Text>
            <Text style={styles.cardCopy}>Party of {res.partySize}</Text>
            <Text style={styles.metaText}>User #{res.userId} • Location #{res.locationId}</Text>
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
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  cardCopy: { color: '#6c5b4d' },
  metaText: { fontSize: 12, color: '#8f7d70' },
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
