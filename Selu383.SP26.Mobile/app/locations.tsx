import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { locationService } from '@/services/locationService';
import type { Location } from '@/types/app';

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
          <View>
            <Text style={styles.cardTitle}>{location.name}</Text>
            <Text style={styles.cardCopy}>{location.address}</Text>
            <Text style={styles.cardCopy}>{location.tableCount} seats • Open today</Text>
          </View>
          <Text style={styles.linkText}>Directions</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: 22,
    backgroundColor: '#fffaf4',
    padding: 16,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  cardCopy: { color: '#6c5b4d', marginTop: 4, maxWidth: 240 },
  linkText: { color: '#8a5124', fontWeight: '700' },
});
