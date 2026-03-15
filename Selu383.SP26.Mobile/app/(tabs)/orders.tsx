import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { getOrders, Order } from "@/hooks/services/orderService";

const AMBER = "#C47D2B";
const BROWN = "#3C1F0F";
const CREAM = "#FAF7F2";

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch(() => setError("Could not load orders. Please log in."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={AMBER} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push("/Auth/login")}>
            <Text style={styles.loginBtnText}>Log In</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No orders yet.</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push("/(tabs)/menu")}>
            <Text style={styles.loginBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.orderId}>Order #{item.id}</Text>
                <View style={[styles.badge, { backgroundColor: item.status === "Completed" ? "#4CAF50" : AMBER }]}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.cardSub}>{item.orderType}</Text>
              <Text style={styles.cardTotal}>Total: ${item.total?.toFixed(2) ?? "0.00"}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { padding: 16, paddingTop: 56, backgroundColor: BROWN },
  title: { fontSize: 24, fontWeight: "700", color: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { color: "#666", fontSize: 16, marginBottom: 16, textAlign: "center" },
  emptyText: { color: "#666", fontSize: 16, marginBottom: 16 },
  loginBtn: { backgroundColor: AMBER, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 25 },
  loginBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10, elevation: 1 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: 16, fontWeight: "700", color: BROWN },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  cardSub: { color: "#666", marginTop: 4 },
  cardTotal: { fontSize: 15, fontWeight: "700", color: AMBER, marginTop: 6 },
});
