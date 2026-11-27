import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Step } from '../types';

interface Props {
  step: Step;
  isLast: boolean;
  /** Hint-first mode: the step is hidden behind its hint until the student reveals it. */
  locked?: boolean;
  /** Dimmed placeholder for steps after the one the student is working on. */
  upcoming?: boolean;
  onReveal?: () => void;
  onAsk?: () => void;
}

export default function StepCard({ step, isLast, locked, upcoming, onReveal, onAsk }: Props) {
  const [expanded, setExpanded] = useState(true);

  if (upcoming) {
    return (
      <View style={[styles.container, { opacity: 0.45 }]}>
        <View style={styles.timeline}>
          <View style={[styles.numBubble, styles.numBubbleMuted]}>
            <Text style={styles.numText}>{step.stepNumber}</Text>
          </View>
          {!isLast && <View style={styles.connector} />}
        </View>
        <View style={[styles.card, cardShadow]}>
          <View style={styles.header}>
            <Text style={styles.title}>Step {step.stepNumber}</Text>
            <Ionicons name="lock-closed-outline" size={14} color="#ADA7C2" />
          </View>
        </View>
      </View>
    );
  }

  if (locked) {
    return (
      <View style={styles.container}>
        <View style={styles.timeline}>
          <View style={styles.numBubble}>
            <Text style={styles.numText}>{step.stepNumber}</Text>
          </View>
          {!isLast && <View style={styles.connector} />}
        </View>
        <View style={[styles.card, cardShadow]}>
          <View style={styles.header}>
            <Text style={styles.title}>Step {step.stepNumber}: your turn</Text>
            <Ionicons name="bulb-outline" size={16} color="#FF9F0A" />
          </View>
          <View style={styles.body}>
            <Text style={styles.explanation}>
              {step.hint ?? 'Try this step yourself before you look.'}
            </Text>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.primaryBtn} onPress={onReveal} activeOpacity={0.7}>
                <Text style={styles.primaryBtnText}>I tried it, show step</Text>
              </TouchableOpacity>
              {onAsk ? (
                <TouchableOpacity style={styles.ghostBtn} onPress={onAsk} activeOpacity={0.7}>
                  <Ionicons name="chatbubble-ellipses-outline" size={14} color="#1D1A33" />
                  <Text style={styles.ghostBtnText}>Ask</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.timeline}>
        <View style={styles.numBubble}>
          <Text style={styles.numText}>{step.stepNumber}</Text>
        </View>
        {!isLast && <View style={styles.connector} />}
      </View>

      <View style={[styles.card, cardShadow]}>
        <TouchableOpacity
          style={styles.header}
          onPress={() => setExpanded((v) => !v)}
          activeOpacity={0.65}
        >
          <Text style={styles.title}>{step.title}</Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#ADA7C2"
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
            {onAsk ? (
              <TouchableOpacity style={[styles.ghostBtn, { marginTop: 10 }]} onPress={onAsk} activeOpacity={0.7}>
                <Ionicons name="chatbubble-ellipses-outline" size={14} color="#1D1A33" />
                <Text style={styles.ghostBtnText}>Ask about this step</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

const cardShadow = {
  shadowColor: '#6A4CFF',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

const styles = StyleSheet.create({
  container:  { flexDirection: 'row', marginBottom: 4 },
  timeline:   { alignItems: 'center', width: 34, marginRight: 10 },
  numBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#6A4CFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    shadowColor: '#6A4CFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  numText:   { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  connector: { width: 1, flex: 1, backgroundColor: '#E9E2F7', marginTop: 4, marginBottom: -4 },

  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
  },
  title: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1D1A33', marginRight: 8 },
  body:  { paddingHorizontal: 13, paddingBottom: 13 },
  explanation: { fontSize: 13, color: '#6B6585', lineHeight: 20 },
  formulaBox: {
    marginTop: 10,
    backgroundColor: '#F7F2FF',
    borderRadius: 10,
    padding: 11,
    borderLeftWidth: 3,
    borderLeftColor: '#1D1A33',
  },
  numBubbleMuted: { backgroundColor: '#ADA7C2' },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#6A4CFF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#F7F2FF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  ghostBtnText: { color: '#1D1A33', fontSize: 13, fontWeight: '600' },
  formulaText: { fontFamily: 'monospace', fontSize: 13, color: '#1D1A33', fontWeight: '600' },
});
