import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHistory } from '../hooks/useHistory';
import ScanButton from '../components/ScanButton';
import HistoryItem from '../components/HistoryItem';
import { RootStackParamList, Subject } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SUBJECTS: { label: Subject; icon: string }[] = [
  { label: 'Math', icon: '∑' },
  { label: 'Physics', icon: '⚛' },
  { label: 'Chemistry', icon: '⚗' },
  { label: 'Biology', icon: '🧬' },
  { label: 'History', icon: '📜' },
  { label: 'Literature', icon: '📖' },
];

const C = {
  bg: '#0B0B0B',
  surface: '#1A1A1A',
  surfaceHigh: '#242424',
  border: '#2C2C2E',
  text: '#FFFFFF',
  textMuted: '#8E8E93',
  textDim: '#48484A',
  accent: '#FFFFFF',
  accentDim: 'rgba(255,255,255,0.08)',
};

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { history, deleteResult, reload } = useHistory();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  const recentItems = history.slice(0, 3);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>Tutorly</Text>
            <Text style={styles.tagline}>AI Homework Helper</Text>
          </View>
          <View style={styles.statsBubble}>
            <Text style={styles.statsNumber}>{history.length}</Text>
            <Text style={styles.statsLabel}>solved</Text>
          </View>
        </View>

        {/* Scan card */}
        <View style={styles.scanCard}>
          <ScanButton onPress={() => navigation.navigate('Scan')} size={80} />
          <Text style={styles.scanTitle}>Scan a Problem</Text>
          <Text style={styles.scanSubtitle}>
            Point your camera at any homework question for instant step-by-step help
          </Text>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.galleryBtn}
            onPress={() => navigation.navigate('Scan')}
          >
            <Ionicons name="images-outline" size={17} color={C.textMuted} />
            <Text style={styles.galleryBtnText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Subject chips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subjects</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {SUBJECTS.map((s) => (
              <TouchableOpacity
                key={s.label}
                style={styles.chip}
                onPress={() => navigation.navigate('Scan')}
                activeOpacity={0.6}
              >
                <Text style={styles.chipIcon}>{s.icon}</Text>
                <Text style={styles.chipLabel}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recent */}
        {recentItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent</Text>
              <TouchableOpacity onPress={() => navigation.getParent()?.navigate('History')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {recentItems.map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                onPress={() => navigation.navigate('Result', { result: item })}
                onDelete={() => deleteResult(item.id)}
              />
            ))}
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
  },
  statsBubble: {
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  statsNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
  },
  statsLabel: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '600',
  },
  scanCard: {
    marginHorizontal: 16,
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 24,
  },
  scanTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: C.text,
    marginTop: 18,
  },
  scanSubtitle: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 19,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    width: '100%',
    marginVertical: 18,
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: C.surfaceHigh,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  galleryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textMuted,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textMuted,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipIcon: { fontSize: 13 },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textMuted,
  },
  bottomPad: { height: 32 },
});
