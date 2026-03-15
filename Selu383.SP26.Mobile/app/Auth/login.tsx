import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { login } from "@/hooks/services/authService";

const AMBER = "#C47D2B";
const BROWN = "#3C1F0F";
const CREAM = "#FAF7F2";

export default function LoginScreen() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!userName || !password) {
      Alert.alert("Error", "Please enter username and password.");
      return;
    }
    setLoading(true);
    try {
      await login(userName, password);
      router.replace("/(tabs)/profile");
    } catch (e: any) {
      Alert.alert("Login Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.inner}>
        <Text style={styles.logo}>Caffeinated Lions</Text>
        <Text style={styles.subtitle}>Welcome back</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          autoCapitalize="none"
          value={userName}
          onChangeText={setUserName}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "Logging in..." : "Log In"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/Auth/signup")}>
          <Text style={styles.link}>Don't have an account? Sign up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 8 }}>
          <Text style={styles.link}>Continue as guest</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  inner: { flex: 1, justifyContent: "center", padding: 28 },
  logo: { fontSize: 30, fontWeight: "800", color: BROWN, textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#888", textAlign: "center", marginBottom: 32 },
  input: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16, borderWidth: 1, borderColor: "#ddd" },
  btn: { backgroundColor: AMBER, padding: 16, borderRadius: 25, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { color: AMBER, textAlign: "center", marginTop: 16, fontSize: 14 },
});
