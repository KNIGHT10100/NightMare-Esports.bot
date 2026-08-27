import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../../components/Header';
import Badge from '../../components/Badge';
import FormModal from '../../components/FormModal';
import { getTasks, addTask, updateTask, deleteTask } from '../../store/dataStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';

const TASK_FIELDS = [
  { key: 'title', label: 'Task Title', placeholder: 'What needs to be done?' },
  { key: 'priority', label: 'Priority', placeholder: 'Critical / High / Medium / Low', default: 'Medium' },
  { key: 'dueDate', label: 'Due Date', placeholder: 'YYYY-MM-DD' },
  { key: 'assignee', label: 'Assigned To', placeholder: 'e.g. Manager, Coach, Owner' },
  { key: 'notes', label: 'Notes', placeholder: 'Additional details...', multiline: true },
];

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('Pending');

  const load = async () => setTasks(await getTasks());
  useFocusEffect(useCallback(() => { load(); }, []));

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);
  const filtered = filter === 'Pending' ? pending : completed;

  const toggleComplete = async (task) => {
    await updateTask(task.id, { completed: !task.completed });
    load();
  };

  const handleDelete = (task) => {
    Alert.alert('Delete Task', `Delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteTask(task.id); load(); } },
    ]);
  };

  const renderTask = ({ item }) => (
    <View style={[styles.card, item.completed && styles.cardDone]}>
      <TouchableOpacity onPress={() => toggleComplete(item)} style={styles.checkbox}>
        <View style={[styles.checkInner, item.completed && styles.checkDone]}>
          {item.completed && <Text style={styles.checkMark}>✓</Text>}
        </View>
      </TouchableOpacity>
      <View style={styles.taskInfo}>
        <Text style={[styles.taskTitle, item.completed && styles.taskTitleDone]}>{item.title}</Text>
        <View style={styles.metaRow}>
          {item.dueDate ? <Text style={styles.meta}>📅 {item.dueDate}</Text> : null}
          {item.assignee ? <Text style={styles.meta}>👤 {item.assignee}</Text> : null}
        </View>
        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
      </View>
      <View style={styles.taskRight}>
        {!item.completed && <Badge label={item.priority} />}
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
          <Text>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Tasks" subtitle={`${pending.length} pending`} rightAction={() => setShowModal(true)} />
      <View style={styles.filterRow}>
        {['Pending', 'Completed'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f} ({f === 'Pending' ? pending.length : completed.length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={renderTask}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{filter === 'Completed' ? '🎉' : '✅'}</Text>
            <Text style={styles.emptyText}>
              {filter === 'Completed' ? 'No completed tasks' : 'All caught up!'}
            </Text>
            <Text style={styles.emptyHint}>
              {filter === 'Pending' ? 'Tap + to add a task' : 'Complete some tasks first'}
            </Text>
          </View>
        }
      />
      <FormModal
        visible={showModal}
        title="Add Task"
        fields={TASK_FIELDS}
        onSubmit={async (data) => { await addTask(data); load(); }}
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
    flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: 'flex-start',
  },
  cardDone: { opacity: 0.6 },
  checkbox: { marginRight: SPACING.md, marginTop: 2 },
  checkInner: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  checkDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: FONTS.md, fontWeight: '600', color: COLORS.text },
  taskTitleDone: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  metaRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.xs },
  meta: { fontSize: FONTS.xs, color: COLORS.textSecondary },
  notes: { fontSize: FONTS.xs, color: COLORS.textMuted, marginTop: SPACING.xs, fontStyle: 'italic' },
  taskRight: { alignItems: 'flex-end', gap: SPACING.sm },
  deleteBtn: { padding: SPACING.xs },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: FONTS.lg, color: COLORS.textSecondary, fontWeight: '600' },
  emptyHint: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: SPACING.xs },
});
