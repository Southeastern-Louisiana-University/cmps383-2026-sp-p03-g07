import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { menuService } from '@/services/menuService';
import { useCart } from '@/store/cartStore';
import type { MenuItem } from '@/types/app';

export default function MenuScreen() {
  const { addItem } = useCart();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    void menuService.getMenu().then(setMenuItems);
  }, []);

  const filteredItems = useMemo(
    () =>
      menuItems.filter((item) =>
        `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [menuItems, search],
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Menu</Text>
      <TextInput
        style={styles.input}
        placeholder="Search the menu"
        placeholderTextColor="#8f7d70"
        value={search}
        onChangeText={setSearch}
      />
      {filteredItems.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardCopy}>{item.description}</Text>
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
      ))}
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
  card: {
    gap: 12,
    borderRadius: 22,
    backgroundColor: '#fffaf4',
    padding: 16,
  },
  row: { flexDirection: 'row', gap: 12 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  cardCopy: { color: '#6c5b4d', marginTop: 6 },
  metaText: { color: '#8a5124', marginTop: 8 },
  price: { color: '#8a5124', fontWeight: '700' },
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#1d2d3c',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: { color: '#fffaf4', fontWeight: '700' },
});
