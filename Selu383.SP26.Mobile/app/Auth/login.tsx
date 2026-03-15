import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/store/authStore';

export default function LoginScreen() {
  const { login } = useAuth();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function submitLogin() {
    try {
      await login(userName, password);
      router.replace('/(tabs)/profile');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to login.');
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>
        <TextInput style={styles.input} value={userName} onChangeText={setUserName} placeholder="Username" placeholderTextColor="#8f7d70" />
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor="#8f7d70" secureTextEntry />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Pressable style={styles.primaryButton} onPress={submitLogin}>
          <Text style={styles.primaryButtonText}>Sign in</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/Auth/signup')}>
          <Text style={styles.linkText}>Need an account? Register</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6efe7' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { gap: 12, borderRadius: 26, backgroundColor: '#fffaf4', padding: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#1f1a17' },
  input: {
    borderRadius: 18,
    backgroundColor: '#f6efe7',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#1f1a17',
  },
  primaryButton: {
    borderRadius: 999,
    backgroundColor: '#1d2d3c',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: { color: '#fffaf4', fontWeight: '700', textAlign: 'center' },
  message: { color: '#b33030' },
  linkText: { color: '#8a5124', fontWeight: '700' },
});
