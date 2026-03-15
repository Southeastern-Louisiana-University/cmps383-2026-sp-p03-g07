import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function FavoritesScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Favorites</Text>
      </View>
      <View style={styles.center}>
        <Text style={styles.empty}>No favorites yet.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push("/(tabs)/menu")}>
          <Text style={styles.btnText}>Browse Menu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF7F2" },
  header: { padding: 16, paddingTop: 56, backgroundColor: "#3C1F0F", flexDirection: "row", alignItems: "center", gap: 16 },
  back: { color: "#fff", fontSize: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  empty: { color: "#666", fontSize: 16 },
  btn: { backgroundColor: "#C47D2B", paddingHorizontal: 28, paddingVertical: 12, borderRadius: 25 },
  btnText: { color: "#fff", fontWeight: "700" },
});
