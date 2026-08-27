import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../../components/Header';
import Badge from '../../components/Badge';
import FormModal from '../../components/FormModal';
import { getPlayers, addPlayer, deletePlayer } from '../../store/dataStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';

const PLAYER_FIELDS = [
  { key: 'name', label: 'Player Name / IGN', placeholder: 'e.g. ShadowBlade' },
  { key: 'game', label: 'Game', placeholder: 'e.g. Valorant, BGMI, COD Mobile' },
  { key: 'role', label: 'Role', placeholder: 'e.g. Duelist, IGL, Sniper' },
  { key: 'rank', label: 'Rank', placeholder: 'e.g. Radiant, Conqueror' },
  { key: 'status', label: 'Status', placeholder: 'Active / Trial / Inactive', default: 'Active' },
  { key: 'contact', label: 'Contact Number', placeholder: '+91 XXXXX XXXXX', keyboardType: 'phone-pad' },
  { key: 'email', label: 'Email', placeholder: 'player@nm.gg', keyboardType: 'email-address' },
];

const GAME_EMOJI = { Valorant: '⚡', BGMI: '🎯', 'COD Mobile': '💥', 'Free Fire': '🔥', default: '🎮' };

export default function PlayersScreen() {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const load = async () => setPlayers(await getPlayers());
  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = players.filter(
    (p) => p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.game?.toLowerCase().includes(search.toLowerCase()) ||
      p.role?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (player) => {
    Alert.alert('Remove Player', `Remove ${player.name} from roster?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await deletePlayer(player.id); load(); } },
    ]);
  };

  const renderPlayer = ({ item }) => {
    const emoji = GAME_EMOJI[item.game] || GAME_EMOJI.default;
    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{emoji}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.playerName}>{item.name}</Text>
            <Text style={styles.playerSub}>{item.game} · {item.role}</Text>
            <Text style={styles.playerRank}>🏅 {item.rank}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Badge label={item.status} />
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
            <Text style={styles.deleteIcon}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Players"
        subtitle={`${players.length} in roster`}
        rightAction={() => setShowModal(true)}
      />
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search players, games, roles..."
          placeholderTextColor={COLORS.textMuted}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderPlayer}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎮</Text>
            <Text style={styles.emptyText}>No players found</Text>
            <Text style={styles.emptyHint}>Tap + to add a player</Text>
          </View>
        }
      />
      <FormModal
        visible={showModal}
        title="Add Player"
        fields={PLAYER_FIELDS}
        onSubmit={async (data) => { await addPlayer(data); load(); }}
        onClose={() => setShowModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchWrap: { padding: SPACING.lg, paddingBottom: SPACING.sm },
  search: {
    backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.inputBorder,
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    color: COLORS.text, fontSize: FONTS.sm,
  },
  list: { padding: SPACING.lg, paddingTop: SPACING.sm },
  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md,
    marginBottom: SPACING.sm, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primary + '22', alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md, borderWidth: 1, borderColor: COLORS.primary + '44',
  },
  avatarText: { fontSize: 22 },
  info: { flex: 1 },
  playerName: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.text },
  playerSub: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginTop: 2 },
  playerRank: { fontSize: FONTS.xs, color: COLORS.warning, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: SPACING.sm },
  deleteBtn: { padding: SPACING.xs },
  deleteIcon: { fontSize: 16 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: FONTS.lg, color: COLORS.textSecondary, fontWeight: '600' },
  emptyHint: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: SPACING.xs },
});
