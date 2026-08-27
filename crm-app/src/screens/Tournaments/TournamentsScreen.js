import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../../components/Header';
import Badge from '../../components/Badge';
import FormModal from '../../components/FormModal';
import { getTournaments, addTournament, deleteTournament } from '../../store/dataStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';

const TOURNAMENT_FIELDS = [
  { key: 'name', label: 'Tournament Name', placeholder: 'e.g. VCT Challengers' },
  { key: 'game', label: 'Game', placeholder: 'e.g. Valorant, BGMI' },
  { key: 'date', label: 'Date', placeholder: 'YYYY-MM-DD' },
  { key: 'prize', label: 'Prize Pool', placeholder: 'e.g. ₹2,00,000' },
  { key: 'status', label: 'Status', placeholder: 'Upcoming / Registered / Completed', default: 'Upcoming' },
  { key: 'placement', label: 'Placement', placeholder: '1st / Top 4 / -', default: '-' },
  { key: 'notes', label: 'Notes', placeholder: 'Additional info...', multiline: true },
];

export default function TournamentsScreen() {
  const [tournaments, setTournaments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('All');

  const load = async () => setTournaments(await getTournaments());
  useFocusEffect(useCallback(() => { load(); }, []));

  const filters = ['All', 'Upcoming', 'Registered', 'Completed'];
  const filtered = filter === 'All' ? tournaments : tournaments.filter((t) => t.status === filter);

  const handleDelete = (t) => {
    Alert.alert('Remove Tournament', `Remove ${t.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await deleteTournament(t.id); load(); } },
    ]);
  };

  const renderTournament = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.trophyWrap}>
          <Text style={styles.trophyIcon}>
            {item.status === 'Completed' ? (item.placement === '1st' ? '🥇' : '🏆') : '⚔️'}
          </Text>
        </View>
        <View style={styles.tInfo}>
          <Text style={styles.tName}>{item.name}</Text>
          <Text style={styles.tSub}>{item.game} · {item.date}</Text>
        </View>
        <View style={styles.cardActions}>
          <Badge label={item.status} />
          <TouchableOpacity onPress={() => handleDelete(item)}>
            <Text style={{ fontSize: 14 }}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.cardBottom}>
        <View style={styles.tStat}>
          <Text style={styles.tStatLabel}>Prize Pool</Text>
          <Text style={[styles.tStatValue, { color: COLORS.success }]}>{item.prize || 'TBA'}</Text>
        </View>
        <View style={styles.tStat}>
          <Text style={styles.tStatLabel}>Placement</Text>
          <Text style={[styles.tStatValue, { color: COLORS.warning }]}>{item.placement || '-'}</Text>
        </View>
      </View>
      {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Tournaments" subtitle={`${tournaments.length} events`} rightAction={() => setShowModal(true)} />
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderTournament}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>⚔️</Text>
            <Text style={styles.emptyText}>No tournaments</Text>
            <Text style={styles.emptyHint}>Tap + to add a tournament</Text>
          </View>
        }
      />
      <FormModal
        visible={showModal}
        title="Add Tournament"
        fields={TOURNAMENT_FIELDS}
        onSubmit={async (data) => { await addTournament(data); load(); }}
        onClose={() => setShowModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filterRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.sm },
  filterBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: FONTS.sm, color: COLORS.textSecondary },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: SPACING.lg, paddingTop: 0 },
  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  trophyWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.accentOrange + '22', alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
  },
  trophyIcon: { fontSize: 22 },
  tInfo: { flex: 1 },
  tName: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.text },
  tSub: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginTop: 2 },
  cardActions: { alignItems: 'flex-end', gap: SPACING.sm },
  cardBottom: { flexDirection: 'row', gap: SPACING.xl, borderTopWidth: 1, borderTopColor: COLORS.divider, paddingTop: SPACING.sm },
  tStat: {},
  tStatLabel: { fontSize: FONTS.xs, color: COLORS.textMuted },
  tStatValue: { fontSize: FONTS.md, fontWeight: '700', marginTop: 2 },
  notes: { fontSize: FONTS.xs, color: COLORS.textMuted, marginTop: SPACING.sm, fontStyle: 'italic' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: FONTS.lg, color: COLORS.textSecondary, fontWeight: '600' },
  emptyHint: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: SPACING.xs },
});
