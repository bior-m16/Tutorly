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

const SUBJECTS: { label: Subject; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Math', icon: 'calculator-outline' },
  { label: 'Physics', icon: 'planet-outline' },
  { label: 'Chemistry', icon: 'flask-outline' },
  { label: 'Biology', icon: 'leaf-outline' },
  { label: 'History', icon: 'library-outline' },
  { label: 'Literature', icon: 'book-outline' },
];

export const C = {
  bg: '#EFEFEF',
  surface: '#FFFFFF',
  surfacePressed: '#F5F5F5',
  border: 'rgba(0,0,0,0.06)',
  text: '#1C1C1E',
  textSub: '#6C6C70',
  textMuted: '#AEAEB2',
  accent: '#1C1C1E',
  shadow: '#000',
};

export const shadow = {
  card: {
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 4,
  },
  btn: {
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
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
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>Tutorly</Text>
            <Text style={styles.tagline}>AI Homework Helper</Text>
          </View>
          <View style={[styles.statsBubble, shadow.btn]}>
            <Text style={styles.statsNumber}>{history.length}</Text>
            <Text style={styles.statsLabel}>Solved</Text>
          </View>
        </View>

        {/* Scan card */}
        <View style={[styles.scanCard, shadow.card]}>
          <ScanButton onPress={() => navigation.navigate('Scan')} size={80} />
          <Text style={styles.scanTitle}>Scan a Problem</Text>
          <Text style={styles.scanSubtitle}>
            Point your camera at any homework question{'\n'}for instant step-by-step help
          </Text>
          <View style={styles.divider} />
          <TouchableOpacity
            style={[styles.galleryBtn, shadow.btn]}
            onPress={() => navigation.navigate('Scan')}
            activeOpacity={0.7}
          >
            <Ionicons name="images-outline" size={20} color={C.textSub} />
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
                style={[styles.chip, shadow.btn]}
                onPress={() => navigation.navigate('Scan')}
                activeOpacity={0.7}
              >
                <Ionicons name={s.icon} size={15} color={C.textSub} />
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

        <View style={{ height: 32 }} />
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
    paddingTop: 18,
    paddingBottom: 22,
  },
  brandName: {
    fontSize: 30,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    color: C.textSub,
    marginTop: 2,
    fontWeight: '500',
  },
  statsBubble: {
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 11,
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
  },
  statsLabel: {
    fontSize: 11,
    color: C.textSub,
    fontWeight: '600',
    marginTop: 1,
  },

  scanCard: {
    marginHorizontal: 16,
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 28,
  },
  scanTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    marginTop: 18,
    letterSpacing: -0.3,
  },
  scanSubtitle: {
    fontSize: 14,
    color: C.textSub,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    width: '100%',
    marginVertical: 20,
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: C.bg,
    borderRadius: 18,
    width: '100%',
    justifyContent: 'center',
  },
  galleryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textSub,
  },

  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  seeAll: { fontSize: 14, fontWeight: '600', color: C.textSub },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: C.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSub,
  },
});
