import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Step } from '../types';

const COLORS = {
  primary: '#6C63FF',
  text: '#2D3748',
  textLight: '#718096',
  border: '#E2E8F0',
  formulaBg: '#F7F8FF',
  white: '#FFFFFF',
};

interface Props {
  step: Step;
  isLast: boolean;
}

export default function StepCard({ step, isLast }: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.leftColumn}>
        <View style={styles.numberBubble}>
          <Text style={styles.numberText}>{step.stepNumber}</Text>
        </View>
        {!isLast && <View style={styles.connector} />}
      </View>

      <View style={[styles.card, isLast && styles.cardLast]}>
        <TouchableOpacity
          style={styles.header}
          onPress={() => setExpanded((v) => !v)}
          activeOpacity={0.7}
        >
          <Text style={styles.title}>{step.title}</Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={COLORS.textLight}
          />
        </TouchableOpacity>

        {expanded && (
          <View style={styles.body}>
            <Text style={styles.explanation}>{step.explanation}</Text>
            {step.formula ? (
              <View style={styles.formulaBox}>
                <Ionicons name="calculator-outline" size={14} color={COLORS.primary} />
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
  container: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  leftColumn: {
    alignItems: 'center',
    width: 36,
    marginRight: 12,
  },
  numberBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 1,
  },
  numberText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  connector: {
    width: 2,
    flex: 1,
    backgroundColor: '#DDD6FF',
    marginTop: 4,
    marginBottom: -4,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLast: {
    borderColor: '#DDD6FF',
    borderWidth: 1.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 8,
  },
  body: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  explanation: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 22,
  },
  formulaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: COLORS.formulaBg,
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  formulaText: {
    flex: 1,
    fontFamily: 'monospace',
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
