import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHistory } from '../hooks/useHistory';
import StepCard from '../components/StepCard';
import SubjectBadge from '../components/SubjectBadge';
import { RootStackParamList, PracticeProblem } from '../types';
import { generatePractice, friendlyError } from '../services/claudeService';

type RouteT = RouteProp<RootStackParamList, 'Result'>;
type Nav    = NativeStackNavigationProp<RootStackParamList>;

const DIFF_CONFIG = {
  Easy:   { color: '#34C759', bg: 'rgba(52,199,89,0.1)' },
  Medium: { color: '#FF9F0A', bg: 'rgba(255,159,10,0.1)' },
  Hard:   { color: '#FF3B30', bg: 'rgba(255,59,48,0.1)' },
};

export default function ResultScreen() {
  const route = useRoute<RouteT>();
  const navigation = useNavigation<Nav>();
  const { result } = route.params;
  const { saveResult, history } = useHistory();
  const [saved, setSaved] = useState(() => history.some((h) => h.id === result.id));

  const diff = DIFF_CONFIG[result.difficulty];

  // Hint-first: steps unlock one at a time and the answer stays hidden until the end.
  const [hintFirst, setHintFirst] = useState(true);
  const [revealed, setRevealed] = useState(0);
  const [answerShown, setAnswerShown] = useState(false);
  const allRevealed = !hintFirst || revealed >= result.steps.length;
  const showAnswer = allRevealed || answerShown;

  const [practice, setPractice] = useState<PracticeProblem[] | null>(result.practice ?? null);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState<Record<number, boolean>>({});

  const ask = (stepNumber?: number) => navigation.navigate('Ask', { result, stepNumber });

  const loadPractice = async () => {
    setPracticeLoading(true);
    try {
      setPractice(await generatePractice(result));
    } catch (err) {
      Alert.alert('Could not make practice problems', friendlyError(err));
    } finally {
      setPracticeLoading(false);
    }
  };

  const handleSave = async () => {
    if (saved) return;
    await saveResult(practice ? { ...result, practice } : result);
    setSaved(true);
    Alert.alert('Saved', 'Added to your history.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Image + meta row */}
        <View style={styles.hero}>
          <Image source={{ uri: result.imageUri }} style={styles.thumbnail} resizeMode="cover" />
          <View style={styles.metaCol}>
            <SubjectBadge subject={result.subject} size="md" />
            <View style={[styles.diffBadge, { backgroundColor: diff.bg }]}>
              <View style={[styles.diffDot, { backgroundColor: diff.color }]} />
              <Text style={[styles.diffText, { color: diff.color }]}>{result.difficulty}</Text>
            </View>
            <View style={styles.stepsBadge}>
              <Text style={styles.stepsText}>{result.steps.length} steps</Text>
            </View>
          </View>
        </View>

        {/* Question */}
        <View style={styles.section}>
          <Text style={styles.label}>Question</Text>
          <View style={[styles.card, shadow]}>
            <Text style={styles.questionText}>{result.question}</Text>
          </View>
        </View>

        {/* Answer */}
        <View style={styles.section}>
          <Text style={styles.label}>Answer</Text>
          {showAnswer ? (
            <View style={[styles.answerCard, shadow]}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#34C759" style={{ marginTop: 2 }} />
              <Text style={styles.answerText}>{result.answer}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.card, shadow, styles.hiddenAnswer]}
              onPress={() => setAnswerShown(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="eye-off-outline" size={18} color="#AEAEB2" />
              <Text style={styles.hiddenAnswerText}>Work through the steps first, or tap to show the answer</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Steps */}
        <View style={styles.section}>
          <View style={styles.stepsHeader}>
            <Text style={[styles.label, { marginBottom: 0 }]}>Step-by-Step</Text>
            <View style={styles.toggle}>
              {[
                { on: true, label: 'Hint first' },
                { on: false, label: 'Show all' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.toggleOpt, hintFirst === opt.on && styles.toggleOptActive]}
                  onPress={() => setHintFirst(opt.on)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.toggleText, hintFirst === opt.on && styles.toggleTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {result.steps.map((step, i) => (
            <StepCard
              key={step.stepNumber}
              step={step}
              isLast={i === result.steps.length - 1}
              locked={hintFirst && i === revealed}
              upcoming={hintFirst && i > revealed}
              onReveal={() => setRevealed((r) => r + 1)}
              onAsk={() => ask(step.stepNumber)}
            />
          ))}
          <TouchableOpacity style={[styles.askBtn, shadow]} onPress={() => ask()} activeOpacity={0.7}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#1C1C1E" />
            <Text style={styles.askBtnText}>Ask a question about this problem</Text>
          </TouchableOpacity>
        </View>

        {/* Practice */}
        {allRevealed ? (
          <View style={styles.section}>
            <Text style={styles.label}>Practice</Text>
            {practice ? (
              practice.map((p, i) => (
                <View key={i} style={[styles.card, shadow, { marginBottom: 10 }]}>
                  <Text style={styles.practiceQ}>{i + 1}. {p.question}</Text>
                  {practiceOpen[i] ? (
                    <Text style={styles.practiceA}>{p.answer}</Text>
                  ) : (
                    <TouchableOpacity onPress={() => setPracticeOpen((o) => ({ ...o, [i]: true }))}>
                      <Text style={styles.practiceReveal}>Show answer</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <TouchableOpacity
                style={[styles.askBtn, shadow]}
                onPress={loadPractice}
                disabled={practiceLoading}
                activeOpacity={0.7}
              >
                {practiceLoading ? (
                  <ActivityIndicator color="#1C1C1E" />
                ) : (
                  <>
                    <Ionicons name="barbell-outline" size={18} color="#1C1C1E" />
                    <Text style={styles.askBtnText}>Practise 3 similar problems</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* Actions */}
        <View style={styles.actions}>
          {!saved ? (
            <TouchableOpacity style={[styles.saveBtn, saveShadow]} onPress={handleSave} activeOpacity={0.7}>
              <Ionicons name="bookmark-outline" size={18} color="#FFF" />
              <Text style={styles.saveBtnText}>Save to History</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.savedRow}>
              <Ionicons name="checkmark-circle" size={18} color="#34C759" />
              <Text style={styles.savedText}>Saved to History</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.scanAgainBtn, shadow]}
            onPress={() => navigation.replace('Scan')}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={18} color="#1C1C1E" />
            <Text style={styles.scanAgainText}>Scan Another</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const shadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

const saveShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 8,
  elevation: 3,
};

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#EFEFEF' },
  scroll: { flex: 1 },

  hero: { flexDirection: 'row', padding: 16, gap: 14, alignItems: 'flex-start' },
  thumbnail: { width: 100, height: 100, borderRadius: 14, backgroundColor: '#E0E0E5' },
  metaCol: { flex: 1, gap: 8, paddingTop: 4 },

  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  diffDot:  { width: 7, height: 7, borderRadius: 4 },
  diffText: { fontSize: 12, fontWeight: '700' },
  stepsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#EFEFEF',
    alignSelf: 'flex-start',
  },
  stepsText: { fontSize: 12, fontWeight: '600', color: '#6C6C70' },

  section: { paddingHorizontal: 16, marginBottom: 20 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#AEAEB2',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
  questionText: { fontSize: 15, color: '#1C1C1E', lineHeight: 23, fontWeight: '500' },

  answerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#34C759',
  },
  answerText: { flex: 1, fontSize: 17, fontWeight: '700', color: '#1C1C1E', lineHeight: 25 },

  hiddenAnswer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hiddenAnswerText: { flex: 1, fontSize: 14, color: '#6C6C70', fontWeight: '500' },

  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  toggle: { flexDirection: 'row', backgroundColor: '#E0E0E5', borderRadius: 10, padding: 2 },
  toggleOpt: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  toggleOptActive: { backgroundColor: '#FFFFFF' },
  toggleText: { fontSize: 12, fontWeight: '600', color: '#6C6C70' },
  toggleTextActive: { color: '#1C1C1E' },

  askBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 6,
  },
  askBtnText: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },

  practiceQ: { fontSize: 15, color: '#1C1C1E', lineHeight: 22, fontWeight: '500' },
  practiceA: { marginTop: 8, fontSize: 14, color: '#34C759', fontWeight: '700' },
  practiceReveal: { marginTop: 8, fontSize: 13, color: '#007AFF', fontWeight: '600' },

  actions: { paddingHorizontal: 16, gap: 10 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingVertical: 15,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(52,199,89,0.1)',
    borderRadius: 16,
    paddingVertical: 15,
  },
  savedText: { fontSize: 15, fontWeight: '700', color: '#34C759' },
  scanAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 15,
  },
  scanAgainText: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
});
