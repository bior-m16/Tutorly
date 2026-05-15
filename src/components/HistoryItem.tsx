import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HomeworkResult } from '../types';
import SubjectBadge from './SubjectBadge';

const DIFF_COLORS: Record<string, string> = {
  Easy:   '#34C759',
  Medium: '#FF9F0A',
  Hard:   '#FF3B30',
};

function formatDate(iso: string): string {
  const diffH = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (diffH < 1)  return 'Just now';
  if (diffH < 24) return `${Math.floor(diffH)}h ago`;
  if (diffH < 48) return 'Yesterday';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface Props {
  item: HomeworkResult;
  onPress: () => void;
  onDelete: () => void;
}

export default function HistoryItem({ item, onPress, onDelete }: Props) {
  return (
    <TouchableOpacity style={[styles.card, shadow]} onPress={onPress} activeOpacity={0.7}>
      <Image source={{ uri: item.imageUri }} style={styles.thumb} resizeMode="cover" />

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
          <Ionicons name="time-outline" size={11} color="#AEAEB2" />
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
        <Ionicons name="trash-outline" size={16} color="#AEAEB2" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const shadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 2,
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  thumb:    { width: 60, height: 60, borderRadius: 10, backgroundColor: '#EFEFEF' },
  content:  { flex: 1, gap: 5 },
  topRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  diffDot:  { width: 6, height: 6, borderRadius: 3 },
  diff:     { fontSize: 11, fontWeight: '700' },
  question: { fontSize: 13, fontWeight: '600', color: '#1C1C1E', lineHeight: 19 },
  meta:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#AEAEB2' },
  metaDot:  { fontSize: 11, color: '#AEAEB2' },
  deleteBtn:{ padding: 4 },
});
