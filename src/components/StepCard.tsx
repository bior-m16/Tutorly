import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Step } from '../types';

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
        <View style={styles.numBubble}>
          <Text style={styles.numText}>{step.stepNumber}</Text>
        </View>
        {!isLast && <View style={styles.connector} />}
      </View>

      {/* Card */}
      <View style={[styles.card, isLast && styles.cardLast]}>
        <TouchableOpacity
          style={styles.header}
          onPress={() => setExpanded((v) => !v)}
          activeOpacity={0.65}
        >
          <Text style={styles.title}>{step.title}</Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#AEAEB2"
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
  timeline: { alignItems: 'center', width: 34, marginRight: 10 },
  numBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  numText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  connector: {
    width: 1,
    flex: 1,
    backgroundColor: '#E0E0E5',
    marginTop: 4,
    marginBottom: -4,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLast: {},
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
    color: '#1C1C1E',
    marginRight: 8,
  },
  body: { paddingHorizontal: 13, paddingBottom: 13 },
  explanation: {
    fontSize: 13,
    color: '#6C6C70',
    lineHeight: 20,
  },
  formulaBox: {
    marginTop: 10,
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    padding: 11,
    borderLeftWidth: 3,
    borderLeftColor: '#1C1C1E',
  },
  formulaText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '600',
  },
});
