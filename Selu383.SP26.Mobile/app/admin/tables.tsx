import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { locationService } from '@/services/locationService';
import { useAuth } from '@/store/authStore';
import type { Location } from '@/types/app';

export default function AdminTables() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void locationService.getLocations()
      .then(setLocations)
      .catch(() => setLocations([]))
      .finally(() => setLoading(false));
  }, []);

  if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Manager'))) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Tables</Text>
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
      <Text style={styles.title}>Tables</Text>

      {loading ? (
        <View style={styles.card}>
          <Text style={styles.cardCopy}>Loading locations...</Text>
        </View>
      ) : (
        locations.map((loc) => (
          <View key={loc.id} style={styles.card}>
            <Text style={styles.cardTitle}>{loc.name}</Text>
            <Text style={styles.cardCopy}>{loc.address}</Text>
            <Text style={styles.tableCount}>{loc.tableCount} tables</Text>
            <View style={styles.tableGrid}>
              {Array.from({ length: loc.tableCount }, (_, i) => (
                <View key={i} style={styles.tableCell}>
                  <Text style={styles.tableCellText}>{i + 1}</Text>
                </View>
              ))}
            </View>
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
  card: { gap: 10, borderRadius: 22, backgroundColor: '#fffaf4', padding: 16 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  cardCopy: { color: '#6c5b4d' },
  tableCount: { color: '#8a5124', fontWeight: '700' },
  tableGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  tableCell: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1d2d3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCellText: { color: '#fffaf4', fontWeight: '700' },
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
