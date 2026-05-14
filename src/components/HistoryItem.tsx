import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HomeworkResult } from '../types';
import SubjectBadge from './SubjectBadge';

const COLORS = {
  text: '#2D3748',
  textLight: '#718096',
  border: '#E2E8F0',
  white: '#FFFFFF',
  danger: '#FC8181',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: '#48BB78',
  Medium: '#ECC94B',
  Hard: '#FC8181',
};

interface Props {
  item: HomeworkResult;
  onPress: () => void;
  onDelete: () => void;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  if (diffHours < 48) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function HistoryItem({ item, onPress, onDelete }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <Image source={{ uri: item.imageUri }} style={styles.thumbnail} resizeMode="cover" />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <SubjectBadge subject={item.subject} size="sm" />
          <View style={[styles.difficultyDot, { backgroundColor: DIFFICULTY_COLORS[item.difficulty] }]} />
          <Text style={styles.difficulty}>{item.difficulty}</Text>
        </View>

        <Text style={styles.question} numberOfLines={2}>
          {item.question}
        </Text>

        <View style={styles.bottomRow}>
          <Ionicons name="time-outline" size={12} color={COLORS.textLight} />
          <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
          <Text style={styles.stepCount}>· {item.steps.length} steps</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    gap: 12,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#EEF0F5',
  },
  content: {
    flex: 1,
    gap: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  difficultyDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  difficulty: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  question: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  stepCount: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  deleteBtn: {
    padding: 4,
  },
});
