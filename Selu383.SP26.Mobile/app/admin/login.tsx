import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { login } from "@/hooks/services/authService";

export default function AdminLoginScreen() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const user = await login(userName, password);
      if (user.roles?.includes("Admin")) {
        router.replace("/admin/dashboard");
      } else {
        Alert.alert("Access Denied", "Admin account required.");
      }
    } catch (e: any) {
      Alert.alert("Login Failed", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Login</Text>
      <TextInput style={styles.input} placeholder="Username" autoCapitalize="none" value={userName} onChangeText={setUserName} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <TouchableOpacity style={styles.btn} onPress={handleLogin}>
        <Text style={styles.btnText}>Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 28, backgroundColor: "#FAF7F2" },
  title: { fontSize: 26, fontWeight: "800", color: "#3C1F0F", textAlign: "center", marginBottom: 32 },
  input: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: "#ddd" },
  btn: { backgroundColor: "#C47D2B", padding: 16, borderRadius: 25, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
