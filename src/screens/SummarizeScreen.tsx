import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { summarize } from '../services/claudeService';
import { loadSummaries, saveSummary } from '../hooks/useSummaries';
import { showErrorOrPaywall } from '../utils/limit';
import { showAlert } from '../utils/alert';
import { RootStackParamList, Summary } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Length = 'Brief' | 'Standard' | 'Detailed';

const MAX_CHARS = 12000;
const LENGTHS: { value: Length; hint: string }[] = [
  { value: 'Brief', hint: '3–4 points' },
  { value: 'Standard', hint: '5–7 points' },
  { value: 'Detailed', hint: '8–12 points' },
];

export default function SummarizeScreen() {
  const navigation = useNavigation<Nav>();
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [length, setLength] = useState<Length>('Standard');
  const [simple, setSimple] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<Summary[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadSummaries().then(setRecent);
    }, []),
  );

  const canGo = (text.trim().length > 0 || !!imageUri) && !loading;

  const pickImage = async (camera: boolean) => {
    if (camera && Platform.OS !== 'web') {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        showAlert('Camera access needed', 'Allow camera access in Settings to take a photo.');
        return;
      }
    }
    const opts = { mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 };
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets[0]?.uri) setImageUri(res.assets[0].uri);
  };

  const go = async () => {
    if (!canGo) return;
    setLoading(true);
    try {
      const summary = await summarize({ text, imageUri: imageUri ?? undefined }, { length, simple });
      await saveSummary(summary);
      navigation.navigate('SummaryResult', { summary });
    } catch (err) {
      showErrorOrPaywall('Could not summarise that', err, go);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.lead}>Paste a chapter, an article or your notes, or snap a page. Get the gist, the key points and the words to learn.</Text>

          <View style={styles.card}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={(v) => setText(v.slice(0, MAX_CHARS))}
              placeholder="Paste the text you want summarised…"
              placeholderTextColor="#AEAEB2"
              multiline
              textAlignVertical="top"
            />
            {imageUri ? (
              <View style={styles.attached}>
                <Image source={{ uri: imageUri }} style={styles.thumb} />
                <Text style={styles.attachedText}>Page photo attached</Text>
                <TouchableOpacity onPress={() => setImageUri(null)} accessibilityLabel="Remove photo">
                  <Ionicons name="close-circle" size={22} color="#8E8E93" />
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={styles.row}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => pickImage(false)} accessibilityLabel="Add a photo">
                <Ionicons name="image-outline" size={20} color="#1C1C1E" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.pill} onPress={() => pickImage(true)}>
                <Ionicons name="camera" size={16} color="#1C1C1E" />
                <Text style={styles.pillText}>Snap a page</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <Text style={styles.count}>{text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}</Text>
            </View>
          </View>

          <Text style={styles.label}>Length</Text>
          <View style={styles.segment}>
            {LENGTHS.map((l) => (
              <TouchableOpacity key={l.value} style={[styles.seg, length === l.value && styles.segOn]} onPress={() => setLength(l.value)}>
                <Text style={[styles.segText, length === l.value && styles.segTextOn]}>{l.value}</Text>
                <Text style={[styles.segHint, length === l.value && { color: '#C7C7CC' }]}>{l.hint}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.card, styles.switchRow]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Explain it simply</Text>
              <Text style={styles.switchSub}>Plain words, as if for a 12-year-old</Text>
            </View>
            <Switch value={simple} onValueChange={setSimple} trackColor={{ true: '#1C1C1E', false: '#D1D1D6' }} thumbColor="#FFFFFF" {...(Platform.OS === 'web' ? ({ activeThumbColor: '#FFFFFF' } as object) : {})} />
          </View>

          {recent.length > 0 ? (
            <>
              <Text style={styles.label}>Recent summaries</Text>
              <View style={styles.card}>
                {recent.slice(0, 5).map((s, i) => (
                  <React.Fragment key={s.id}>
                    {i > 0 ? <View style={styles.sep} /> : null}
                    <TouchableOpacity style={styles.recent} onPress={() => navigation.navigate('SummaryResult', { summary: s })}>
                      <View style={styles.recentIcon}>
                        <Ionicons name="document-text-outline" size={18} color="#1C1C1E" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recentTitle} numberOfLines={1}>{s.title}</Text>
                        <Text style={styles.recentSub} numberOfLines={1}>{s.tldr}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#AEAEB2" />
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.go, !canGo && { opacity: 0.35 }]} onPress={go} disabled={!canGo} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="#FFF" />
                <Text style={styles.goText}>Summarize</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFEFEF' },
  content: { padding: 16, paddingBottom: 24 },
  lead: { fontSize: 15, color: '#6C6C70', lineHeight: 21, marginBottom: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14 },
  input: { minHeight: 160, fontSize: 15, lineHeight: 22, color: '#1C1C1E', ...(Platform.OS === 'web' ? ({ outlineWidth: 0 } as object) : {}) },
  attached: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, padding: 8, borderRadius: 12, backgroundColor: '#F2F2F7' },
  thumb: { width: 40, height: 40, borderRadius: 8 },
  attachedText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 38, borderRadius: 12, backgroundColor: '#F2F2F7' },
  pillText: { fontSize: 13, fontWeight: '700', color: '#1C1C1E' },
  count: { fontSize: 11, color: '#AEAEB2', fontWeight: '600' },
  label: { fontSize: 11, fontWeight: '700', color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 8 },
  segment: { flexDirection: 'row', gap: 8 },
  seg: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
  segOn: { backgroundColor: '#1C1C1E' },
  segText: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
  segTextOn: { color: '#FFFFFF' },
  segHint: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  switchTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  switchSub: { fontSize: 12, color: '#6C6C70', marginTop: 2 },
  sep: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: 6, marginLeft: 46 },
  recent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recentIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F4ECFF', alignItems: 'center', justifyContent: 'center' },
  recentTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  recentSub: { fontSize: 12, color: '#6C6C70', marginTop: 1 },
  footer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  go: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1C1C1E', borderRadius: 16, paddingVertical: 16 },
  goText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
