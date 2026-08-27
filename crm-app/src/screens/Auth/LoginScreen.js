import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { saveUser } from '../../store/dataStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';

const ADMIN_CREDENTIALS = [
  { username: 'admin', password: 'nightmare2025', role: 'Owner', name: 'NM Admin' },
  { username: 'manager', password: 'nm@manager', role: 'Manager', name: 'Team Manager' },
  { username: 'coach', password: 'nm@coach', role: 'Coach', name: 'Head Coach' },
];

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const match = ADMIN_CREDENTIALS.find(
      (c) => c.username === username.trim() && c.password === password
    );
    if (match) {
      await saveUser({ ...match, loginAt: new Date().toISOString() });
      onLogin(match);
    } else {
      setError('Invalid credentials. Try admin / nightmare2025');
    }
    setLoading(false);
  };

  return (
    <LinearGradient colors={['#0A0A0F', '#0F0A1A', '#0A0A0F']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
        <View style={styles.logoSection}>
          <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.logoCircle}>
            <Text style={styles.logoText}>NM</Text>
          </LinearGradient>
          <Text style={styles.orgName}>NightMare Esports</Text>
          <Text style={styles.tagline}>CRM Command Center</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity onPress={handleLogin} disabled={loading}>
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.loginBtn}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.loginText}>Sign In</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.hint}>
            <Text style={styles.hintText}>Demo: admin / nightmare2025</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', padding: SPACING.xl },
  logoSection: { alignItems: 'center', marginBottom: SPACING.xxl },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg,
  },
  logoText: { fontSize: 32, fontWeight: '900', color: '#fff' },
  orgName: { fontSize: FONTS.xxl, fontWeight: '800', color: COLORS.text },
  tagline: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cardTitle: { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.lg },
  fieldWrap: { marginBottom: SPACING.md },
  label: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1, borderColor: COLORS.inputBorder,
    borderRadius: RADIUS.md, padding: SPACING.md,
    color: COLORS.text, fontSize: FONTS.md,
  },
  error: { color: COLORS.accent, fontSize: FONTS.sm, marginBottom: SPACING.md },
  loginBtn: { borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  loginText: { color: '#fff', fontSize: FONTS.md, fontWeight: '700' },
  hint: { marginTop: SPACING.lg, alignItems: 'center' },
  hintText: { color: COLORS.textMuted, fontSize: FONTS.xs },
});
