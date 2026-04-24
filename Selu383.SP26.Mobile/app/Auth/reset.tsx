import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/store/authStore';

export default function ResetPasswordScreen() {
  const { resetPassword } = useAuth();
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'error' | 'success'>('error');

  async function submitReset() {
    const trimmedUserName = userName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedNewPassword = newPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedUserName || !trimmedEmail || !trimmedPhone || !trimmedNewPassword) {
      setMessageTone('error');
      setMessage('Username, email, phone number, and new password are required.');
      return;
    }

    if (trimmedNewPassword !== trimmedConfirmPassword) {
      setMessageTone('error');
      setMessage('Passwords do not match.');
      return;
    }

    try {
      setMessage('');
      await resetPassword(trimmedUserName, trimmedEmail, trimmedPhone, trimmedNewPassword);
      setMessageTone('success');
      setMessage('Password reset. You can sign in with your new password.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessageTone('error');
      setMessage(error instanceof Error ? error.message : 'Unable to reset password.');
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Reset password</Text>
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
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New password"
          placeholderTextColor="#8f7d70"
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          placeholderTextColor="#8f7d70"
          secureTextEntry
        />
        {message ? <Text style={[styles.message, messageTone === 'success' && styles.messageSuccess]}>{message}</Text> : null}
        <Pressable style={styles.primaryButton} onPress={submitReset}>
          <Text style={styles.primaryButtonText}>Reset password</Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/Auth/login')}>
          <Text style={styles.linkText}>Back to login</Text>
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
  messageSuccess: { color: '#5f6a1a' },
  linkText: { color: '#8a5124', fontWeight: '700' },
});
