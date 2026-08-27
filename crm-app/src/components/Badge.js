import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '../utils/theme';

const BADGE_COLORS = {
  Active: { bg: COLORS.success + '22', text: COLORS.success },
  Trial: { bg: COLORS.warning + '22', text: COLORS.warning },
  Inactive: { bg: COLORS.textMuted + '22', text: COLORS.textMuted },
  Critical: { bg: COLORS.accent + '22', text: COLORS.accent },
  High: { bg: COLORS.accentOrange + '22', text: COLORS.accentOrange },
  Medium: { bg: COLORS.warning + '22', text: COLORS.warning },
  Low: { bg: COLORS.info + '22', text: COLORS.info },
  Upcoming: { bg: COLORS.primary + '22', text: COLORS.primary },
  Registered: { bg: COLORS.info + '22', text: COLORS.info },
  Completed: { bg: COLORS.success + '22', text: COLORS.success },
  Title: { bg: COLORS.accentOrange + '22', text: COLORS.accentOrange },
  'Co-Title': { bg: COLORS.primary + '22', text: COLORS.primary },
  Associate: { bg: COLORS.info + '22', text: COLORS.info },
  default: { bg: COLORS.textSecondary + '22', text: COLORS.textSecondary },
};

export default function Badge({ label }) {
  const colors = BADGE_COLORS[label] || BADGE_COLORS.default;
  return (
    <Text style={[styles.badge, { backgroundColor: colors.bg, color: colors.text }]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    fontSize: FONTS.xs,
    fontWeight: '700',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
});
