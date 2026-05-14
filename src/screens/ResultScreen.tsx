import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHistory } from '../hooks/useHistory';
import StepCard from '../components/StepCard';
import SubjectBadge from '../components/SubjectBadge';
import { RootStackParamList } from '../types';

type RouteT = RouteProp<RootStackParamList, 'Result'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const C = {
  bg: '#0B0B0B',
  surface: '#1A1A1A',
  surfaceHigh: '#242424',
  border: '#2C2C2E',
  text: '#FFFFFF',
  textMuted: '#8E8E93',
  success: '#30D158',
};

const DIFF_CONFIG = {
  Easy: { color: '#30D158', bg: 'rgba(48,209,88,0.12)', label: 'Easy' },
  Medium: { color: '#FFD60A', bg: 'rgba(255,214,10,0.12)', label: 'Medium' },
  Hard: { color: '#FF453A', bg: 'rgba(255,69,58,0.12)', label: 'Hard' },
};

export default function ResultScreen() {
  const route = useRoute<RouteT>();
  const navigation = useNavigation<Nav>();
  const { result } = route.params;
  const { saveResult, history } = useHistory();
  const [saved, setSaved] = useState(() => history.some((h) => h.id === result.id));

  const diff = DIFF_CONFIG[result.difficulty];

  const handleSave = async () => {
    if (saved) return;
    await saveResult(result);
    setSaved(true);
    Alert.alert('Saved', 'Added to your history.');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Image + meta */}
        <View style={styles.hero}>
          <Image source={{ uri: result.imageUri }} style={styles.thumbnail} resizeMode="cover" />
          <View style={styles.metaCol}>
            <SubjectBadge subject={result.subject} size="md" />
            <View style={[styles.diffBadge, { backgroundColor: diff.bg }]}>
              <View style={[styles.diffDot, { backgroundColor: diff.color }]} />
              <Text style={[styles.diffText, { color: diff.color }]}>{diff.label}</Text>
            </View>
            <View style={styles.stepsBadge}>
              <Text style={styles.stepsText}>{result.steps.length} steps</Text>
            </View>
          </View>
        </View>

        {/* Question */}
        <View style={styles.section}>
          <Text style={styles.label}>Question</Text>
          <View style={styles.card}>
            <Text style={styles.questionText}>{result.question}</Text>
          </View>
        </View>

        {/* Answer */}
        <View style={styles.section}>
          <Text style={styles.label}>Answer</Text>
          <View style={styles.answerCard}>
            <View style={styles.answerRow}>
              <Ionicons name="checkmark-circle" size={20} color={C.success} />
              <Text style={styles.answerText}>{result.answer}</Text>
            </View>
          </View>
        </View>

        {/* Steps */}
        <View style={styles.section}>
          <Text style={styles.label}>Step-by-Step</Text>
          {result.steps.map((step, i) => (
            <StepCard key={step.stepNumber} step={step} isLast={i === result.steps.length - 1} />
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {!saved ? (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="bookmark-outline" size={18} color="#000" />
              <Text style={styles.saveBtnText}>Save to History</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.savedRow}>
              <Ionicons name="checkmark-circle" size={18} color={C.success} />
              <Text style={styles.savedText}>Saved to History</Text>
            </View>
          )}

          <TouchableOpacity style={styles.scanAgainBtn} onPress={() => navigation.replace('Scan')}>
            <Ionicons name="camera-outline" size={18} color={C.text} />
            <Text style={styles.scanAgainText}>Scan Another</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  hero: {
    flexDirection: 'row',
    padding: 16,
    gap: 14,
    alignItems: 'flex-start',
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
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
  diffDot: { width: 7, height: 7, borderRadius: 4 },
  diffText: { fontSize: 12, fontWeight: '700' },
  stepsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: C.surface,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: C.border,
  },
  stepsText: { fontSize: 12, fontWeight: '600', color: C.textMuted },

  section: { paddingHorizontal: 16, marginBottom: 20 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  questionText: {
    fontSize: 15,
    color: C.text,
    lineHeight: 23,
    fontWeight: '500',
  },
  answerCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A3D2A',
  },
  answerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  answerText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
    lineHeight: 25,
  },

  actions: { paddingHorizontal: 16, gap: 10 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.text,
    borderRadius: 14,
    paddingVertical: 15,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(48,209,88,0.1)',
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: 'rgba(48,209,88,0.25)',
  },
  savedText: { fontSize: 15, fontWeight: '700', color: C.success },
  scanAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: C.border,
  },
  scanAgainText: { fontSize: 15, fontWeight: '700', color: C.text },
});
