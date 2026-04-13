import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/store/authStore';

export default function SignupScreen() {
  const { register } = useAuth();
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function submitSignup() {
    const trimmedUserName = userName.trim();
    const trimmedPassword = password.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedUserName || !trimmedPassword || !trimmedEmail || !trimmedPhone) {
      setMessage('Username, password, email, and phone number are required to register.');
      return;
    }

    try {
      setMessage('');
      await register(trimmedUserName, trimmedPassword, trimmedEmail, trimmedPhone);
      router.replace('/(tabs)/profile');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to register.');
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Register</Text>
        <TextInput
          style={styles.input}
          value={userName}
          onChangeText={setUserName}
          placeholder="Username"
          placeholderTextColor="#8f7d70"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#8f7d70"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone number"
          placeholderTextColor="#8f7d70"
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#8f7d70"
          secureTextEntry
        />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Pressable style={styles.primaryButton} onPress={submitSignup}>
          <Text style={styles.primaryButtonText}>Create account</Text>
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
});
