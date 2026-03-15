import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function DriveThruScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Drive-Thru</Text>
      </View>
      <View style={styles.center}>
        <Text style={styles.icon}>🚗</Text>
        <Text style={styles.text}>Drive-thru ordering</Text>
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
  icon: { fontSize: 64 },
  text: { fontSize: 18, color: "#3C1F0F", fontWeight: "600" },
  btn: { backgroundColor: "#C47D2B", paddingHorizontal: 28, paddingVertical: 12, borderRadius: 25, marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "700" },
});
