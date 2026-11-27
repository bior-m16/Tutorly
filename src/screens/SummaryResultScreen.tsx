import React, { useLayoutEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { generateFlashcards, generateQuiz, summaryToText } from '../services/claudeService';
import { saveDeck } from '../hooks/useDecks';
import { showErrorOrPaywall } from '../utils/limit';
import { RootStackParamList } from '../types';
import { glow } from '../theme';

type RouteT = RouteProp<RootStackParamList, 'SummaryResult'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SummaryResultScreen() {
  const { summary } = useRoute<RouteT>().params;
  const navigation = useNavigation<Nav>();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<null | 'cards' | 'quiz'>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Summary' });
  }, [navigation]);

  const asText = summaryToText(summary);

  const copy = async () => {
    await Clipboard.setStringAsync(asText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const study = async (kind: 'cards' | 'quiz') => {
    if (busy) return;
    setBusy(kind);
    const topic = asText.slice(0, 3900);
    try {
      if (kind === 'cards') {
        const deck = await generateFlashcards({ topic });
        await saveDeck({ ...deck, title: deck.title || summary.title });
        navigation.navigate('Flashcards', { deck });
      } else {
        const quiz = await generateQuiz({ topic });
        navigation.navigate('Quiz', { quiz });
      }
    } catch (err) {
      showErrorOrPaywall(kind === 'cards' ? 'Could not make flashcards' : 'Could not make a quiz', err, () => study(kind));
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{summary.title}</Text>
          <TouchableOpacity style={styles.copyBtn} onPress={copy} accessibilityLabel="Copy summary">
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color="#1D1A33" />
          </TouchableOpacity>
        </View>

        {summary.tldr ? (
          <View style={styles.tldr}>
            <Text style={styles.tldrLabel}>In short</Text>
            <Text style={styles.tldrText}>{summary.tldr}</Text>
          </View>
        ) : null}

        {summary.points.length > 0 ? (
          <>
            <Text style={styles.section}>Key points</Text>
            <View style={styles.card}>
              {summary.points.map((p, i) => (
                <View key={i} style={[styles.point, i > 0 && styles.pointBorder]}>
                  <View style={styles.num}>
                    <Text style={styles.numText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.pointText}>{p}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {summary.terms.length > 0 ? (
          <>
            <Text style={styles.section}>Words to know</Text>
            <View style={styles.terms}>
              {summary.terms.map((t, i) => (
                <View key={i} style={styles.term}>
                  <Text style={styles.termName}>{t.term}</Text>
                  <Text style={styles.termMeaning}>{t.meaning}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.source} numberOfLines={2}>Summarised from: {summary.source}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Study this</Text>
        <View style={styles.footerRow}>
          <TouchableOpacity style={[styles.action, busy === 'quiz' && { opacity: 0.4 }]} onPress={() => study('cards')} disabled={!!busy} activeOpacity={0.8}>
            {busy === 'cards' ? <ActivityIndicator color="#FFF" /> : <><Ionicons name="albums-outline" size={18} color="#FFF" /><Text style={styles.actionText}>Make flashcards</Text></>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.action, styles.actionLight, busy === 'cards' && { opacity: 0.4 }]} onPress={() => study('quiz')} disabled={!!busy} activeOpacity={0.8}>
            {busy === 'quiz' ? <ActivityIndicator color="#1D1A33" /> : <><Ionicons name="help-buoy-outline" size={18} color="#1D1A33" /><Text style={[styles.actionText, { color: '#1D1A33' }]}>Quiz me</Text></>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F5' },
  content: { padding: 16, paddingBottom: 24 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { flex: 1, fontSize: 24, fontWeight: '800', color: '#1D1A33', letterSpacing: -0.3, lineHeight: 30 },
  copyBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  tldr: { marginTop: 16, backgroundColor: '#6A4CFF', ...glow('#7A5CFF', 16, 0.35), borderRadius: 18, padding: 16 },
  tldrLabel: { fontSize: 11, fontWeight: '800', color: '#ADA7C2', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  tldrText: { fontSize: 16, lineHeight: 23, color: '#FFFFFF', fontWeight: '500' },
  section: { fontSize: 18, fontWeight: '700', color: '#1D1A33', marginTop: 22, marginBottom: 10 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 14 },
  point: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  pointBorder: { borderTopWidth: 1, borderTopColor: 'rgba(106,76,255,0.10)' },
  num: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F4ECFF', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  numText: { fontSize: 12, fontWeight: '800', color: '#1D1A33' },
  pointText: { flex: 1, fontSize: 15, lineHeight: 22, color: '#1D1A33' },
  terms: { gap: 8 },
  term: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12 },
  termName: { fontSize: 15, fontWeight: '800', color: '#1D1A33' },
  termMeaning: { fontSize: 14, color: '#3A3A3C', marginTop: 3, lineHeight: 20 },
  source: { fontSize: 12, color: '#8D86A6', marginTop: 18 },
  footer: { padding: 16, paddingTop: 10, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: 'rgba(106,76,255,0.10)' },
  footerLabel: { fontSize: 11, fontWeight: '700', color: '#ADA7C2', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  footerRow: { flexDirection: 'row', gap: 10 },
  action: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6A4CFF', ...glow('#7A5CFF', 16, 0.35), borderRadius: 16, paddingVertical: 15 },
  actionLight: { backgroundColor: '#F4EFFF' },
  actionText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
