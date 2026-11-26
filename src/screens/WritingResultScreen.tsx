import React, { useLayoutEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { generateWriting } from '../services/claudeService';
import { saveWriting } from '../hooks/useWritingHistory';
import { showErrorOrPaywall } from '../utils/limit';
import { RootStackParamList, WritingPiece } from '../types';

type RouteT = RouteProp<RootStackParamList, 'WritingResult'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const TITLES: Record<WritingPiece['mode'], string> = { general: 'Your writing', outline: 'Your outline', essay: 'Your essay', modify: 'Improved text' };
const QUICK = ['Shorten', 'Expand', 'Simplify', 'Fix grammar'] as const;

export default function WritingResultScreen() {
  const navigation = useNavigation<Nav>();
  const [piece, setPiece] = useState(useRoute<RouteT>().params.piece);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: TITLES[piece.mode] });
  }, [navigation, piece.mode]);

  const words = piece.output.split(/\s+/).filter(Boolean).length;

  const copy = async () => {
    await Clipboard.setStringAsync(piece.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const refine = async (change: (typeof QUICK)[number]) => {
    if (busy) return;
    setBusy(change);
    try {
      const output = await generateWriting('modify', { text: piece.output }, { change });
      const next: WritingPiece = { ...piece, id: `w_${Date.now()}`, mode: 'modify', options: { change }, output, createdAt: new Date().toISOString() };
      await saveWriting(next);
      setPiece(next);
    } catch (err) {
      showErrorOrPaywall('Could not change that', err, () => refine(change));
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.meta}>
          {words} words · from “{piece.prompt.length > 60 ? piece.prompt.slice(0, 60) + '…' : piece.prompt}”
        </Text>
        <View style={styles.card}>
          <Text style={styles.output} selectable>{piece.output}</Text>
        </View>
        <View style={styles.note}>
          <Ionicons name="bulb-outline" size={16} color="#6C6C70" />
          <Text style={styles.noteText}>Use this as a starting point. Put it in your own words and check your school's rules on AI help.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {QUICK.map((q) => (
            <TouchableOpacity key={q} style={[styles.quick, !!busy && busy !== q && { opacity: 0.4 }]} onPress={() => refine(q)} disabled={!!busy}>
              {busy === q ? <ActivityIndicator size="small" color="#1C1C1E" /> : <Text style={styles.quickText}>{q}</Text>}
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.copy} onPress={copy} activeOpacity={0.8}>
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color="#FFF" />
          <Text style={styles.copyText}>{copied ? 'Copied' : 'Copy text'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F9' },
  content: { padding: 16, paddingBottom: 24 },
  meta: { fontSize: 12, fontWeight: '600', color: '#8E8E93', marginBottom: 10 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18 },
  output: { fontSize: 16, lineHeight: 25, color: '#1C1C1E' },
  note: { flexDirection: 'row', gap: 8, marginTop: 14, paddingHorizontal: 4 },
  noteText: { flex: 1, fontSize: 12, color: '#6C6C70', lineHeight: 17 },
  footer: { padding: 16, gap: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  quick: { paddingHorizontal: 14, height: 36, borderRadius: 12, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center', minWidth: 70 },
  quickText: { fontSize: 13, fontWeight: '700', color: '#1C1C1E' },
  copy: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1C1C1E', borderRadius: 16, paddingVertical: 15 },
  copyText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
