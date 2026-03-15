import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Linking, TouchableOpacity } from "react-native";
import { getLocations, Location } from "@/hooks/services/locationService";

const AMBER = "#C47D2B";
const BROWN = "#3C1F0F";
const CREAM = "#FAF7F2";

export default function LocationsScreen() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLocations().then(setLocations).finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={AMBER} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Locations</Text>
      </View>
      <FlatList
        data={locations}
        keyExtractor={(l) => String(l.id)}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.address}>{item.address}</Text>
            {item.city ? <Text style={styles.address}>{item.city}, {item.state} {item.zip}</Text> : null}
            {item.phone ? (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                <Text style={styles.phone}>{item.phone}</Text>
              </TouchableOpacity>
            ) : null}
            {item.hoursOfOperation ? <Text style={styles.hours}>{item.hoursOfOperation}</Text> : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { padding: 16, paddingTop: 56, backgroundColor: BROWN },
  title: { fontSize: 24, fontWeight: "700", color: "#fff" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10, elevation: 1 },
  name: { fontSize: 17, fontWeight: "700", color: BROWN },
  address: { color: "#555", marginTop: 4 },
  phone: { color: AMBER, marginTop: 6, fontWeight: "600" },
  hours: { color: "#777", marginTop: 4, fontSize: 13 },
});
