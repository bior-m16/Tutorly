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

  const handleSave = async () => {
    if (saved) return;
    await saveResult(result);
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
          <View style={[styles.answerCard, shadow]}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#34C759" style={{ marginTop: 2 }} />
            <Text style={styles.answerText}>{result.answer}</Text>
          </View>
        </View>

        {/* Steps */}
        <View style={styles.section}>
          <Text style={styles.label}>Step-by-Step</Text>
          {result.steps.map((step, i) => (
            <StepCard
              key={step.stepNumber}
              step={step}
              isLast={i === result.steps.length - 1}
            />
          ))}
        </View>

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
