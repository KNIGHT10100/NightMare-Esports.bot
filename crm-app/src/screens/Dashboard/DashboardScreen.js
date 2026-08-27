import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import StatCard from '../../components/StatCard';
import { getPlayers, getTeams, getTournaments, getSponsors, getTasks } from '../../store/dataStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';

export default function DashboardScreen({ navigation, user }) {
  const [data, setData] = useState({ players: [], teams: [], tournaments: [], sponsors: [], tasks: [] });
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [players, teams, tournaments, sponsors, tasks] = await Promise.all([
      getPlayers(), getTeams(), getTournaments(), getSponsors(), getTasks(),
    ]);
    setData({ players, teams, tournaments, sponsors, tasks });
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const activePlayers = data.players.filter((p) => p.status === 'Active').length;
  const upcomingTournaments = data.tournaments.filter((t) => t.status === 'Upcoming' || t.status === 'Registered').length;
  const pendingTasks = data.tasks.filter((t) => !t.completed).length;
  const activeSponsors = data.sponsors.filter((s) => s.status === 'Active').length;

  const recentActivity = [
    ...data.players.slice(-3).map((p) => ({ icon: '🎮', text: `${p.name} joined as ${p.role}`, time: 'Player' })),
    ...data.tasks.filter((t) => !t.completed).slice(0, 2).map((t) => ({ icon: '✅', text: t.title, time: t.priority })),
  ].slice(0, 5);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      <LinearGradient colors={['#1A0A2E', '#0A0A0F']} style={styles.hero}>
        <View style={styles.heroContent}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Manager'}</Text>
            <Text style={styles.userRole}>{user?.role}</Text>
          </View>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>NM</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsRow}>
          <StatCard label="Active Players" value={activePlayers} icon="🎮" color={COLORS.primary} />
          <StatCard label="Teams" value={data.teams.length} icon="🏆" color={COLORS.info} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Tournaments" value={upcomingTournaments} icon="⚔️" color={COLORS.accentOrange} />
          <StatCard label="Sponsors" value={activeSponsors} icon="💼" color={COLORS.success} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Pending Tasks" value={pendingTasks} icon="📋" color={pendingTasks > 5 ? COLORS.accent : COLORS.warning} />
          <StatCard label="Total Players" value={data.players.length} icon="👥" color={COLORS.primaryLight} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {[
            { label: 'Add Player', icon: '➕', screen: 'Players', color: COLORS.primary },
            { label: 'New Task', icon: '✅', screen: 'Tasks', color: COLORS.success },
            { label: 'Tournament', icon: '🏆', screen: 'Tournaments', color: COLORS.accentOrange },
            { label: 'Sponsor', icon: '💼', screen: 'Sponsors', color: COLORS.info },
          ].map((q) => (
            <TouchableOpacity
              key={q.screen}
              style={[styles.quickBtn, { borderColor: q.color + '44' }]}
              onPress={() => navigation.navigate(q.screen)}
            >
              <Text style={styles.quickIcon}>{q.icon}</Text>
              <Text style={[styles.quickLabel, { color: q.color }]}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {recentActivity.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            {recentActivity.map((a, i) => (
              <View key={i} style={[styles.activityRow, i < recentActivity.length - 1 && styles.activityDivider]}>
                <Text style={styles.activityIcon}>{a.icon}</Text>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{a.text}</Text>
                  <Text style={styles.activityTime}>{a.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: { padding: SPACING.xl, paddingTop: SPACING.xl + 10 },
  heroContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: FONTS.sm, color: COLORS.textSecondary },
  userName: { fontSize: FONTS.xxl, fontWeight: '800', color: COLORS.text },
  userRole: { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: '600' },
  logoCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary + '22', borderWidth: 2, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: FONTS.lg, fontWeight: '900', color: COLORS.primary },
  section: { paddingHorizontal: SPACING.lg, marginTop: SPACING.xl },
  sectionTitle: { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  statsRow: { flexDirection: 'row', marginBottom: 0 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  quickBtn: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.card,
    borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1,
    alignItems: 'center', marginBottom: SPACING.sm,
  },
  quickIcon: { fontSize: 24, marginBottom: SPACING.xs },
  quickLabel: { fontSize: FONTS.sm, fontWeight: '600' },
  activityCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  activityRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  activityDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  activityIcon: { fontSize: 20, marginRight: SPACING.md },
  activityContent: { flex: 1 },
  activityText: { fontSize: FONTS.sm, color: COLORS.text },
  activityTime: { fontSize: FONTS.xs, color: COLORS.textMuted, marginTop: 2 },
});
