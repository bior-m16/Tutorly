import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { generateWriting } from '../services/claudeService';
import { loadWriting, saveWriting } from '../hooks/useWritingHistory';
import { showErrorOrPaywall } from '../utils/limit';
import { showAlert } from '../utils/alert';
import { RootStackParamList, WriteMode, WriteOptions, WritingPiece } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type OptionKey = keyof WriteOptions;

const TYPES = ['Auto', 'Expository', 'Reflective', 'Argumentative', 'Descriptive', 'Analytical', 'Comparative', 'Narrative'];
const LEVELS = ['Foundation', 'Intermediate', 'Advanced'];

const TABS: {
  mode: WriteMode;
  label: string;
  placeholder: string;
  groups: { key: OptionKey; label: string; values: string[]; hints?: Record<string, string> }[];
}[] = [
  {
    mode: 'general',
    label: 'General',
    placeholder: 'What do you need written? e.g. an email to my teacher asking for an extension',
    groups: [
      { key: 'format', label: 'Format', values: ['General', 'Email', 'Essay topic ideas', 'Academic', 'Business', 'Creative', 'Blog'] },
      { key: 'tone', label: 'Tone', values: ['Auto', 'Formal', 'Neutral', 'Casual'] },
    ],
  },
  {
    mode: 'outline',
    label: 'Outline',
    placeholder: 'Jot down your topic and ideas, and get a clear outline to write from…',
    groups: [
      { key: 'type', label: 'Type', values: TYPES },
      { key: 'level', label: 'Level', values: LEVELS },
      { key: 'paragraphs', label: 'Body paragraphs', values: ['3', '4', '5', '6'] },
    ],
  },
  {
    mode: 'essay',
    label: 'Essay',
    placeholder: 'Describe your essay topic or paste the prompt…',
    groups: [
      { key: 'type', label: 'Type', values: TYPES },
      { key: 'level', label: 'Level', values: LEVELS },
      { key: 'length', label: 'Length', values: ['Short', 'Medium', 'Long'], hints: { Short: '~300 words', Medium: '~500 words', Long: '~800 words' } },
    ],
  },
  {
    mode: 'modify',
    label: 'Improve',
    placeholder: 'Paste your own writing here…',
    groups: [{ key: 'change', label: 'What should change?', values: ['Expand', 'Shorten', 'Continue writing', 'Rewrite', 'Fix grammar', 'Simplify'] }],
  },
];

const DEFAULTS: Record<WriteMode, WriteOptions> = {
  general: { format: 'General', tone: 'Auto' },
  outline: { type: 'Auto', level: 'Foundation', paragraphs: '3' },
  essay: { type: 'Auto', level: 'Foundation', length: 'Short' },
  modify: { change: 'Expand' },
};

const MODE_LABEL: Record<WriteMode, string> = { general: 'General', outline: 'Outline', essay: 'Essay', modify: 'Improve' };

export default function WritingScreen() {
  const navigation = useNavigation<Nav>();
  const [mode, setMode] = useState<WriteMode>('general');
  const [texts, setTexts] = useState<Record<WriteMode, string>>({ general: '', outline: '', essay: '', modify: '' });
  const [options, setOptions] = useState<Record<WriteMode, WriteOptions>>(DEFAULTS);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<WritingPiece[] | null>(null);

  const tab = TABS.find((t) => t.mode === mode)!;
  const text = texts[mode];
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

  const generate = async () => {
    if (!canGo) return;
    setLoading(true);
    try {
      const output = await generateWriting(mode, { text, imageUri: imageUri ?? undefined }, options[mode]);
      const piece: WritingPiece = {
        id: `w_${Date.now()}`,
        mode,
        prompt: text.trim() || 'From a photo',
        options: options[mode],
        output,
        createdAt: new Date().toISOString(),
      };
      await saveWriting(piece);
      navigation.navigate('WritingResult', { piece });
    } catch (err) {
      showErrorOrPaywall('Could not write that', err, generate);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.roundBtn} onPress={() => navigation.goBack()} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={22} color="#1C1C1E" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.roundBtn} onPress={async () => setHistory(await loadWriting())} accessibilityLabel="Writing history">
          <Ionicons name="time-outline" size={21} color="#1C1C1E" />
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Writing helper</Text>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.mode} onPress={() => setMode(t.mode)} style={styles.tab}>
            <Text style={[styles.tabText, mode === t.mode && styles.tabTextOn]}>{t.label}</Text>
            <View style={[styles.tabBar, mode === t.mode && styles.tabBarOn]} />
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <View style={styles.inputCard}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={(v) => setTexts((s) => ({ ...s, [mode]: v }))}
              placeholder={tab.placeholder}
              placeholderTextColor="#AEAEB2"
              multiline
              textAlignVertical="top"
            />
            {imageUri ? (
              <View style={styles.attached}>
                <Image source={{ uri: imageUri }} style={styles.thumb} />
                <Text style={styles.attachedText}>Photo attached</Text>
                <TouchableOpacity onPress={() => setImageUri(null)} accessibilityLabel="Remove photo">
                  <Ionicons name="close-circle" size={22} color="#8E8E93" />
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={styles.attachRow}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => pickImage(false)} accessibilityLabel="Add a photo">
                <Ionicons name="image-outline" size={20} color="#1C1C1E" />
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={styles.cameraBtn} onPress={() => pickImage(true)}>
                <Ionicons name="camera" size={16} color="#1C1C1E" />
                <Text style={styles.cameraText}>Take a photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {tab.groups.map((g) => (
            <View key={g.key} style={{ marginTop: 18 }}>
              <Text style={styles.groupLabel}>{g.label}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
                {g.values.map((v) => {
                  const on = options[mode][g.key] === v;
                  return (
                    <TouchableOpacity
                      key={v}
                      style={[styles.chip, on && styles.chipOn]}
                      onPress={() => setOptions((o) => ({ ...o, [mode]: { ...o[mode], [g.key]: v } }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{v}</Text>
                      {g.hints?.[v] ? <Text style={[styles.chipHint, on && { color: '#C7C7CC' }]}>{g.hints[v]}</Text> : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.generate, !canGo && { opacity: 0.35 }]} onPress={generate} disabled={!canGo} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="#FFF" />
                <Text style={styles.generateText}>Write it</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={history !== null} transparent animationType="slide" onRequestClose={() => setHistory(null)}>
        <Pressable style={styles.backdrop} onPress={() => setHistory(null)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Your writing</Text>
          <ScrollView style={{ maxHeight: 420, marginTop: 8 }}>
            {history?.length === 0 ? <Text style={styles.empty}>Pieces you write will be saved here.</Text> : null}
            {history?.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.histRow}
                onPress={() => {
                  setHistory(null);
                  navigation.navigate('WritingResult', { piece: p });
                }}
              >
                <Text style={styles.histMode}>{MODE_LABEL[p.mode]}</Text>
                <Text style={styles.histPrompt} numberOfLines={1}>{p.prompt}</Text>
                <Text style={styles.histOut} numberOfLines={2}>{p.output.replace(/\s+/g, ' ')}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 4 },
  roundBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 30, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5, paddingHorizontal: 16, marginTop: 12 },
  tabs: { flexDirection: 'row', gap: 20, paddingHorizontal: 16, marginTop: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  tab: { paddingTop: 6 },
  tabText: { fontSize: 16, fontWeight: '700', color: '#8E8E93' },
  tabTextOn: { color: '#1C1C1E' },
  tabBar: { height: 3, borderRadius: 2, marginTop: 8, backgroundColor: 'transparent' },
  tabBarOn: { backgroundColor: '#1C1C1E' },
  body: { flex: 1, backgroundColor: '#F7F7F9' },
  inputCard: { margin: 16, marginBottom: 0, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14 },
  input: { minHeight: 150, fontSize: 16, lineHeight: 23, color: '#1C1C1E', ...(Platform.OS === 'web' ? ({ outlineWidth: 0 } as object) : {}) },
  attached: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, padding: 8, borderRadius: 12, backgroundColor: '#F2F2F7' },
  thumb: { width: 40, height: 40, borderRadius: 8 },
  attachedText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  attachRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  cameraBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 40, borderRadius: 12, backgroundColor: '#F2F2F7' },
  cameraText: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
  groupLabel: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', marginBottom: 10, paddingHorizontal: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center' },
  chipOn: { backgroundColor: '#1C1C1E' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  chipTextOn: { color: '#FFFFFF' },
  chipHint: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', backgroundColor: '#FFFFFF' },
  generate: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1C1C1E', borderRadius: 16, paddingVertical: 16 },
  generateText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: '#1C1C1E' },
  empty: { fontSize: 14, color: '#6C6C70', paddingVertical: 16 },
  histRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  histMode: { fontSize: 11, fontWeight: '800', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.8 },
  histPrompt: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', marginTop: 2 },
  histOut: { fontSize: 13, color: '#6C6C70', marginTop: 2, lineHeight: 18 },
});
