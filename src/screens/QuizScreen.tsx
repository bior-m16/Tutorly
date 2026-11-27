import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { glow } from '../theme';

type RouteT = RouteProp<RootStackParamList, 'Quiz'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function QuizScreen() {
  const { quiz } = useRoute<RouteT>().params;
  const navigation = useNavigation<Nav>();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const total = quiz.questions.length;
  const q = quiz.questions[index];

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answerIndex) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 >= total) {
      setDone(true);
    } else {
      setIndex(index + 1);
      setPicked(null);
    }
  };

  const retry = () => {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  if (done) {
    const pct = Math.round((score / total) * 100);
    const msg = pct === 100 ? 'Perfect score!' : pct >= 60 ? 'Nice work!' : 'Keep practising, you will get there.';
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.doneWrap}>
          <View style={styles.scoreRing}>
            <Text style={styles.scoreNum}>{score}/{total}</Text>
          </View>
          <Text style={styles.doneTitle}>{msg}</Text>
          <Text style={styles.doneSub}>{quiz.title}</Text>
          <TouchableOpacity style={styles.primary} onPress={retry} activeOpacity={0.8}>
            <Ionicons name="refresh" size={18} color="#FFF" />
            <Text style={styles.primaryText}>Try again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondary} onPress={() => navigation.replace('StudySetup', { kind: 'quiz' })} activeOpacity={0.8}>
            <Text style={styles.secondaryText}>New quiz</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((index + (picked !== null ? 1 : 0)) / total) * 100}%` }]} />
        </View>
        <Text style={styles.counter}>Question {index + 1} of {total}</Text>
        <Text style={styles.question}>{q.question}</Text>

        {q.choices.map((c, i) => {
          const isAnswer = i === q.answerIndex;
          const state = picked === null ? 'idle' : isAnswer ? 'right' : i === picked ? 'wrong' : 'dim';
          return (
            <TouchableOpacity
              key={i}
              style={[styles.choice, state === 'right' && styles.right, state === 'wrong' && styles.wrong, state === 'dim' && { opacity: 0.5 }]}
              onPress={() => choose(i)}
              disabled={picked !== null}
              activeOpacity={0.7}
            >
              <View style={[styles.letter, state === 'right' && { backgroundColor: '#34C759' }, state === 'wrong' && { backgroundColor: '#FF3B30' }]}>
                <Text style={[styles.letterText, (state === 'right' || state === 'wrong') && { color: '#FFF' }]}>{LETTERS[i]}</Text>
              </View>
              <Text style={styles.choiceText}>{c}</Text>
              {state === 'right' ? <Ionicons name="checkmark-circle" size={20} color="#34C759" /> : null}
              {state === 'wrong' ? <Ionicons name="close-circle" size={20} color="#FF3B30" /> : null}
            </TouchableOpacity>
          );
        })}

        {picked !== null ? (
          <View style={styles.explain}>
            <Text style={styles.explainTitle}>{picked === q.answerIndex ? 'Correct' : 'Not quite'}</Text>
            {q.explanation ? <Text style={styles.explainText}>{q.explanation}</Text> : null}
          </View>
        ) : null}
      </ScrollView>

      {picked !== null ? (
        <TouchableOpacity style={[styles.primary, { margin: 16 }]} onPress={next} activeOpacity={0.8}>
          <Text style={styles.primaryText}>{index + 1 >= total ? 'See my score' : 'Next question'}</Text>
        </TouchableOpacity>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F5' },
  content: { padding: 16, paddingBottom: 24 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: '#E3DCF2', overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: '#6A4CFF' },
  counter: { fontSize: 12, fontWeight: '700', color: '#ADA7C2', marginTop: 14 },
  question: { fontSize: 19, fontWeight: '700', color: '#1D1A33', lineHeight: 26, marginTop: 6, marginBottom: 16 },
  choice: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF',
    borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 2, borderColor: 'transparent',
  },
  right: { borderColor: '#34C759', backgroundColor: '#F0FBF3' },
  wrong: { borderColor: '#FF3B30', backgroundColor: '#FFF2F1' },
  letter: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F4EFFF', alignItems: 'center', justifyContent: 'center' },
  letterText: { fontSize: 13, fontWeight: '800', color: '#1D1A33' },
  choiceText: { flex: 1, fontSize: 15, color: '#1D1A33', lineHeight: 21 },
  explain: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginTop: 6 },
  explainTitle: { fontSize: 14, fontWeight: '800', color: '#1D1A33', marginBottom: 4 },
  explainText: { fontSize: 14, color: '#3A3A3C', lineHeight: 20 },
  primary: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#6A4CFF', ...glow('#7A5CFF', 16, 0.35), borderRadius: 16, paddingVertical: 16, alignSelf: 'stretch',
  },
  primaryText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  secondary: { paddingVertical: 14, alignSelf: 'stretch', alignItems: 'center', marginTop: 8 },
  secondaryText: { color: '#1D1A33', fontSize: 15, fontWeight: '600' },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scoreRing: {
    width: 140, height: 140, borderRadius: 70, borderWidth: 10, borderColor: '#6A4CFF',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF',
  },
  scoreNum: { fontSize: 32, fontWeight: '800', color: '#1D1A33' },
  doneTitle: { fontSize: 22, fontWeight: '800', color: '#1D1A33', marginTop: 20, textAlign: 'center' },
  doneSub: { fontSize: 14, color: '#6B6585', marginTop: 4, marginBottom: 28, textAlign: 'center' },
});
