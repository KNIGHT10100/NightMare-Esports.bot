import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../../components/Header';
import Badge from '../../components/Badge';
import FormModal from '../../components/FormModal';
import { getTeams, addTeam, deleteTeam } from '../../store/dataStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';

const TEAM_FIELDS = [
  { key: 'name', label: 'Team Name', placeholder: 'e.g. NightMare Valorant' },
  { key: 'game', label: 'Game', placeholder: 'e.g. Valorant, BGMI' },
  { key: 'coach', label: 'Coach / Manager', placeholder: 'Coach name' },
  { key: 'wins', label: 'Wins', placeholder: '0', keyboardType: 'numeric', default: '0' },
  { key: 'losses', label: 'Losses', placeholder: '0', keyboardType: 'numeric', default: '0' },
  { key: 'status', label: 'Status', placeholder: 'Active / Inactive', default: 'Active' },
];

const GAME_COLORS = {
  Valorant: COLORS.accent,
  BGMI: COLORS.warning,
  'COD Mobile': COLORS.accentOrange,
  'Free Fire': COLORS.success,
  default: COLORS.primary,
};

export default function TeamsScreen() {
  const [teams, setTeams] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const load = async () => setTeams(await getTeams());
  useFocusEffect(useCallback(() => { load(); }, []));

  const handleDelete = (team) => {
    Alert.alert('Disband Team', `Disband ${team.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disband', style: 'destructive', onPress: async () => { await deleteTeam(team.id); load(); } },
    ]);
  };

  const renderTeam = ({ item }) => {
    const color = GAME_COLORS[item.game] || GAME_COLORS.default;
    const winRate = item.wins && (parseInt(item.wins) + parseInt(item.losses || 0)) > 0
      ? Math.round((parseInt(item.wins) / (parseInt(item.wins) + parseInt(item.losses || 0))) * 100)
      : 0;

    return (
      <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 3 }]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.teamName}>{item.name}</Text>
            <Text style={styles.teamSub}>{item.game}</Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <Badge label={item.status} />
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
              <Text>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>{item.wins || 0}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: COLORS.accent }]}>{item.losses || 0}</Text>
            <Text style={styles.statLabel}>Losses</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: color }]}>{winRate}%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>🎓</Text>
            <Text style={styles.statLabel}>{item.coach || 'N/A'}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Teams" subtitle={`${teams.length} teams`} rightAction={() => setShowModal(true)} />
      <FlatList
        data={teams}
        keyExtractor={(i) => i.id}
        renderItem={renderTeam}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyText}>No teams yet</Text>
            <Text style={styles.emptyHint}>Tap + to create a team</Text>
          </View>
        }
      />
      <FormModal
        visible={showModal}
        title="Create Team"
        fields={TEAM_FIELDS}
        onSubmit={async (data) => { await addTeam(data); load(); }}
        onClose={() => setShowModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.lg },
  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  teamName: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.text },
  teamSub: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginTop: 2 },
  deleteBtn: { padding: SPACING.xs },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: FONTS.lg, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: FONTS.xs, color: COLORS.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: FONTS.lg, color: COLORS.textSecondary, fontWeight: '600' },
  emptyHint: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: SPACING.xs },
});
