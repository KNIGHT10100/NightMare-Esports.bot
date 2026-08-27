import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SPACING } from '../utils/theme';

export default function Header({ title, subtitle, onBack, rightAction, rightLabel }) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightAction && (
        <TouchableOpacity onPress={rightAction} style={styles.rightBtn}>
          <Text style={styles.rightLabel}>{rightLabel || '+'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.surface,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtn: { marginRight: SPACING.md, padding: SPACING.xs },
  backIcon: { fontSize: FONTS.xl, color: COLORS.primary },
  title: { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.text },
  subtitle: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginTop: 2 },
  rightBtn: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightLabel: { fontSize: FONTS.lg, color: '#fff', fontWeight: '700' },
});
