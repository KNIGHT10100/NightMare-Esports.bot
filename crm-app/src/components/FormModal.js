import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';

export default function FormModal({ visible, title, fields, onSubmit, onClose }) {
  const initialState = fields.reduce((acc, f) => ({ ...acc, [f.key]: f.default || '' }), {});
  const [form, setForm] = useState(initialState);

  const handleSubmit = () => {
    onSubmit(form);
    setForm(initialState);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {fields.map((field) => (
              <View key={field.key} style={styles.fieldWrap}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  value={form[field.key]}
                  onChangeText={(v) => setForm((p) => ({ ...p, [field.key]: v }))}
                  placeholder={field.placeholder || ''}
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType={field.keyboardType || 'default'}
                  multiline={field.multiline}
                  numberOfLines={field.multiline ? 3 : 1}
                />
              </View>
            ))}
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn}>
              <Text style={styles.submitText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.textMuted, alignSelf: 'center', marginBottom: SPACING.lg,
  },
  title: { fontSize: FONTS.xl, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.lg },
  fieldWrap: { marginBottom: SPACING.md },
  label: { fontSize: FONTS.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    fontSize: FONTS.md,
  },
  actions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.lg },
  cancelBtn: {
    flex: 1, padding: SPACING.md, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.cardBorder, alignItems: 'center',
  },
  cancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  submitBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700' },
});
