import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function AdminDashboardScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
      </View>
      <View style={styles.grid}>
        {[
          { label: "Orders", route: "/admin/orders" },
          { label: "Menu", route: "/admin/menu-management" },
          { label: "Reservations", route: "/admin/reservations" },
          { label: "Tables", route: "/admin/tables" },
        ].map((item) => (
          <TouchableOpacity key={item.route} style={styles.card} onPress={() => router.push(item.route as any)}>
            <Text style={styles.cardText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF7F2" },
  header: { padding: 16, paddingTop: 56, backgroundColor: "#3C1F0F" },
  title: { fontSize: 24, fontWeight: "700", color: "#fff" },
  grid: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 12 },
  card: { width: "47%", backgroundColor: "#fff", borderRadius: 12, padding: 24, alignItems: "center", elevation: 1 },
  cardText: { fontSize: 16, fontWeight: "700", color: "#3C1F0F" },
});
