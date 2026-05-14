import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Subject } from '../types';

// All badges use the same dark surface style — subject is distinguished by a colored dot
const SUBJECT_DOTS: Record<Subject, string> = {
  Math: '#0A84FF',
  Physics: '#64D2FF',
  Chemistry: '#30D158',
  Biology: '#34C759',
  History: '#FF9F0A',
  Literature: '#BF5AF2',
  Geography: '#32ADE6',
  'Computer Science': '#0A84FF',
  Other: '#8E8E93',
};

const SUBJECT_ICONS: Record<Subject, string> = {
  Math: '∑',
  Physics: '⚛',
  Chemistry: '⚗',
  Biology: '🧬',
  History: '📜',
  Literature: '📖',
  Geography: '🌍',
  'Computer Science': '💻',
  Other: '📚',
};

interface Props {
  subject: Subject;
  size?: 'sm' | 'md' | 'lg';
}

export default function SubjectBadge({ subject, size = 'md' }: Props) {
  const dot = SUBJECT_DOTS[subject] ?? '#8E8E93';
  const icon = SUBJECT_ICONS[subject] ?? '📚';

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' && styles.badgeSm,
        size === 'lg' && styles.badgeLg,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.icon, size === 'sm' && styles.iconSm]}>{icon}</Text>
      <Text style={[styles.label, size === 'sm' && styles.labelSm, size === 'lg' && styles.labelLg]}>
        {subject}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  badgeSm: { paddingHorizontal: 8, paddingVertical: 3 },
  badgeLg: { paddingHorizontal: 14, paddingVertical: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  icon: { fontSize: 12 },
  iconSm: { fontSize: 10 },
  label: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  labelSm: { fontSize: 11 },
  labelLg: { fontSize: 15 },
});
