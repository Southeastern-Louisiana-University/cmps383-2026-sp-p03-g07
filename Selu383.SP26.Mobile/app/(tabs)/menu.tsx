import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { resolveApiAssetUrl } from '@/constants/api';
import { menuService } from '@/services/menuService';
import { locationService } from '@/services/locationService';
import { useCart } from '@/store/cartStore';
import type { Location, MenuItem } from '@/types/app';

export default function MenuScreen() {
  const { addItem } = useCart();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    void Promise.all([
      locationService.getLocations(),
      menuService.getCategories(),
    ]).then(([locs, cats]) => {
      const limited = locs.slice(0, 3);
      setLocations(limited);
      if (limited.length > 0) setSelectedLocation(limited[0].id);
      setCategories(['All', ...cats]);
    });
  }, []);

  useEffect(() => {
    void menuService.getMenu({ locationId: selectedLocation ?? undefined }).then(setMenuItems);
  }, [selectedLocation]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch && item.isAvailable;
    });
  }, [menuItems, selectedCategory, search]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Menu</Text>

      {/* Location picker */}
      {locations.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.pillRow}>
            {locations.map((loc) => (
              <Pressable
                key={loc.id}
                style={[styles.pill, selectedLocation === loc.id && styles.pillActive]}
                onPress={() => setSelectedLocation(loc.id)}>
                <Text style={[styles.pillText, selectedLocation === loc.id && styles.pillTextActive]}>
                  {loc.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Search */}
      <TextInput
        style={styles.input}
        placeholder="Search the menu"
        placeholderTextColor="#8f7d70"
        value={search}
        onChangeText={setSearch}
      />

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.pillRow}>
          {categories.map((cat) => (
            <Pressable
              key={cat}
              style={[styles.pill, selectedCategory === cat && styles.pillActive]}
              onPress={() => setSelectedCategory(cat)}>
              <Text style={[styles.pillText, selectedCategory === cat && styles.pillTextActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Items */}
      {filteredItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No items found.</Text>
        </View>
      ) : (
        filteredItems.map((item) => (
          <View key={item.id} style={styles.card}>
            {!!item.imageUrl && (
              <Image
                source={{ uri: resolveApiAssetUrl(item.imageUrl) }}
                style={styles.itemImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.cardBody}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardCopy} numberOfLines={2}>{item.description}</Text>
                  <Text style={styles.metaText}>
                    {item.category} • {item.preparationTag || 'Fresh'} • {item.calories} cal
                  </Text>
                </View>
                <Text style={styles.price}>${item.price.toFixed(2)}</Text>
              </View>
              <Pressable
                style={styles.primaryButton}
                onPress={() => {
                  addItem(item);
                  router.push('/cart');
                }}>
                <Text style={styles.primaryButtonText}>Add to cart</Text>
              </Pressable>
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
  input: {
    borderRadius: 18,
    backgroundColor: '#fffaf4',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#1f1a17',
  },
  pillRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  pill: {
    borderRadius: 999,
    backgroundColor: '#fffaf4',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillActive: { backgroundColor: '#4a6741' },
  pillText: { fontWeight: '600', color: '#1f1a17', fontSize: 13 },
  pillTextActive: { color: '#fff' },
  card: {
    borderRadius: 22,
    backgroundColor: '#fffaf4',
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: 160,
  },
  cardBody: { gap: 12, padding: 16 },
  row: { flexDirection: 'row', gap: 12 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  cardCopy: { color: '#6c5b4d', marginTop: 4 },
  metaText: { color: '#8a5124', marginTop: 6, fontSize: 12 },
  price: { color: '#8a5124', fontWeight: '700', fontSize: 16 },
  primaryButton: {
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: '#4a6741',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  emptyCard: { borderRadius: 22, backgroundColor: '#fffaf4', padding: 24, alignItems: 'center' },
  emptyText: { color: '#8f7d70', fontSize: 15 },
});
