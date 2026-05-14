import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HomeworkResult } from '../types';
import SubjectBadge from './SubjectBadge';

const C = {
  surface: '#1A1A1A',
  border: '#2C2C2E',
  text: '#FFFFFF',
  textMuted: '#8E8E93',
  danger: '#FF453A',
};

const DIFF_COLORS: Record<string, string> = {
  Easy: '#30D158',
  Medium: '#FFD60A',
  Hard: '#FF453A',
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  const diffH = (Date.now() - date.getTime()) / 3_600_000;
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${Math.floor(diffH)}h ago`;
  if (diffH < 48) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface Props {
  item: HomeworkResult;
  onPress: () => void;
  onDelete: () => void;
}

export default function HistoryItem({ item, onPress, onDelete }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.65}>
      <Image source={{ uri: item.imageUri }} style={styles.thumbnail} resizeMode="cover" />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <SubjectBadge subject={item.subject} size="sm" />
          <View style={[styles.diffDot, { backgroundColor: DIFF_COLORS[item.difficulty] }]} />
          <Text style={[styles.diff, { color: DIFF_COLORS[item.difficulty] }]}>
            {item.difficulty}
          </Text>
        </View>
        <Text style={styles.question} numberOfLines={2}>{item.question}</Text>
        <View style={styles.meta}>
          <Ionicons name="time-outline" size={11} color={C.textMuted} />
          <Text style={styles.metaText}>{formatDate(item.timestamp)}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{item.steps.length} steps</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={onDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={16} color={C.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#2C2C2E',
  },
  content: { flex: 1, gap: 5 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  diffDot: { width: 6, height: 6, borderRadius: 3 },
  diff: { fontSize: 11, fontWeight: '700' },
  question: { fontSize: 13, fontWeight: '600', color: C.text, lineHeight: 19 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: C.textMuted },
  metaDot: { fontSize: 11, color: C.textMuted },
  deleteBtn: { padding: 4 },
});
