import React, { useCallback, useState } from 'react';
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
import { RootStackParamList } from '../types';
import { purchasesAvailable, hasPlus, showPaywall } from '../services/subscriptions';
import GlowBackdrop from '../components/GlowBackdrop';
import { LinearGradient } from 'expo-linear-gradient';
import { C, NEON, glow } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Tool = {
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  accent: string;
  go?: (nav: Nav) => void;
};

const TOOLS: Tool[] = [
  { label: 'Quiz Me', sub: 'Test yourself on any topic', icon: 'help-buoy-outline', tint: '#EAF0FF', accent: '#3D6BFF', go: (n) => n.navigate('StudySetup', { kind: 'quiz' }) },
  { label: 'Type it', sub: 'Solve a typed question', icon: 'create-outline', tint: '#F1E9FF', accent: '#7A5CFF', go: (n) => n.navigate('TypeQuestion') },
  { label: 'Flashcards', sub: 'Flip through key ideas', icon: 'albums-outline', tint: '#FFE8F4', accent: '#E0449A', go: (n) => n.navigate('StudySetup', { kind: 'flashcards' }) },
  { label: 'Calculator', sub: 'Scientific and unit converter', icon: 'calculator-outline', tint: '#FFF0E6', accent: '#F07A3C', go: (n) => n.navigate('Calculator') },
  { label: 'Summarize', sub: 'Key points from any text', icon: 'document-text-outline', tint: '#F1E9FF', accent: '#9B5CFF', go: (n) => n.navigate('Summarize') },
  { label: 'Writing help', sub: 'Essays, outlines, emails', icon: 'pencil-outline', tint: '#EAF0FF', accent: '#5B5BFF', go: (n) => n.navigate('Writing') },
];

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { history, deleteResult, reload } = useHistory();

  useFocusEffect(
    useCallback(() => { void reload(); }, [reload])
  );

  const recentItems = history.slice(0, 3);

  const [plus, setPlus] = useState(false);
  useFocusEffect(
    useCallback(() => {
      if (purchasesAvailable()) hasPlus().then(setPlus).catch(() => {});
    }, [])
  );
  const goPlus = async () => {
    if (await showPaywall().catch(() => false)) setPlus(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F5" />
      <GlowBackdrop />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Tutorly<Text style={styles.brandDot}>.</Text></Text>
            <Text style={styles.tagline}>AI Homework Helper</Text>
          </View>
          <View style={[styles.statsBubble, shadow.btn]}>
            <Text style={styles.statsNum}>{history.length}</Text>
            <Text style={styles.statsLabel}>Solved</Text>
          </View>
        </View>

        {/* Ask bar */}
        <TouchableOpacity
          style={[styles.askBar, shadow.btn]}
          onPress={() => navigation.navigate('TypeQuestion')}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={18} color="#ADA7C2" />
          <Text style={styles.askText}>Ask any homework question…</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Scan')} hitSlop={10}>
            <Ionicons name="camera-outline" size={20} color="#1D1A33" />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Scan card */}
        <View style={[styles.scanCard, shadow.card]}>
          <LinearGradient
            colors={['rgba(61,107,255,0.07)', 'rgba(155,92,255,0.05)', 'rgba(255,93,177,0.07)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
          />
          <ScanButton onPress={() => navigation.navigate('Scan')} size={80} />
          <Text style={styles.scanTitle}>Scan a Problem</Text>
          <Text style={styles.scanSub}>
            Point your camera at any homework question{'\n'}for instant step-by-step help
          </Text>
          <View style={styles.divider} />
          <TouchableOpacity
            style={[styles.galleryBtn, shadow.btn]}
            onPress={() => navigation.navigate('Scan')}
            activeOpacity={0.7}
          >
            <Ionicons name="images-outline" size={20} color="#6B6585" />
            <Text style={styles.galleryBtnText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Plus upsell */}
        {purchasesAvailable() && !plus ? (
          <TouchableOpacity style={[styles.plusCard, glow(C.pink, 18, 0.3)]} onPress={goPlus} activeOpacity={0.8}>
            <LinearGradient colors={[...NEON]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]} />
            <Ionicons name="sparkles" size={20} color="#FFD60A" />
            <View style={{ flex: 1 }}>
              <Text style={styles.plusTitle}>Tutorly Plus</Text>
              <Text style={styles.plusSub}>Unlimited solutions. Free plan: 5 a day.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        ) : null}

        {/* Study tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study tools</Text>
          <View style={styles.grid}>
            {TOOLS.map((t) => (
              <TouchableOpacity
                key={t.label}
                style={[styles.tool, shadow.btn, !t.go && { opacity: 0.55 }]}
                onPress={() => t.go?.(navigation)}
                disabled={!t.go}
                activeOpacity={0.75}
              >
                <View style={[styles.toolIcon, { backgroundColor: t.tint }]}>
                  <Ionicons name={t.icon} size={22} color={t.accent} />
                </View>
                <Text style={styles.toolLabel}>{t.label}</Text>
                <Text style={styles.toolSub}>{t.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent */}
        {recentItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
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

const shadow = {
  card: glow(C.neon, 22, 0.14),
  btn: glow(C.neon, 12, 0.10),
};

const styles = StyleSheet.create({
  plusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  plusTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  plusSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },

  safe:   { flex: 1, backgroundColor: '#FFF8F5' },
  scroll: { flex: 1, backgroundColor: 'transparent' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
  },
  brand:     { fontSize: 30, fontWeight: '800', color: '#1D1A33', letterSpacing: -0.5 },
  brandDot:  { color: '#FF5DB1' },
  tagline:   { fontSize: 13, color: '#6B6585', marginTop: 2, fontWeight: '500' },
  statsBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 11,
    alignItems: 'center',
  },
  statsNum:   { fontSize: 22, fontWeight: '800', color: '#1D1A33' },
  statsLabel: { fontSize: 11, color: '#6B6585', fontWeight: '600', marginTop: 1 },

  scanCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(122,92,255,0.12)',
  },
  scanTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1D1A33',
    marginTop: 18,
    letterSpacing: -0.3,
  },
  scanSub: {
    fontSize: 14,
    color: '#6B6585',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(106,76,255,0.10)',
    width: '100%',
    marginVertical: 20,
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#FFF8F5',
    borderRadius: 18,
    width: '100%',
    justifyContent: 'center',
  },
  galleryBtnText: { fontSize: 15, fontWeight: '600', color: '#6B6585' },

  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1A33',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  seeAll: { fontSize: 14, fontWeight: '700', color: '#6A4CFF' },

  askBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
  },
  askText: { flex: 1, fontSize: 15, color: '#ADA7C2' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  tool: { width: '48.3%', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14 },
  toolIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  toolLabel: { fontSize: 15, fontWeight: '700', color: '#1D1A33' },
  toolSub: { fontSize: 12, color: '#6B6585', marginTop: 2 },
});
