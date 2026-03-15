import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { getMenuItems, MenuItem } from "@/hooks/services/menuService";

const AMBER = "#C47D2B";
const BROWN = "#3C1F0F";
const CREAM = "#FAF7F2";

type CartItem = { item: MenuItem; qty: number };

export default function MenuScreen() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    getMenuItems()
      .then(setItems)
      .catch(() => setError("Failed to load menu."))
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) return prev.map((c) => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { item, qty: 1 }];
    });
  };

  const categories = [...new Set(items.map((i) => i.category))];
  const filtered = items.filter(
    (i) => i.isAvailable && i.name.toLowerCase().includes(search.toLowerCase())
  );
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={AMBER} />;
  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
        {cartCount > 0 && (
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => router.push({ pathname: "/cart", params: { cart: JSON.stringify(cart) } })}
          >
            <Text style={styles.cartBtnText}>Cart ({cartCount})</Text>
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search..."
        placeholderTextColor="#aaa"
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={categories}
        keyExtractor={(c) => c}
        renderItem={({ item: cat }) => {
          const catItems = filtered.filter((i) => i.category === cat);
          if (!catItems.length) return null;
          return (
            <View style={styles.section}>
              <Text style={styles.category}>{cat}</Text>
              {catItems.map((menuItem) => (
                <View key={menuItem.id} style={styles.card}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.itemName}>{menuItem.name}</Text>
                    <Text style={styles.itemDesc} numberOfLines={2}>{menuItem.description}</Text>
                    <Text style={styles.itemPrice}>${menuItem.price.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(menuItem)}>
                    <Text style={styles.addBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingTop: 56, backgroundColor: BROWN },
  title: { fontSize: 24, fontWeight: "700", color: "#fff" },
  cartBtn: { backgroundColor: AMBER, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  cartBtnText: { color: "#fff", fontWeight: "600" },
  search: { margin: 12, padding: 10, borderRadius: 10, backgroundColor: "#fff", borderColor: "#ddd", borderWidth: 1, fontSize: 15 },
  section: { marginBottom: 8, paddingHorizontal: 12 },
  category: { fontSize: 18, fontWeight: "700", color: BROWN, marginTop: 12, marginBottom: 8 },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 8, alignItems: "center", elevation: 1 },
  cardInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: "600", color: BROWN },
  itemDesc: { fontSize: 13, color: "#666", marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: "700", color: AMBER, marginTop: 4 },
  addBtn: { backgroundColor: AMBER, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: "#fff", fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { color: "red" },
});
