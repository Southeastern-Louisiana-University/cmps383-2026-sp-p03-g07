import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from "react-native";
import { useRouter } from "expo-router";

const AMBER = "#C47D2B";
const BROWN = "#3C1F0F";
const CREAM = "#FAF7F2";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView>
        <View style={styles.hero}>
          <Text style={styles.brand}>Caffeinated Lions</Text>
          <Text style={styles.tagline}>Great coffee. Every visit.</Text>
          <TouchableOpacity style={styles.heroBtn} onPress={() => router.push("/(tabs)/menu")}>
            <Text style={styles.heroBtnText}>Order Now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.grid}>
            <TouchableOpacity style={styles.tile} onPress={() => router.push("/(tabs)/menu")}>
              <Text style={styles.tileIcon}>☕</Text>
              <Text style={styles.tileLabel}>Menu</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tile} onPress={() => router.push("/reservations")}>
              <Text style={styles.tileIcon}>📅</Text>
              <Text style={styles.tileLabel}>Reserve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tile} onPress={() => router.push("/locations")}>
              <Text style={styles.tileIcon}>📍</Text>
              <Text style={styles.tileLabel}>Locations</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tile} onPress={() => router.push("/(tabs)/rewards")}>
              <Text style={styles.tileIcon}>⭐</Text>
              <Text style={styles.tileLabel}>Rewards</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tile} onPress={() => router.push("/drive-thru")}>
              <Text style={styles.tileIcon}>🚗</Text>
              <Text style={styles.tileLabel}>Drive-Thru</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tile} onPress={() => router.push("/feedback")}>
              <Text style={styles.tileIcon}>💬</Text>
              <Text style={styles.tileLabel}>Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.promoCard}>
          <Text style={styles.promoTitle}>Earn Points</Text>
          <Text style={styles.promoText}>Get 1 point for every $1 spent. Redeem for free drinks and more.</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/rewards")}>
            <Text style={styles.promoLink}>View Rewards</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  hero: { backgroundColor: BROWN, padding: 40, paddingTop: 72, alignItems: "center" },
  brand: { fontSize: 32, fontWeight: "800", color: "#fff", textAlign: "center" },
  tagline: { color: "#c9a97a", fontSize: 16, marginTop: 8, marginBottom: 28 },
  heroBtn: { backgroundColor: AMBER, paddingHorizontal: 36, paddingVertical: 14, borderRadius: 30 },
  heroBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  quickActions: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: BROWN, marginBottom: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: { width: "30%", backgroundColor: "#fff", borderRadius: 14, padding: 16, alignItems: "center", elevation: 1 },
  tileIcon: { fontSize: 28, marginBottom: 6 },
  tileLabel: { fontSize: 13, fontWeight: "600", color: BROWN, textAlign: "center" },
  promoCard: { margin: 20, marginTop: 0, backgroundColor: AMBER + "20", borderRadius: 16, padding: 20, borderLeftWidth: 4, borderLeftColor: AMBER },
  promoTitle: { fontSize: 17, fontWeight: "700", color: BROWN, marginBottom: 6 },
  promoText: { color: "#555", lineHeight: 20, marginBottom: 10 },
  promoLink: { color: AMBER, fontWeight: "700" },
});
