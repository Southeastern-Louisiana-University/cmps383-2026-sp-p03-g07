import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { locationService } from '@/services/locationService';
import type { Location } from '@/types/app';

const LOCATION_DETAILS: Record<string, { phone: string; hours: string }> = {
  Hammond: { phone: '(985) 555-0101', hours: 'Mon-Fri 6 AM - 9 PM' },
  'New York': { phone: '(212) 555-0102', hours: 'Mon-Fri 7 AM - 9 PM' },
  'New Orleans': { phone: '(504) 555-0103', hours: 'Mon-Fri 7 AM - 8 PM' },
};

export default function StoreFinderScreen() {
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    void locationService.getLocations().then(setLocations);
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Store finder</Text>
      {locations.map((location) => (
        <Pressable
          key={location.id}
          style={styles.card}
          onPress={() => void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`)}>
          <View style={styles.cardHeader}>
            <View style={styles.locationBadge}>
              <Text style={styles.locationBadgeText}>Lions</Text>
            </View>
            <Text style={styles.linkText}>Directions</Text>
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{location.name}</Text>
            <Text style={styles.cardCopy}>{location.address}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaChip}>{location.tableCount} seats</Text>
              <Text style={styles.metaChip}>Open today</Text>
            </View>
            <Text style={styles.cardCopy}>{LOCATION_DETAILS[location.name]?.phone ?? '(555) 555-0100'}</Text>
            <Text style={styles.cardCopy}>{LOCATION_DETAILS[location.name]?.hours ?? 'Pilot location hours available in app'}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6efe7' },
  content: { gap: 14, padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#1f1a17' },
  card: {
    borderRadius: 22,
    backgroundColor: '#fffaf4',
    padding: 16,
    minHeight: 190,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationBadge: {
    borderRadius: 999,
    backgroundColor: '#ece4c8',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  locationBadgeText: {
    color: '#7d6220',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardBody: { flex: 1, gap: 6 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  cardCopy: { color: '#6c5b4d', lineHeight: 20 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 2 },
  metaChip: {
    color: '#8a5124',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  linkText: { color: '#8a5124', fontWeight: '700' },
});
