import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/store/authStore';

export default function ProfileScreen() {
  const { logout, updateProfile, user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [birthday, setBirthday] = useState(user?.birthday ?? '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profilePictureUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function saveProfile() {
    setSaving(true);
    setErrorMessage('');
    try {
      await updateProfile({
        displayName: displayName || undefined,
        birthday: birthday || null,
        profilePictureUrl: profilePictureUrl || undefined,
      });
      setEditing(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.heroCopy}>
            Sign in to access your profile, saved orders, and rewards.
          </Text>
          <View style={styles.heroButtons}>
            <Pressable style={styles.primaryButton} onPress={() => router.push('/Auth/login')}>
              <Text style={styles.primaryButtonText}>Login</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => router.push('/Auth/signup')}>
              <Text style={styles.secondaryButtonText}>Create account</Text>
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.actionCard} onPress={() => router.push('/locations')}>
          <Text style={styles.actionTitle}>Store finder</Text>
          <Text style={styles.copy}>Map, hours, and directions</Text>
        </Pressable>

        <Pressable style={styles.actionCard} onPress={() => router.push('/gift-card')}>
          <Text style={styles.actionTitle}>Gift cards</Text>
          <Text style={styles.copy}>Buy, redeem, and check balance</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        {user.profilePictureUrl ? (
          <Image source={{ uri: user.profilePictureUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {(user.displayName || user.userName).charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.title}>{user.displayName || user.userName}</Text>
        <Text style={styles.heroCopy}>
          {user.points} stars • {user.roles.join(', ')}
        </Text>
        {user.birthday && (
          <Text style={styles.birthdayNote}>
            Birthday month reward unlocked on your birthday!
          </Text>
        )}
      </View>

      {editing ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Edit profile</Text>

          <Text style={styles.label}>Display name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your display name"
            placeholderTextColor="#8f7d70"
          />

          <Text style={styles.label}>Birthday (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={birthday}
            onChangeText={setBirthday}
            placeholder="1990-01-15"
            placeholderTextColor="#8f7d70"
            keyboardType="numbers-and-punctuation"
          />
          <Text style={styles.hint}>Set your birthday to get a free item on your birthday month!</Text>

          <Text style={styles.label}>Profile picture URL</Text>
          <TextInput
            style={styles.input}
            value={profilePictureUrl}
            onChangeText={setProfilePictureUrl}
            placeholder="https://..."
            placeholderTextColor="#8f7d70"
            keyboardType="url"
            autoCapitalize="none"
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.primaryButton, saving && styles.buttonDisabled]}
              onPress={saveProfile}
              disabled={saving}>
              <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => setEditing(false)}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={styles.actionCard}
          onPress={() => {
            setDisplayName(user.displayName ?? '');
            setBirthday(user.birthday ?? '');
            setProfilePictureUrl(user.profilePictureUrl ?? '');
            setEditing(true);
          }}>
          <Text style={styles.actionTitle}>Edit profile</Text>
          <Text style={styles.copy}>Update display name, birthday, and picture</Text>
        </Pressable>
      )}

      <Pressable style={styles.actionCard} onPress={() => router.push('/reservations')}>
        <Text style={styles.actionTitle}>Reservations</Text>
        <Text style={styles.copy}>Book a table at your nearest location</Text>
      </Pressable>

      <Pressable style={styles.actionCard} onPress={() => router.push('/locations')}>
        <Text style={styles.actionTitle}>Store finder</Text>
        <Text style={styles.copy}>Map, hours, and directions</Text>
      </Pressable>

      <Pressable style={styles.actionCard} onPress={() => router.push('/gift-card')}>
        <Text style={styles.actionTitle}>Gift cards</Text>
        <Text style={styles.copy}>Buy, redeem, and check balance</Text>
      </Pressable>

      {user.roles.includes('Admin') || user.roles.includes('Manager') ? (
        <Pressable style={styles.actionCard} onPress={() => router.push('/admin/dashboard')}>
          <Text style={styles.actionTitle}>Admin dashboard</Text>
          <Text style={styles.copy}>Manage orders, menu, and reservations</Text>
        </Pressable>
      ) : null}

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6efe7' },
  content: { gap: 14, padding: 20, paddingBottom: 40 },
  heroCard: {
    gap: 8,
    borderRadius: 28,
    backgroundColor: '#1d2d3c',
    padding: 20,
    alignItems: 'flex-start',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#fffaf4' },
  heroCopy: { color: '#9eb4c8' },
  birthdayNote: { color: '#f2c57d', fontSize: 13, marginTop: 4 },
  heroButtons: { flexDirection: 'row', gap: 10, marginTop: 8 },
  avatar: { width: 70, height: 70, borderRadius: 35, marginBottom: 4 },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#40261a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarInitial: { color: '#f2c57d', fontSize: 28, fontWeight: '700' },
  card: {
    gap: 10,
    borderRadius: 22,
    backgroundColor: '#fffaf4',
    padding: 16,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  copy: { color: '#6c5b4d' },
  actionCard: {
    gap: 6,
    borderRadius: 22,
    backgroundColor: '#fffaf4',
    padding: 16,
  },
  actionTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  label: { fontSize: 13, fontWeight: '600', color: '#6c5b4d', textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    borderRadius: 18,
    backgroundColor: '#f6efe7',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#1f1a17',
  },
  hint: { fontSize: 12, color: '#8f7d70', fontStyle: 'italic' },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  primaryButton: {
    borderRadius: 999,
    backgroundColor: '#1d2d3c',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryButtonText: { color: '#fffaf4', fontWeight: '700' },
  secondaryButton: {
    borderRadius: 999,
    backgroundColor: '#f6efe7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1d2d3c',
  },
  secondaryButtonText: { color: '#1d2d3c', fontWeight: '700' },
  buttonDisabled: { opacity: 0.6 },
  errorText: { color: '#b33030' },
  logoutButton: {
    borderRadius: 999,
    backgroundColor: '#40261a',
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  logoutButtonText: { color: '#fffaf4', fontWeight: '700' },
});
