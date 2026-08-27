import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { clearUser } from '../../store/dataStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';

const ROLE_PERMS = {
  Owner: ['Full Access', 'Manage All Data', 'Delete Records', 'View All Reports'],
  Manager: ['Manage Players', 'Manage Tournaments', 'Manage Tasks', 'View Reports'],
  Coach: ['View Players', 'Manage Tasks', 'View Tournaments'],
};

export default function ProfileScreen({ user, onLogout }) {
  const perms = ROLE_PERMS[user?.role] || [];

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => { await clearUser(); onLogout(); },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#1A0A2E', '#0A0A0F']} style={styles.hero}>
        <View style={styles.avatarWrap}>
          <LinearGradient colors={[COLORS.primary, COLORS.accent]} style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
          </LinearGradient>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userRole}>{user?.role}</Text>
        <Text style={styles.username}>@{user?.username}</Text>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Access Permissions</Text>
        {perms.map((p, i) => (
          <View key={i} style={styles.permRow}>
            <Text style={styles.permCheck}>✅</Text>
            <Text style={styles.permText}>{p}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Info</Text>
        <View style={styles.infoCard}>
          {[
            { label: 'App Version', value: '1.0.0' },
            { label: 'Organization', value: 'NightMare Esports' },
            { label: 'Login Time', value: user?.loginAt ? new Date(user.loginAt).toLocaleString() : 'N/A' },
          ].map((item) => (
            <View key={item.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: { alignItems: 'center', paddingVertical: SPACING.xxl },
  avatarWrap: { marginBottom: SPACING.md },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#fff' },
  userName: { fontSize: FONTS.xxl, fontWeight: '800', color: COLORS.text },
  userRole: { fontSize: FONTS.md, color: COLORS.primary, fontWeight: '600', marginTop: 4 },
  username: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginTop: 4 },
  section: { padding: SPACING.lg },
  sectionTitle: { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  permRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  permCheck: { fontSize: 16, marginRight: SPACING.sm },
  permText: { fontSize: FONTS.md, color: COLORS.textSecondary },
  infoCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.cardBorder },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  infoLabel: { fontSize: FONTS.sm, color: COLORS.textSecondary },
  infoValue: { fontSize: FONTS.sm, color: COLORS.text, fontWeight: '600' },
  logoutBtn: {
    backgroundColor: COLORS.accent + '22', borderWidth: 1, borderColor: COLORS.accent,
    borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center',
  },
  logoutText: { color: COLORS.accent, fontWeight: '700', fontSize: FONTS.md },
});
