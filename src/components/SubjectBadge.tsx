import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Subject } from '../types';

const SUBJECT_COLORS: Record<Subject, { bg: string; text: string; icon: string }> = {
  Math: { bg: '#EBF4FF', text: '#3182CE', icon: '∑' },
  Physics: { bg: '#EBF8FF', text: '#0987A0', icon: '⚛' },
  Chemistry: { bg: '#F0FFF4', text: '#276749', icon: '⚗' },
  Biology: { bg: '#F0FFF4', text: '#22543D', icon: '🧬' },
  History: { bg: '#FFFAF0', text: '#C05621', icon: '📜' },
  Literature: { bg: '#FAF5FF', text: '#6B46C1', icon: '📖' },
  Geography: { bg: '#E6FFFA', text: '#234E52', icon: '🌍' },
  'Computer Science': { bg: '#EBF4FF', text: '#2C5282', icon: '💻' },
  Other: { bg: '#F7FAFC', text: '#4A5568', icon: '📚' },
};

interface Props {
  subject: Subject;
  size?: 'sm' | 'md' | 'lg';
}

export default function SubjectBadge({ subject, size = 'md' }: Props) {
  const colors = SUBJECT_COLORS[subject] ?? SUBJECT_COLORS.Other;
  const isLarge = size === 'lg';
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.bg },
        isLarge && styles.badgeLg,
        isSmall && styles.badgeSm,
      ]}
    >
      <Text style={[styles.icon, isSmall && styles.iconSm]}>{colors.icon}</Text>
      <Text
        style={[
          styles.label,
          { color: colors.text },
          isLarge && styles.labelLg,
          isSmall && styles.labelSm,
        ]}
      >
        {subject}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 4,
  },
  badgeLg: {
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  icon: {
    fontSize: 13,
  },
  iconSm: {
    fontSize: 11,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  labelLg: {
    fontSize: 15,
  },
  labelSm: {
    fontSize: 11,
  },
});
