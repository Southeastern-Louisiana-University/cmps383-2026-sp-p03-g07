import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { menuService } from '@/services/menuService';
import { useAuth } from '@/store/authStore';
import type { MenuItem } from '@/types/app';

export default function AdminMenuManagement() {
  const { user } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void menuService.getMenu()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (!user || (!user.roles.includes('Admin') && !user.roles.includes('Manager'))) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Menu management</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Access denied</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Go back</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(String(item.price));
    setEditDescription(item.description);
  }

  async function saveEdit(item: MenuItem) {
    setSaving(true);
    try {
      await fetch(`/api/menu/${item.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          name: editName,
          price: parseFloat(editPrice),
          description: editDescription,
        }),
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, name: editName, price: parseFloat(editPrice), description: editDescription }
            : i,
        ),
      );
      setEditingId(null);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability(item: MenuItem) {
    try {
      await fetch(`/api/menu/${item.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, isAvailable: !item.isAvailable }),
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i)),
      );
    } catch {
      // ignore
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Menu management</Text>

      {loading ? (
        <View style={styles.card}>
          <Text style={styles.cardCopy}>Loading menu...</Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id} style={styles.card}>
            {editingId === item.id ? (
              <>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Item name"
                  placeholderTextColor="#8f7d70"
                />
                <TextInput
                  style={styles.input}
                  value={editPrice}
                  onChangeText={setEditPrice}
                  placeholder="Price"
                  placeholderTextColor="#8f7d70"
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  placeholder="Description"
                  placeholderTextColor="#8f7d70"
                  multiline
                  numberOfLines={3}
                />
                <View style={styles.buttonRow}>
                  <Pressable
                    style={[styles.primaryButton, saving && styles.buttonDisabled]}
                    onPress={() => saveEdit(item)}
                    disabled={saving}>
                    <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
                  </Pressable>
                  <Pressable style={styles.secondaryButton} onPress={() => setEditingId(null)}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={[styles.availabilityBadge, !item.isAvailable && styles.unavailableBadge]}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </Text>
                </View>
                <Text style={styles.cardCopy}>{item.description}</Text>
                <Text style={styles.priceText}>${item.price.toFixed(2)} • {item.category}</Text>
                <View style={styles.buttonRow}>
                  <Pressable style={styles.editButton} onPress={() => startEdit(item)}>
                    <Text style={styles.editButtonText}>Edit</Text>
                  </Pressable>
                  <Pressable style={styles.toggleButton} onPress={() => toggleAvailability(item)}>
                    <Text style={styles.toggleButtonText}>
                      {item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                    </Text>
                  </Pressable>
                </View>
              </>
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
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17', flex: 1 },
  cardCopy: { color: '#6c5b4d' },
  priceText: { color: '#8a5124', fontWeight: '700' },
  input: {
    borderRadius: 14,
    backgroundColor: '#f6efe7',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#1f1a17',
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  buttonRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  primaryButton: {
    borderRadius: 999,
    backgroundColor: '#1d2d3c',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  primaryButtonText: { color: '#fffaf4', fontWeight: '700', fontSize: 13 },
  secondaryButton: {
    borderRadius: 999,
    backgroundColor: '#f6efe7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1d2d3c',
  },
  secondaryButtonText: { color: '#1d2d3c', fontWeight: '700', fontSize: 13 },
  buttonDisabled: { opacity: 0.6 },
  editButton: {
    borderRadius: 999,
    backgroundColor: '#f6efe7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#1d2d3c',
  },
  editButtonText: { color: '#1d2d3c', fontWeight: '600', fontSize: 13 },
  toggleButton: {
    borderRadius: 999,
    backgroundColor: '#f6efe7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#8a5124',
  },
  toggleButtonText: { color: '#8a5124', fontWeight: '600', fontSize: 13 },
  availabilityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#c8e6c9',
    fontSize: 12,
    fontWeight: '700',
    color: '#1a6b2a',
  },
  unavailableBadge: { backgroundColor: '#ffcdd2', color: '#b33030' },
});
