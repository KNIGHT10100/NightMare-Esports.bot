import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../../components/Header';
import Badge from '../../components/Badge';
import FormModal from '../../components/FormModal';
import { getSponsors, addSponsor, deleteSponsor } from '../../store/dataStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';

const SPONSOR_FIELDS = [
  { key: 'name', label: 'Company Name', placeholder: 'e.g. GearUp Gaming' },
  { key: 'tier', label: 'Sponsorship Tier', placeholder: 'Title / Co-Title / Associate', default: 'Associate' },
  { key: 'value', label: 'Deal Value', placeholder: 'e.g. ₹5,00,000' },
  { key: 'contact', label: 'Contact Email', placeholder: 'partner@company.com', keyboardType: 'email-address' },
  { key: 'status', label: 'Status', placeholder: 'Active / Negotiating / Ended', default: 'Negotiating' },
  { key: 'renewDate', label: 'Renewal Date', placeholder: 'YYYY-MM-DD' },
  { key: 'notes', label: 'Notes', placeholder: 'Deal terms, conditions...', multiline: true },
];

const TIER_ICONS = { Title: '👑', 'Co-Title': '⭐', Associate: '🤝', default: '💼' };

export default function SponsorsScreen() {
  const [sponsors, setSponsors] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const load = async () => setSponsors(await getSponsors());
  useFocusEffect(useCallback(() => { load(); }, []));

  const totalValue = sponsors
    .filter((s) => s.status === 'Active')
    .reduce((sum, s) => {
      const num = parseFloat((s.value || '0').replace(/[^0-9.]/g, ''));
      return sum + (isNaN(num) ? 0 : num);
    }, 0);

  const handleDelete = (s) => {
    Alert.alert('Remove Sponsor', `Remove ${s.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await deleteSponsor(s.id); load(); } },
    ]);
  };

  const renderSponsor = ({ item }) => {
    const icon = TIER_ICONS[item.tier] || TIER_ICONS.default;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.sponsorName}>{item.name}</Text>
            <Text style={styles.sponsorTier}>{item.tier} Sponsor</Text>
            <Text style={styles.contact}>{item.contact}</Text>
          </View>
          <View style={styles.rightCol}>
            <Badge label={item.status} />
            <TouchableOpacity onPress={() => handleDelete(item)} style={{ marginTop: SPACING.sm }}>
              <Text>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.dealRow}>
          <View style={styles.dealItem}>
            <Text style={styles.dealLabel}>Deal Value</Text>
            <Text style={[styles.dealValue, { color: COLORS.success }]}>{item.value || 'TBA'}</Text>
          </View>
          <View style={styles.dealItem}>
            <Text style={styles.dealLabel}>Renewal</Text>
            <Text style={[styles.dealValue, { color: COLORS.warning }]}>{item.renewDate || 'N/A'}</Text>
          </View>
        </View>
        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Sponsors" subtitle={`${sponsors.length} partners`} rightAction={() => setShowModal(true)} />

      {sponsors.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{sponsors.filter((s) => s.status === 'Active').length}</Text>
            <Text style={styles.summaryLabel}>Active Sponsors</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>
              ₹{(totalValue / 100000).toFixed(1)}L
            </Text>
            <Text style={styles.summaryLabel}>Total Value</Text>
          </View>
        </View>
      )}

      <FlatList
        data={sponsors}
        keyExtractor={(i) => i.id}
        renderItem={renderSponsor}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💼</Text>
            <Text style={styles.emptyText}>No sponsors yet</Text>
            <Text style={styles.emptyHint}>Tap + to add a sponsor</Text>
          </View>
        }
      />
      <FormModal
        visible={showModal}
        title="Add Sponsor"
        fields={SPONSOR_FIELDS}
        onSubmit={async (data) => { await addSponsor(data); load(); }}
        onClose={() => setShowModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  summaryCard: {
    flexDirection: 'row', backgroundColor: COLORS.card, margin: SPACING.lg,
    borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: FONTS.xxl, fontWeight: '700', color: COLORS.primary },
  summaryLabel: { fontSize: FONTS.xs, color: COLORS.textMuted, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: COLORS.divider },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg },
  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.cardBorder,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.accentOrange + '22', alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
  },
  icon: { fontSize: 22 },
  info: { flex: 1 },
  sponsorName: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.text },
  sponsorTier: { fontSize: FONTS.sm, color: COLORS.primary, marginTop: 2 },
  contact: { fontSize: FONTS.xs, color: COLORS.textSecondary, marginTop: 2 },
  rightCol: { alignItems: 'flex-end' },
  dealRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.divider, paddingTop: SPACING.sm, gap: SPACING.xl },
  dealItem: {},
  dealLabel: { fontSize: FONTS.xs, color: COLORS.textMuted },
  dealValue: { fontSize: FONTS.md, fontWeight: '700', marginTop: 2 },
  notes: { fontSize: FONTS.xs, color: COLORS.textMuted, marginTop: SPACING.sm, fontStyle: 'italic' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: FONTS.lg, color: COLORS.textSecondary, fontWeight: '600' },
  emptyHint: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: SPACING.xs },
});
