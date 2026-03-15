import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { getMe, logout, UserDto } from "@/hooks/services/authService";

const AMBER = "#C47D2B";
const BROWN = "#3C1F0F";
const CREAM = "#FAF7F2";

export default function ProfileScreen() {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getMe().then(setUser).finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={AMBER} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {user ? (
        <View style={styles.content}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.userName[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{user.userName}</Text>
          <Text style={styles.role}>{user.roles?.join(", ") || "Customer"}</Text>

          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(tabs)/rewards")}>
              <Text style={styles.menuText}>My Rewards</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(tabs)/orders")}>
              <Text style={styles.menuText}>Order History</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/reservations")}>
              <Text style={styles.menuText}>Reservations</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/feedback")}>
              <Text style={styles.menuText}>Leave Feedback</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.guestText}>You're not logged in.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.push("/Auth/login")}>
            <Text style={styles.btnText}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.outlineBtn]} onPress={() => router.push("/Auth/signup")}>
            <Text style={[styles.btnText, { color: AMBER }]}>Create Account</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { padding: 16, paddingTop: 56, backgroundColor: BROWN },
  title: { fontSize: 24, fontWeight: "700", color: "#fff" },
  content: { flex: 1, alignItems: "center", padding: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: AMBER, justifyContent: "center", alignItems: "center", marginTop: 24 },
  avatarText: { fontSize: 32, fontWeight: "700", color: "#fff" },
  userName: { fontSize: 22, fontWeight: "700", color: BROWN, marginTop: 12 },
  role: { color: "#888", marginTop: 4, marginBottom: 24 },
  menu: { width: "100%", backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", elevation: 1 },
  menuItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  menuText: { fontSize: 16, color: BROWN },
  arrow: { fontSize: 20, color: "#aaa" },
  logoutBtn: { marginTop: 24, paddingHorizontal: 40, paddingVertical: 12, borderRadius: 25, borderWidth: 1.5, borderColor: "red" },
  logoutText: { color: "red", fontWeight: "600", fontSize: 15 },
  guestText: { fontSize: 16, color: "#666", marginTop: 40, marginBottom: 24 },
  btn: { backgroundColor: AMBER, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 25, marginBottom: 12, width: "100%" },
  outlineBtn: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: AMBER },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16, textAlign: "center" },
});
