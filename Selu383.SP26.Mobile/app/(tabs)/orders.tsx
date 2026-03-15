import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { getOrders } from "@/hooks/services/orderService";
import type { Order } from "@/hooks/services/orderService";
import { getMe } from "@/hooks/services/authService";

const AMBER = "#C47D2B";
const BROWN = "#3C1F0F";
const CREAM = "#FAF7F2";

const STATUS_COLOR: Record<string, string> = {
  Received: "#3498db",
  Preparing: "#f39c12",
  Ready: "#27ae60",
  Completed: "#95a5a6",
  Cancelled: "#e74c3c",
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const prevStatusMap = useRef<Record<number, string>>({});
  const router = useRouter();

  const checkAuth = async () => {
    const u = await getMe().catch(() => null);
    setIsLoggedIn(!!u);
    return !!u;
  };

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getOrders();
      const sorted = [...data].reverse();

      // Check for status changes and alert the user
      sorted.forEach((order) => {
        const prev = prevStatusMap.current[order.id];
        if (prev && prev !== order.status) {
          if (order.status === "Ready") {
            Alert.alert("Order Ready!", `Order #${order.id} is ready for pickup!`);
          } else if (order.status === "Preparing") {
            Alert.alert("Order Update", `Order #${order.id} is now being prepared.`);
          } else if (order.status === "Completed") {
            Alert.alert("Order Complete", `Order #${order.id} has been completed. Enjoy!`);
          }
        }
        prevStatusMap.current[order.id] = order.status;
      });

      setOrders(sorted);
      setIsLoggedIn(true);
    } catch {
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch on tab focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
      // Poll every 8 seconds while tab is focused
      const interval = setInterval(() => fetchOrders(true), 8000);
      return () => clearInterval(interval);
    }, [fetchOrders])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(true);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={AMBER} />;

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Orders</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Log in to see your orders.</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/Auth/login")}>
            <Text style={styles.actionBtnText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <Text style={styles.subtitle}>Auto-updates every 8s</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No orders yet.</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(tabs)/menu")}>
            <Text style={styles.actionBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={{ padding: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AMBER} />}
          renderItem={({ item }) => (
            <View style={[styles.card, item.status === "Ready" && styles.cardReady]}>
              <View style={styles.cardRow}>
                <Text style={styles.orderId}>Order #{item.id}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLOR[item.status] ?? AMBER }]}>
                  <Text style={styles.badgeText}>{item.status}</Text>
                </View>
              </View>

              <Text style={styles.cardSub}>
                {item.orderType}{item.tableNumber ? ` - Table ${item.tableNumber}` : ""}
              </Text>

              {item.note ? (
                <Text style={styles.noteText}>Note: {item.note}</Text>
              ) : null}

              {item.items && item.items.length > 0 && (
                <View style={styles.itemsList}>
                  {item.items.map((i, idx) => (
                    <Text key={idx} style={styles.itemText}>{i.name} x{i.quantity}</Text>
                  ))}
                </View>
              )}

              <Text style={styles.cardTotal}>${item.total?.toFixed(2) ?? "0.00"}</Text>

              {item.status === "Ready" && (
                <View style={styles.readyBanner}>
                  <Text style={styles.readyBannerText}>Your order is ready for pickup!</Text>
                </View>
              )}
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
  subtitle: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  emptyText: { color: "#666", fontSize: 16, marginBottom: 16, textAlign: "center" },
  actionBtn: { backgroundColor: AMBER, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 25 },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10, elevation: 1, borderLeftWidth: 4, borderLeftColor: "#ddd" },
  cardReady: { borderLeftColor: "#27ae60", backgroundColor: "#f0fdf4" },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: 16, fontWeight: "700", color: BROWN },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  cardSub: { color: "#666", marginTop: 4, fontSize: 13 },
  noteText: { color: "#7b4f24", fontSize: 13, marginTop: 4, fontStyle: "italic" },
  itemsList: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  itemText: { color: "#555", fontSize: 13, marginBottom: 2 },
  cardTotal: { fontSize: 15, fontWeight: "700", color: AMBER, marginTop: 8 },
  readyBanner: { backgroundColor: "#dcfce7", borderRadius: 8, padding: 8, marginTop: 8 },
  readyBannerText: { color: "#15803d", fontWeight: "700", textAlign: "center", fontSize: 13 },
});
