import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

const AMBER = "#C47D2B";
const BROWN = "#3C1F0F";
const CREAM = "#FAF7F2";

export default function CartScreen() {
  const { cart: cartParam } = useLocalSearchParams<{ cart: string }>();
  const router = useRouter();
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(cartParam || "[]"); } catch { return []; }
  });

  const remove = (id: number) => setCart((prev: any[]) => prev.filter((c: any) => c.item.id !== id));
  const updateQty = (id: number, delta: number) => {
    setCart((prev: any[]) =>
      prev
        .map((c: any) => c.item.id === id ? { ...c, qty: c.qty + delta } : c)
        .filter((c: any) => c.qty > 0)
    );
  };

  const total = cart.reduce((s: number, c: any) => s + c.item.price * c.qty, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your Cart</Text>
      </View>

      {cart.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.empty}>Your cart is empty.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.push("/(tabs)/menu")}>
            <Text style={styles.btnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(c: any) => String(c.item.id)}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item: c }: any) => (
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{c.item.name}</Text>
                  <Text style={styles.price}>${(c.item.price * c.qty).toFixed(2)}</Text>
                </View>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(c.item.id, -1)}>
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qty}>{c.qty}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(c.item.id, 1)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          <View style={styles.footer}>
            <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => router.push({ pathname: "/checkout", params: { cart: JSON.stringify(cart) } })}
            >
              <Text style={styles.checkoutBtnText}>Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { padding: 16, paddingTop: 56, backgroundColor: BROWN, flexDirection: "row", alignItems: "center", gap: 16 },
  back: { color: "#fff", fontSize: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  empty: { color: "#666", fontSize: 16 },
  btn: { backgroundColor: AMBER, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 25 },
  btnText: { color: "#fff", fontWeight: "700" },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10, alignItems: "center", elevation: 1 },
  name: { fontSize: 16, fontWeight: "600", color: BROWN },
  price: { color: AMBER, fontWeight: "700", marginTop: 4 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: AMBER, justifyContent: "center", alignItems: "center" },
  qtyBtnText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  qty: { fontSize: 16, fontWeight: "700", color: BROWN, minWidth: 20, textAlign: "center" },
  footer: { padding: 20, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#eee" },
  total: { fontSize: 20, fontWeight: "700", color: BROWN, marginBottom: 12 },
  checkoutBtn: { backgroundColor: AMBER, padding: 16, borderRadius: 25, alignItems: "center" },
  checkoutBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
