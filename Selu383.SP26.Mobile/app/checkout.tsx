import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createOrder, earnPoints } from "@/hooks/services/orderService";
import { getLocations, Location } from "@/hooks/services/locationService";
import { getMe, UserDto } from "@/hooks/services/authService";

const AMBER = "#C47D2B";
const BROWN = "#3C1F0F";
const CREAM = "#FAF7F2";

export default function CheckoutScreen() {
  const { cart: cartParam } = useLocalSearchParams<{ cart: string }>();
  const router = useRouter();
  const cart = JSON.parse(cartParam || "[]");
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [orderType, setOrderType] = useState("dine-in");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserDto | null>(null);

  const total = cart.reduce((s: number, c: any) => s + c.item.price * c.qty, 0);

  useEffect(() => {
    getLocations().then(setLocations).catch(() => {});
    getMe().then(setUser).catch(() => {});
  }, []);

  const handlePlaceOrder = async () => {
    if (!selectedLocation) {
      Alert.alert("Select a location", "Please choose a location.");
      return;
    }
    setLoading(true);
    try {
      const order = await createOrder({
        userId: user?.id ?? 0,
        locationId: selectedLocation,
        orderType,
        status: "Received",
        total,
        discountAmount: 0,
        note: note.trim() || undefined,
        items: cart.map((c: any) => ({
          menuItemId: c.item.id,
          name: c.item.name,
          quantity: c.qty,
          price: c.item.price,
        })),
      });
      if (user) await earnPoints(total).catch(() => {});
      Alert.alert("Order placed!", `Order #${order.id} received! We'll notify you when it's ready.`, [
        { text: "Track Order", onPress: () => router.replace("/(tabs)/orders") },
        { text: "OK", onPress: () => router.replace("/(tabs)/orders") },
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
        <Text style={styles.title}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.label}>Order Type</Text>
        <View style={styles.row}>
          {["dine-in", "pickup", "drive-thru"].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, orderType === t && styles.typeBtnActive]}
              onPress={() => setOrderType(t)}
            >
              <Text style={[styles.typeBtnText, orderType === t && styles.typeBtnTextActive]}>
                {t === "dine-in" ? "Dine In" : t === "pickup" ? "Pickup" : "Drive-Thru"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Location</Text>
        {locations.map((loc) => (
          <TouchableOpacity
            key={loc.id}
            style={[styles.locCard, selectedLocation === loc.id && styles.locCardActive]}
            onPress={() => setSelectedLocation(loc.id)}
          >
            <Text style={styles.locName}>{loc.name}</Text>
            <Text style={styles.locAddr}>{loc.address}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.label}>Order Note (optional)</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="e.g. Extra hot, oat milk, no sugar..."
          placeholderTextColor="#aaa"
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={2}
        />

        <Text style={styles.label}>Order Summary</Text>
        {cart.map((c: any) => (
          <View key={c.item.id} style={styles.summaryRow}>
            <Text style={styles.summaryName}>{c.item.name} x{c.qty}</Text>
            <Text style={styles.summaryPrice}>${(c.item.price * c.qty).toFixed(2)}</Text>
          </View>
        ))}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>

        {!user && (
          <Text style={styles.guestNote}>Checking out as guest - log in to earn points.</Text>
        )}

        <TouchableOpacity style={styles.placeBtn} onPress={handlePlaceOrder} disabled={loading}>
          <Text style={styles.placeBtnText}>{loading ? "Placing order..." : `Place Order - $${total.toFixed(2)}`}</Text>
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
  label: { fontSize: 16, fontWeight: "700", color: BROWN, marginTop: 20, marginBottom: 10 },
  row: { flexDirection: "row", gap: 10 },
  typeBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: "#ddd", alignItems: "center" },
  typeBtnActive: { borderColor: AMBER, backgroundColor: AMBER + "20" },
  typeBtnText: { color: "#888", fontWeight: "600", fontSize: 13 },
  typeBtnTextActive: { color: AMBER },
  locCard: { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: "#ddd" },
  locCardActive: { borderColor: AMBER },
  locName: { fontWeight: "700", color: BROWN },
  locAddr: { color: "#666", fontSize: 13, marginTop: 2 },
  noteInput: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1.5, borderColor: "#ddd", padding: 12, color: BROWN, fontSize: 14, minHeight: 60, textAlignVertical: "top" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  summaryName: { color: BROWN },
  summaryPrice: { color: AMBER, fontWeight: "600" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#ddd" },
  totalLabel: { fontSize: 18, fontWeight: "700", color: BROWN },
  totalValue: { fontSize: 18, fontWeight: "700", color: AMBER },
  guestNote: { color: "#999", fontSize: 13, textAlign: "center", marginTop: 12 },
  placeBtn: { backgroundColor: AMBER, padding: 16, borderRadius: 25, alignItems: "center", marginTop: 24, marginBottom: 32 },
  placeBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
