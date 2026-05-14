import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Step } from '../types';

const C = {
  surface: '#1A1A1A',
  surfaceHigh: '#242424',
  border: '#2C2C2E',
  text: '#FFFFFF',
  textMuted: '#8E8E93',
  accent: '#FFFFFF',
  formula: '#0A84FF',
};

interface Props {
  step: Step;
  isLast: boolean;
}

export default function StepCard({ step, isLast }: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.container}>
      {/* Timeline */}
      <View style={styles.timeline}>
        <View style={styles.numberBubble}>
          <Text style={styles.numberText}>{step.stepNumber}</Text>
        </View>
        {!isLast && <View style={styles.connector} />}
      </View>

      {/* Card */}
      <View style={[styles.card, isLast && styles.cardLast]}>
        <TouchableOpacity
          style={styles.header}
          onPress={() => setExpanded((v) => !v)}
          activeOpacity={0.6}
        >
          <Text style={styles.title}>{step.title}</Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={C.textMuted}
          />
        </TouchableOpacity>

        {expanded && (
          <View style={styles.body}>
            <Text style={styles.explanation}>{step.explanation}</Text>
            {step.formula ? (
              <View style={styles.formulaBox}>
                <Text style={styles.formulaText}>{step.formula}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', marginBottom: 4 },
  timeline: { alignItems: 'center', width: 36, marginRight: 10 },
  numberBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surfaceHigh,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  numberText: { color: C.text, fontSize: 13, fontWeight: '700' },
  connector: {
    width: 1,
    flex: 1,
    backgroundColor: C.border,
    marginTop: 4,
    marginBottom: -4,
  },
  card: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  cardLast: { borderColor: '#3A3A3C' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    marginRight: 8,
  },
  body: { paddingHorizontal: 13, paddingBottom: 13 },
  explanation: {
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 20,
  },
  formulaBox: {
    marginTop: 10,
    backgroundColor: 'rgba(10,132,255,0.1)',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: C.formula,
  },
  formulaText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: C.formula,
    fontWeight: '600',
  },
});
