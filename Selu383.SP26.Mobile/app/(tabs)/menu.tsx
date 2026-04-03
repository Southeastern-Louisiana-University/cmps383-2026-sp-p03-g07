import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { resolveApiAssetUrl } from '@/constants/api';
import { locationService } from '@/services/locationService';
import { menuService } from '@/services/menuService';
import { useCart } from '@/store/cartStore';
import type { Location, MenuItem } from '@/types/app';
import {
  calculateMenuItemPrice,
  getDefaultCustomizationSelection,
  groupMenuCustomizations,
  type MenuCustomizationSelection,
} from '@/utils/menuCustomization';

export default function MenuScreen() {
  const { addItem } = useCart();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
  const [selection, setSelection] = useState<MenuCustomizationSelection>({});

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
    void menuService.getMenu({ locationId: selectedLocation ?? undefined }).then((items) => {
      setMenuItems(items);
      setExpandedItemId(null);
      setSelection({});
    });
  }, [selectedLocation]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch && item.isAvailable;
    });
  }, [menuItems, selectedCategory, search]);

  function openCustomizer(item: MenuItem) {
    setExpandedItemId(item.id);
    setSelection(getDefaultCustomizationSelection(item));
  }

  function closeCustomizer() {
    setExpandedItemId(null);
    setSelection({});
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Menu</Text>

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

      <TextInput
        style={styles.input}
        placeholder="Search the menu"
        placeholderTextColor="#8f7d70"
        value={search}
        onChangeText={setSearch}
      />

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

      {filteredItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No items found.</Text>
        </View>
      ) : (
        filteredItems.map((item) => {
          const customizationGroups = groupMenuCustomizations(item.customizations);
          const isExpanded = expandedItemId === item.id;
          const activeSelection = isExpanded ? selection : getDefaultCustomizationSelection(item);
          const itemPrice = calculateMenuItemPrice(item, activeSelection);

          return (
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
                    {customizationGroups.length > 0 && (
                      <View style={styles.customizationMeta}>
                        <Text style={styles.customizationMetaText}>{customizationGroups.length} preset customizations</Text>
                        <Text style={styles.customizationMetaText}>No custom item builder</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.price}>${itemPrice.toFixed(2)}</Text>
                </View>

                {isExpanded && customizationGroups.length > 0 ? (
                  <View style={styles.customizer}>
                    {customizationGroups.map((group) => (
                      <View key={group.groupName} style={styles.customizerGroup}>
                        <View style={styles.customizerHeading}>
                          <Text style={styles.customizerTitle}>{group.groupName}</Text>
                          <Text style={styles.customizerHint}>Pick one</Text>
                        </View>
                        <View style={styles.optionWrap}>
                          {group.options.map((option) => {
                            const isSelected = selection[group.groupName] === option.optionName;
                            return (
                              <Pressable
                                key={`${group.groupName}-${option.id}`}
                                style={[styles.optionChip, isSelected && styles.optionChipActive]}
                                onPress={() => setSelection((currentSelection) => ({
                                  ...currentSelection,
                                  [group.groupName]: option.optionName,
                                }))}>
                                <Text style={[styles.optionChipText, isSelected && styles.optionChipTextActive]}>
                                  {option.optionName}
                                </Text>
                                <Text style={[styles.optionChipPrice, isSelected && styles.optionChipTextActive]}>
                                  {option.additionalPrice > 0 ? `+$${option.additionalPrice.toFixed(2)}` : 'Included'}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    ))}

                    <View style={styles.customizerActions}>
                      <Pressable
                        style={styles.primaryButton}
                        onPress={() => {
                          addItem(item, selection);
                          closeCustomizer();
                        }}>
                        <Text style={styles.primaryButtonText}>Add to cart</Text>
                      </Pressable>
                      <Pressable style={styles.secondaryButton} onPress={closeCustomizer}>
                        <Text style={styles.secondaryButtonText}>Cancel</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => {
                      if (customizationGroups.length > 0) {
                        openCustomizer(item);
                        return;
                      }

                      addItem(item);
                    }}>
                    <Text style={styles.primaryButtonText}>
                      {customizationGroups.length > 0 ? 'Customize' : 'Add to cart'}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })
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
    height: 180,
  },
  cardBody: { gap: 12, padding: 16 },
  row: { flexDirection: 'row', gap: 12 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  cardCopy: { color: '#6c5b4d', marginTop: 4 },
  metaText: { color: '#8a5124', marginTop: 6, fontSize: 12 },
  customizationMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 10 },
  customizationMetaText: { color: '#7f6a54', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  price: { color: '#8a5124', fontWeight: '700', fontSize: 16 },
  customizer: {
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#ece3d7',
    paddingTop: 12,
  },
  customizerGroup: { gap: 8 },
  customizerHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  customizerTitle: { fontWeight: '700', color: '#1f1a17' },
  customizerHint: { color: '#8f7d70', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    minWidth: 120,
    gap: 2,
    borderRadius: 16,
    backgroundColor: '#f6efe7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#eadcc9',
  },
  optionChipActive: {
    backgroundColor: '#4a6741',
    borderColor: '#4a6741',
  },
  optionChipText: { color: '#1f1a17', fontWeight: '700' },
  optionChipTextActive: { color: '#fffaf4' },
  optionChipPrice: { color: '#7f6a54', fontSize: 12 },
  customizerActions: { gap: 10 },
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#4a6741',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#fffaf4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#4a6741',
  },
  secondaryButtonText: { color: '#4a6741', fontWeight: '700' },
  emptyCard: { borderRadius: 22, backgroundColor: '#fffaf4', padding: 24, alignItems: 'center' },
  emptyText: { color: '#8f7d70', fontSize: 15 },
});
