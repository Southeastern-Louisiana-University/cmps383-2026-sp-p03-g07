import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { createReservation } from "@/hooks/services/reservationService";
import { getLocations, Location } from "@/hooks/services/locationService";

const AMBER = "#C47D2B";
const BROWN = "#3C1F0F";
const CREAM = "#FAF7F2";

export default function ReservationsScreen() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getLocations().then(setLocations).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!locationId || !date || !time) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await createReservation({
        locationId,
        reservationTime: `${date}T${time}:00`,
        partySize: parseInt(partySize) || 2,
        status: "Confirmed",
      });
      Alert.alert("Reserved!", "Your table has been reserved.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Reserve a Table</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.label}>Location</Text>
        {locations.map((loc) => (
          <TouchableOpacity
            key={loc.id}
            style={[styles.locCard, locationId === loc.id && styles.locCardActive]}
            onPress={() => setLocationId(loc.id)}
          >
            <Text style={styles.locName}>{loc.name}</Text>
            <Text style={styles.locAddr}>{loc.address}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
        <TextInput style={styles.input} placeholder="2026-04-01" value={date} onChangeText={setDate} />

        <Text style={styles.label}>Time (HH:MM)</Text>
        <TextInput style={styles.input} placeholder="14:00" value={time} onChangeText={setTime} />

        <Text style={styles.label}>Party Size</Text>
        <TextInput style={styles.input} placeholder="2" keyboardType="numeric" value={partySize} onChangeText={setPartySize} />

        <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "Reserving..." : "Reserve Table"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { padding: 16, paddingTop: 56, backgroundColor: BROWN, flexDirection: "row", alignItems: "center", gap: 16 },
  back: { color: "#fff", fontSize: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#fff" },
  label: { fontSize: 16, fontWeight: "700", color: BROWN, marginTop: 20, marginBottom: 8 },
  locCard: { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: "#ddd" },
  locCardActive: { borderColor: AMBER },
  locName: { fontWeight: "700", color: BROWN },
  locAddr: { color: "#666", fontSize: 13, marginTop: 2 },
  input: { backgroundColor: "#fff", borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: "#ddd" },
  btn: { backgroundColor: AMBER, padding: 16, borderRadius: 25, alignItems: "center", marginTop: 28, marginBottom: 32 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
