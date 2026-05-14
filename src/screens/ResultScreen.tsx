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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHistory } from '../hooks/useHistory';
import StepCard from '../components/StepCard';
import SubjectBadge from '../components/SubjectBadge';
import { RootStackParamList } from '../types';

type RouteT = RouteProp<RootStackParamList, 'Result'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const COLORS = {
  primary: '#6C63FF',
  success: '#48BB78',
  background: '#F8F9FE',
  text: '#2D3748',
  textLight: '#718096',
  white: '#FFFFFF',
  border: '#E2E8F0',
};

const DIFFICULTY_CONFIG = {
  Easy: { color: '#48BB78', bg: '#F0FFF4', icon: 'happy-outline' as const },
  Medium: { color: '#ECC94B', bg: '#FFFFF0', icon: 'remove-circle-outline' as const },
  Hard: { color: '#FC8181', bg: '#FFF5F5', icon: 'flame-outline' as const },
};

export default function ResultScreen() {
  const route = useRoute<RouteT>();
  const navigation = useNavigation<Nav>();
  const { result } = route.params;
  const { saveResult, history } = useHistory();
  const [saved, setSaved] = useState(() => history.some((h) => h.id === result.id));

  const diffConfig = DIFFICULTY_CONFIG[result.difficulty];

  const handleSave = async () => {
    if (saved) return;
    await saveResult(result);
    setSaved(true);
    Alert.alert('Saved!', 'This solution has been added to your history.');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Image + badges row */}
        <View style={styles.imageRow}>
          <Image source={{ uri: result.imageUri }} style={styles.thumbnail} resizeMode="cover" />
          <View style={styles.badgesCol}>
            <SubjectBadge subject={result.subject} size="md" />
            <View style={[styles.diffBadge, { backgroundColor: diffConfig.bg }]}>
              <Ionicons name={diffConfig.icon} size={14} color={diffConfig.color} />
              <Text style={[styles.diffText, { color: diffConfig.color }]}>
                {result.difficulty}
              </Text>
            </View>
            <View style={styles.stepCountBadge}>
              <Ionicons name="list-outline" size={14} color={COLORS.primary} />
              <Text style={styles.stepCountText}>{result.steps.length} steps</Text>
            </View>
          </View>
        </View>

        {/* Question */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Question</Text>
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{result.question}</Text>
          </View>
        </View>

        {/* Answer */}
        <LinearGradient
          colors={['#6C63FF', '#9F97FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.answerGradient}
        >
          <View style={styles.answerHeader}>
            <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
            <Text style={styles.answerLabel}>Answer</Text>
          </View>
          <Text style={styles.answerText}>{result.answer}</Text>
        </LinearGradient>

        {/* Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Step-by-Step Solution</Text>
          <View style={styles.stepsContainer}>
            {result.steps.map((step, index) => (
              <StepCard key={step.stepNumber} step={step} isLast={index === result.steps.length - 1} />
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {!saved ? (
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="bookmark-outline" size={20} color={COLORS.white} />
              <Text style={styles.saveBtnText}>Save to History</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.savedIndicator}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.savedText}>Saved to History</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.scanAgainBtn}
            onPress={() => navigation.replace('Scan')}
          >
            <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
            <Text style={styles.scanAgainText}>Scan Another</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  imageRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 14,
    alignItems: 'flex-start',
  },
  thumbnail: {
    width: 110,
    height: 110,
    borderRadius: 14,
    backgroundColor: '#EEF0F5',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgesCol: {
    flex: 1,
    gap: 8,
    paddingTop: 4,
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  diffText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
    alignSelf: 'flex-start',
  },
  stepCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  questionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  questionText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
    fontWeight: '500',
  },
  answerGradient: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  answerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  answerText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 26,
  },
  stepsContainer: {
    gap: 0,
  },
  actions: {
    paddingHorizontal: 16,
    gap: 12,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 15,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  savedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0FFF4',
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#9AE6B4',
  },
  savedText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.success,
  },
  scanAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  scanAgainText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  bottomPad: {
    height: 32,
  },
});
