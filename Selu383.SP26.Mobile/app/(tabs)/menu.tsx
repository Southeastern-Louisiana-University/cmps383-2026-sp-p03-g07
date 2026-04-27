import { useEffect, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { resolveApiAssetUrl } from '@/constants/api';
import { menuService } from '@/services/menuService';
import { locationService } from '@/services/locationService';
import { useCart } from '@/store/cartStore';
import type { Location, MenuCustomization, MenuItem } from '@/types/app';

type CustomizationGroup = {
  groupName: string;
  options: MenuCustomization[];
  sortOrder: number;
};

function roundToCents(value: number) {
  return Math.round(value * 100) / 100;
}

function isShotOption(option: MenuCustomization) {
  return /\bshot\b/i.test(option.optionName);
}

function isSingleSelectGroup(groupName: string) {
  const normalized = groupName.trim().toLowerCase();
  return normalized === 'milk' || normalized === 'sweetener' || normalized === 'ice';
}

function buildCustomizationLabel(option: MenuCustomization, quantity: number | null) {
  if (!quantity || quantity <= 0) return option.optionName;
  if (quantity === 1) return option.optionName;
  return `${option.optionName} x${quantity}`;
}

function groupCustomizations(customizations: MenuCustomization[]): CustomizationGroup[] {
  const groups = new Map<string, MenuCustomization[]>();

  customizations.forEach((customization) => {
    const key = customization.groupName.trim() || 'Options';
    const current = groups.get(key);
    if (current) {
      current.push(customization);
      return;
    }
    groups.set(key, [customization]);
  });

  return [...groups.entries()]
    .map(([groupName, options]) => ({
      groupName,
      options: [...options].sort(
        (left, right) => left.sortOrder - right.sortOrder || left.optionName.localeCompare(right.optionName),
      ),
      sortOrder: Math.min(...options.map((option) => option.sortOrder ?? 0)),
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder || left.groupName.localeCompare(right.groupName));
}

type MenuCustomizationModalProps = {
  item: MenuItem;
  onAddToCart: (customizations: string, unitPrice: number) => void;
  onClose: () => void;
};

function MenuCustomizationModal({ item, onAddToCart, onClose }: MenuCustomizationModalProps) {
  const groups = useMemo(() => groupCustomizations(item.customizations ?? []), [item.customizations]);

  const defaultSelectedIds = useMemo(() => {
    return new Set(
      (item.customizations ?? [])
        .filter((option) => option.isDefault && !isShotOption(option))
        .map((option) => option.id),
    );
  }, [item.customizations]);

  const defaultShotQuantities = useMemo(() => {
    const quantities: Record<number, number> = {};
    (item.customizations ?? []).forEach((option) => {
      if (!isShotOption(option)) return;
      quantities[option.id] = option.isDefault ? 1 : 0;
    });
    return quantities;
  }, [item.customizations]);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set(defaultSelectedIds));
  const [shotQuantities, setShotQuantities] = useState<Record<number, number>>(() => ({ ...defaultShotQuantities }));

  useEffect(() => {
    setSelectedIds(new Set(defaultSelectedIds));
    setShotQuantities({ ...defaultShotQuantities });
  }, [defaultSelectedIds, defaultShotQuantities, item.id]);

  const { customizationsLabel, extraCost } = useMemo(() => {
    const selectedOptions = (item.customizations ?? [])
      .filter((option) => selectedIds.has(option.id))
      .sort((left, right) => left.sortOrder - right.sortOrder || left.optionName.localeCompare(right.optionName));

    const selectedWithQuantities: Array<{ option: MenuCustomization; quantity: number | null }> = [
      ...selectedOptions.map((option) => ({ option, quantity: null })),
    ];

    (item.customizations ?? [])
      .filter((option) => isShotOption(option))
      .sort((left, right) => left.sortOrder - right.sortOrder || left.optionName.localeCompare(right.optionName))
      .forEach((option) => {
        const quantity = shotQuantities[option.id] ?? 0;
        if (quantity > 0) {
          selectedWithQuantities.push({ option, quantity });
        }
      });

    const label = selectedWithQuantities
      .map(({ option, quantity }) => buildCustomizationLabel(option, quantity))
      .join(', ');

    const extras = roundToCents(
      selectedOptions.reduce((sum, option) => sum + (option.additionalPrice ?? 0), 0)
        + (item.customizations ?? [])
          .filter((option) => isShotOption(option))
          .reduce((sum, option) => sum + (option.additionalPrice ?? 0) * (shotQuantities[option.id] ?? 0), 0),
    );

    return { customizationsLabel: label, extraCost: extras };
  }, [item.customizations, selectedIds, shotQuantities]);

  const unitPrice = useMemo(() => roundToCents(item.price + extraCost), [extraCost, item.price]);

  function toggleMultiSelect(optionId: number) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }
      return next;
    });
  }

  function toggleSingleSelect(groupOptionIds: number[], nextId: number) {
    const hasDefaultInGroup = (item.customizations ?? []).some(
      (option) => groupOptionIds.includes(option.id) && option.isDefault,
    );

    setSelectedIds((current) => {
      const next = new Set(current);
      const isAlreadySelected = next.has(nextId);

      groupOptionIds.forEach((id) => next.delete(id));

      if (!isAlreadySelected) {
        next.add(nextId);
      } else if (hasDefaultInGroup) {
        const defaultId = (item.customizations ?? []).find(
          (option) => groupOptionIds.includes(option.id) && option.isDefault,
        )?.id;
        if (defaultId !== undefined) {
          next.add(defaultId);
        }
      }

      return next;
    });
  }

  function adjustShot(optionId: number, delta: number) {
    setShotQuantities((current) => {
      const next = { ...current };
      next[optionId] = Math.max(0, (next[optionId] ?? 0) + delta);
      return next;
    });
  }

  function resetToDefault() {
    setSelectedIds(new Set(defaultSelectedIds));
    setShotQuantities({ ...defaultShotQuantities });
  }

  function addToCart() {
    onAddToCart(customizationsLabel, unitPrice);
    onClose();
  }

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalKicker}>Customize</Text>
              <Text style={styles.modalTitle}>{item.name}</Text>
            </View>
            <Pressable style={styles.modalClose} onPress={onClose}>
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>

          {item.description ? <Text style={styles.modalDescription}>{item.description}</Text> : null}

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
            showsVerticalScrollIndicator={false}
          >
            {groups.length === 0 ? (
              <Text style={styles.modalEmpty}>No customizations available for this item.</Text>
            ) : (
              groups.map((group) => {
                const shotOptions = group.options.filter((option) => isShotOption(option));
                const standardOptions = group.options.filter((option) => !isShotOption(option));
                const isSingleSelect = isSingleSelectGroup(group.groupName);
                const groupOptionIds = standardOptions.map((option) => option.id);

                return (
                  <View key={group.groupName} style={styles.modalGroup}>
                    <View style={styles.modalGroupHeader}>
                      <Text style={styles.modalGroupTitle}>{group.groupName}</Text>
                      <Text style={styles.modalGroupHint}>{isSingleSelect ? 'Pick one' : 'Add or remove'}</Text>
                    </View>

                    {standardOptions.length > 0 ? (
                      <View style={styles.modalChipGrid}>
                        {standardOptions.map((option) => {
                          const isSelected = selectedIds.has(option.id);
                          const priceTag =
                            option.additionalPrice > 0
                              ? `+$${option.additionalPrice.toFixed(2)}`
                              : option.additionalPrice < 0
                                ? `-$${Math.abs(option.additionalPrice).toFixed(2)}`
                                : null;

                          return (
                            <Pressable
                              key={option.id}
                              style={[styles.modalChip, isSelected && styles.modalChipSelected]}
                              onPress={() =>
                                isSingleSelect
                                  ? toggleSingleSelect(groupOptionIds, option.id)
                                  : toggleMultiSelect(option.id)
                              }
                            >
                              <Text style={[styles.modalChipText, isSelected && styles.modalChipTextSelected]}>
                                {option.optionName}
                              </Text>
                              {priceTag ? (
                                <Text style={[styles.modalChipPrice, isSelected && styles.modalChipPriceSelected]}>
                                  {priceTag}
                                </Text>
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}

                    {shotOptions.length > 0 ? (
                      <View style={styles.modalShotList}>
                        {shotOptions.map((option) => {
                          const quantity = shotQuantities[option.id] ?? 0;
                          const priceTag =
                            option.additionalPrice > 0 ? `+$${option.additionalPrice.toFixed(2)}/ea` : null;

                          return (
                            <View key={option.id} style={styles.modalShotRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.modalShotName}>{option.optionName}</Text>
                                {priceTag ? <Text style={styles.modalShotPrice}>{priceTag}</Text> : null}
                              </View>
                              <View style={styles.modalStepper}>
                                <Pressable
                                  style={[styles.modalStepperButton, quantity === 0 && styles.modalStepperButtonDisabled]}
                                  disabled={quantity === 0}
                                  onPress={() => adjustShot(option.id, -1)}
                                >
                                  <Text style={styles.modalStepperButtonText}>-</Text>
                                </Pressable>
                                <Text style={styles.modalStepperValue}>{quantity}</Text>
                                <Pressable style={styles.modalStepperButton} onPress={() => adjustShot(option.id, 1)}>
                                  <Text style={styles.modalStepperButtonText}>+</Text>
                                </Pressable>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <View style={styles.modalSummary}>
              <Text style={styles.modalSummaryText} numberOfLines={2}>
                {customizationsLabel || 'Standard build'}
              </Text>
              <Text style={styles.modalSummaryPrice}>${unitPrice.toFixed(2)}</Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.modalSecondaryButton} onPress={resetToDefault}>
                <Text style={styles.modalSecondaryButtonText}>Reset</Text>
              </Pressable>
              <Pressable style={styles.modalPrimaryButton} onPress={addToCart}>
                <Text style={styles.modalPrimaryButtonText}>Add to cart</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    void Promise.all([
      locationService.getLocations(),
      menuService.getCategories(),
    ]).then(([locs, cats]) => {
      setLocations(locs);
      if (locs.length > 0) setSelectedLocation(locs[0].id);
      setCategories(['All', ...cats.filter((cat) => cat.trim().toLowerCase() !== 'gifts')]);
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
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                contentFit="cover"
                transition={180}
                cachePolicy="memory-disk"
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

              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.primaryButton, styles.actionButton]}
                  onPress={() => setCustomizingItem(item)}
                >
                  <Text style={styles.primaryButtonText}>Add</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))
      )}
      </ScrollView>

      {customizingItem ? (
        <MenuCustomizationModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
          onAddToCart={(customizations, unitPrice) => addItem(customizingItem, customizations, unitPrice)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6efe7' },
  scroll: { flex: 1 },
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
  actionRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  actionButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  primaryButton: {
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: '#4a6741',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  secondaryButton: {
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: '#ead7c5',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  secondaryButtonText: { color: '#40261a', fontWeight: '800', textAlign: 'center' },
  emptyCard: { borderRadius: 22, backgroundColor: '#fffaf4', padding: 24, alignItems: 'center' },
  emptyText: { color: '#8f7d70', fontSize: 15 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 9, 0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  modalSheet: {
    maxHeight: '90%',
    borderRadius: 26,
    backgroundColor: '#fffaf4',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(31, 26, 23, 0.12)',
  },
  modalKicker: { color: '#8a5124', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  modalTitle: { color: '#1f1a17', fontSize: 18, fontWeight: '800', marginTop: 2 },
  modalClose: { borderRadius: 999, backgroundColor: '#f6efe7', paddingHorizontal: 12, paddingVertical: 8 },
  modalCloseText: { color: '#1f1a17', fontWeight: '800' },
  modalDescription: { paddingHorizontal: 16, paddingBottom: 10, color: '#6c5b4d' },
  modalBody: { flexGrow: 0 },
  modalBodyContent: { paddingHorizontal: 16, paddingBottom: 14, gap: 14 },
  modalEmpty: { color: '#8f7d70', paddingVertical: 10 },
  modalGroup: { gap: 10 },
  modalGroupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  modalGroupTitle: { color: '#1f1a17', fontWeight: '800', fontSize: 15 },
  modalGroupHint: { color: '#8f7d70', fontSize: 12, fontWeight: '700' },
  modalChipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  modalChip: {
    borderRadius: 999,
    backgroundColor: '#f6efe7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalChipSelected: { backgroundColor: '#4a6741' },
  modalChipText: { color: '#1f1a17', fontWeight: '800' },
  modalChipTextSelected: { color: '#fffaf4' },
  modalChipPrice: { color: '#8a5124', fontWeight: '800' },
  modalChipPriceSelected: { color: '#fffaf4' },
  modalShotList: { gap: 10 },
  modalShotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    backgroundColor: '#f6efe7',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalShotName: { color: '#1f1a17', fontWeight: '800' },
  modalShotPrice: { color: '#8a5124', fontWeight: '800', marginTop: 2 },
  modalStepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalStepperButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#1d2d3c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalStepperButtonDisabled: { opacity: 0.4 },
  modalStepperButtonText: { color: '#fffaf4', fontWeight: '900', fontSize: 16 },
  modalStepperValue: { minWidth: 24, textAlign: 'center', color: '#1f1a17', fontWeight: '900' },
  modalFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(31, 26, 23, 0.12)',
    padding: 16,
    gap: 12,
  },
  modalSummary: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  modalSummaryText: { flex: 1, color: '#6c5b4d', fontWeight: '700' },
  modalSummaryPrice: { color: '#1f1a17', fontWeight: '900', fontSize: 18 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalSecondaryButton: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: '#ead7c5',
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSecondaryButtonText: { color: '#40261a', fontWeight: '900' },
  modalPrimaryButton: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: '#4a6741',
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalPrimaryButtonText: { color: '#fffaf4', fontWeight: '900' },
});
