import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';

export default function StatCard({ label, value, icon, color = COLORS.primary, gradient }) {
  const gradColors = gradient || [color + '33', color + '11'];
  return (
    <LinearGradient colors={gradColors} style={styles.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={[styles.iconWrap, { backgroundColor: color + '22', borderColor: color + '44' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    margin: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  icon: { fontSize: 18 },
  value: { fontSize: FONTS.xxl, fontWeight: '700' },
  label: { fontSize: FONTS.xs, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },
});
