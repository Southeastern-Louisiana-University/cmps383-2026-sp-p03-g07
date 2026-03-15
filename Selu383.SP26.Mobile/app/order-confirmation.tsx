import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function OrderConfirmationScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.icon}>✓</Text>
        <Text style={styles.title}>Order Confirmed!</Text>
        <Text style={styles.sub}>Your order is being prepared.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace("/(tabs)/orders")}>
          <Text style={styles.btnText}>View Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkBtn} onPress={() => router.replace("/(tabs)/menu")}>
          <Text style={styles.linkText}>Back to Menu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF7F2" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 28 },
  icon: { fontSize: 72, color: "#4CAF50", marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "800", color: "#3C1F0F", marginBottom: 8 },
  sub: { color: "#666", fontSize: 16, marginBottom: 32 },
  btn: { backgroundColor: "#C47D2B", paddingHorizontal: 40, paddingVertical: 14, borderRadius: 25, marginBottom: 12 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  linkBtn: { marginTop: 8 },
  linkText: { color: "#C47D2B", fontSize: 15 },
});
