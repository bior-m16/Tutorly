import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subject } from '../types';

const META: Record<Subject, { icon: keyof typeof Ionicons.glyphMap }> = {
  Math:               { icon: 'calculator-outline' },
  Physics:            { icon: 'planet-outline' },
  Chemistry:          { icon: 'flask-outline' },
  Biology:            { icon: 'leaf-outline' },
  History:            { icon: 'library-outline' },
  Literature:         { icon: 'book-outline' },
  Geography:          { icon: 'earth-outline' },
  'Computer Science': { icon: 'code-slash-outline' },
  Other:              { icon: 'help-circle-outline' },
};

interface Props {
  subject: Subject;
  size?: 'sm' | 'md' | 'lg';
}

export default function SubjectBadge({ subject, size = 'md' }: Props) {
  const { icon } = META[subject] ?? META.Other;
  const isLg = size === 'lg';
  const isSm = size === 'sm';

  return (
    <View style={[styles.badge, isSm && styles.badgeSm, isLg && styles.badgeLg]}>
      <Ionicons name={icon} size={isSm ? 11 : isLg ? 16 : 13} color="#6C6C70" />
      <Text style={[styles.label, isSm && styles.labelSm, isLg && styles.labelLg]}>
        {subject}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    backgroundColor: '#EFEFEF',
  },
  badgeSm: { paddingHorizontal: 8, paddingVertical: 3 },
  badgeLg: { paddingHorizontal: 14, paddingVertical: 8 },
  label:   { fontSize: 12, fontWeight: '600', color: '#6C6C70' },
  labelSm: { fontSize: 11 },
  labelLg: { fontSize: 15 },
});
