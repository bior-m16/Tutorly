import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { tutorChat } from '../services/claudeService';
import { canListen, listen, Listening } from '../services/voice';
import { deleteTutorChat, loadTutorChats, saveTutorChat } from '../hooks/useTutorChats';
import { showErrorOrPaywall } from '../utils/limit';
import { showAlert } from '../utils/alert';
import { RootStackParamList, TutorChat, TutorTurn } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Kind = 'study' | 'chat';
type StudyStyle = 'study_fast' | 'study_guided';

const STYLES: Record<StudyStyle, { label: string; detail: string; icon: keyof typeof Ionicons.glyphMap }> = {
  study_fast: { label: 'Quick answers', detail: 'The answer first, then a clear explanation', icon: 'flash-outline' },
  study_guided: { label: 'Coach me', detail: 'Hints and questions so you work it out yourself', icon: 'compass-outline' },
};

type Starter = { label: string; icon: keyof typeof Ionicons.glyphMap } & (
  | { prompt: string }
  | { tool: 'flashcards' | 'quiz' }
);

const STARTERS: Record<Kind, Starter[]> = {
  study: [
    { label: 'Make flashcards on a topic', icon: 'albums-outline', tool: 'flashcards' },
    { label: 'Quiz me before a test', icon: 'checkmark-done-outline', tool: 'quiz' },
    { label: 'Explain photosynthesis like I am 12', icon: 'leaf-outline', prompt: 'Explain photosynthesis like I am 12.' },
    { label: 'When do I use the quadratic formula?', icon: 'calculator-outline', prompt: 'When should I use the quadratic formula, and how does it work?' },
  ],
  chat: [
    { label: 'Plan my study week', icon: 'calendar-outline', prompt: 'Help me plan a realistic study schedule for this week.' },
    { label: 'Ideas for a science fair project', icon: 'bulb-outline', prompt: 'Give me five fun science fair project ideas I could do at home.' },
    { label: 'Write a message to my teacher', icon: 'mail-outline', prompt: 'Help me write a polite message to my teacher asking for an extension.' },
    { label: 'Tips to stay focused', icon: 'timer-outline', prompt: 'What are some simple tips to stay focused while studying?' },
  ],
};

function newChat(mode: TutorChat['mode']): TutorChat {
  return { id: `${Date.now()}`, mode, title: '', turns: [], updatedAt: Date.now() };
}

function titleFrom(text: string): string {
  const t = text.trim().replace(/\s+/g, ' ');
  return t.length > 48 ? `${t.slice(0, 45)}...` : t || 'Photo question';
}

export default function TutorScreen() {
  const navigation = useNavigation<Nav>();
  const [kind, setKind] = useState<Kind>('study');
  const [studyStyle, setStudyStyle] = useState<StudyStyle>('study_fast');
  const [chat, setChat] = useState<TutorChat>(() => newChat('study_fast'));
  const [input, setInput] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [failed, setFailed] = useState(false);
  const [styleMenu, setStyleMenu] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saved, setSaved] = useState<TutorChat[]>([]);
  const [listening, setListening] = useState<Listening | null>(null);
  const scroll = useRef<ScrollView>(null);
  const micAvailable = useRef(canListen()).current;

  const mode: TutorChat['mode'] = kind === 'chat' ? 'chat' : studyStyle;

  useFocusEffect(
    useCallback(() => {
      loadTutorChats().then(setSaved);
    }, []),
  );

  // Changing Study/Chat or the study style starts a fresh conversation in that mode.
  useEffect(() => {
    setChat((c) => (c.mode === mode ? c : newChat(mode)));
    setFailed(false);
  }, [mode]);

  useEffect(() => () => listening?.cancel(), [listening]);

  const scrollToEnd = () => setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);

  const ask = async (turns: TutorTurn[], current: TutorChat, image?: string) => {
    setThinking(true);
    setFailed(false);
    scrollToEnd();
    try {
      const reply = await tutorChat(current.mode, turns.map(({ role, text }) => ({ role, text })), image);
      const next: TutorChat = { ...current, turns: [...turns, { role: 'assistant', text: reply }], updatedAt: Date.now() };
      setChat(next);
      saveTutorChat(next).then(() => loadTutorChats().then(setSaved));
    } catch (err) {
      setFailed(true);
      showErrorOrPaywall('Your tutor could not answer', err, () => ask(turns, current, image));
    } finally {
      setThinking(false);
      scrollToEnd();
    }
  };

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if ((!text && !imageUri) || thinking) return;
    listening?.cancel();
    setListening(null);
    const turn: TutorTurn = { role: 'user', text, ...(imageUri ? { imageUri } : {}) };
    const turns = [...chat.turns, turn];
    const current: TutorChat = { ...chat, title: chat.title || titleFrom(text), turns };
    setChat(current);
    setInput('');
    const image = imageUri ?? undefined;
    setImageUri(null);
    ask(turns, current, image);
  };

  const retry = () => {
    const last = chat.turns[chat.turns.length - 1];
    if (!last || last.role !== 'user') return;
    ask(chat.turns, chat, last.imageUri);
  };

  const pickImage = async (camera: boolean) => {
    if (camera && Platform.OS !== 'web') {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        showAlert('Camera access needed', 'Allow camera access in Settings to snap your question.');
        return;
      }
    }
    const opts = { mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 };
    const picked = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!picked.canceled && picked.assets[0]?.uri) setImageUri(picked.assets[0].uri);
  };

  const attach = () => {
    if (Platform.OS === 'web') {
      pickImage(false);
      return;
    }
    showAlert('Add a photo', undefined, [
      { text: 'Take a photo', onPress: () => pickImage(true) },
      { text: 'Choose from library', onPress: () => pickImage(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const toggleMic = async () => {
    if (listening) {
      listening.stop();
      return;
    }
    try {
      const before = input ? `${input.trim()} ` : '';
      const session = await listen((partial) => setInput(before + partial));
      setListening(session);
      const heard = await session.done;
      setInput(heard ? before + heard : before.trim());
    } catch (err) {
      showAlert('Voice input', err instanceof Error ? err.message : 'Voice input is not available.');
    } finally {
      setListening(null);
    }
  };

  const pickStarter = (s: Starter) => {
    if ('tool' in s) navigation.navigate('StudySetup', { kind: s.tool });
    else send(s.prompt);
  };

  const openSaved = (c: TutorChat) => {
    setHistoryOpen(false);
    setKind(c.mode === 'chat' ? 'chat' : 'study');
    if (c.mode !== 'chat') setStudyStyle(c.mode);
    // Same render as the mode change, so the mode effect sees a matching chat and keeps it.
    setChat(c);
    setFailed(false);
  };

  const removeSaved = async (id: string) => {
    await deleteTutorChat(id);
    setSaved(await loadTutorChats());
    if (chat.id === id) setChat(newChat(mode));
  };

  const empty = chat.turns.length === 0;
  const canSend = (!!input.trim() || !!imageUri) && !thinking;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setHistoryOpen(true)} accessibilityLabel="Past chats">
          <Ionicons name="time-outline" size={22} color="#1C1C1E" />
        </TouchableOpacity>
        <View style={styles.segment}>
          {(['study', 'chat'] as Kind[]).map((k) => (
            <TouchableOpacity
              key={k}
              style={[styles.segmentItem, kind === k && styles.segmentOn]}
              onPress={() => setKind(k)}
              accessibilityRole="tab"
              accessibilityState={{ selected: kind === k }}
            >
              <Text style={[styles.segmentText, kind === k && styles.segmentTextOn]}>{k === 'study' ? 'Study' : 'Chat'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => setChat(newChat(mode))}
          disabled={empty}
          accessibilityLabel="New chat"
        >
          <Ionicons name="create-outline" size={22} color={empty ? '#C7C7CC' : '#1C1C1E'} />
        </TouchableOpacity>
      </View>

      <View style={styles.subBar}>
        {kind === 'study' ? (
          <TouchableOpacity style={styles.stylePill} onPress={() => setStyleMenu(true)}>
            <Ionicons name={STYLES[studyStyle].icon} size={15} color="#1C1C1E" />
            <Text style={styles.stylePillText}>{STYLES[studyStyle].label}</Text>
            <Ionicons name="chevron-down" size={14} color="#6C6C70" />
          </TouchableOpacity>
        ) : (
          <Text style={styles.subBarNote}>Everyday help, ideas and writing</Text>
        )}
        <TouchableOpacity style={styles.livePill} onPress={() => navigation.navigate('LiveTutor')}>
          <Ionicons name="headset" size={15} color="#FFFFFF" />
          <Text style={styles.livePillText}>Talk to Tia</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
          {empty ? (
            <View>
              <View style={styles.hero}>
                <View style={styles.heroIcon}>
                  <Ionicons name={kind === 'study' ? 'school' : 'chatbubbles'} size={28} color="#1C1C1E" />
                </View>
                <Text style={styles.heroTitle}>{kind === 'study' ? 'What are we learning today?' : "What's on your mind?"}</Text>
                <Text style={styles.heroLead}>
                  {kind === 'study'
                    ? 'Ask any question, or snap a photo of your homework.'
                    : 'Plans, ideas, messages, or just a quick question.'}
                </Text>
              </View>
              {STARTERS[kind].map((s) => (
                <TouchableOpacity key={s.label} style={styles.starter} onPress={() => pickStarter(s)}>
                  <Ionicons name={s.icon} size={18} color="#1C1C1E" />
                  <Text style={styles.starterText}>{s.label}</Text>
                  <Ionicons name={'tool' in s ? 'chevron-forward' : 'arrow-up'} size={16} color="#AEAEB2" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            chat.turns.map((t, i) => (
              <View key={i} style={[styles.bubble, t.role === 'user' ? styles.userBubble : styles.tutorBubble]}>
                {t.imageUri ? <Image source={{ uri: t.imageUri }} style={styles.bubbleImage} /> : null}
                {t.text ? (
                  <Text style={[styles.bubbleText, t.role === 'user' && styles.userText]} selectable>
                    {t.text}
                  </Text>
                ) : null}
              </View>
            ))
          )}
          {thinking ? (
            <View style={[styles.bubble, styles.tutorBubble, styles.thinking]}>
              <ActivityIndicator size="small" color="#6C6C70" />
              <Text style={styles.thinkingText}>Thinking...</Text>
            </View>
          ) : null}
          {failed && !thinking ? (
            <TouchableOpacity style={styles.retry} onPress={retry}>
              <Ionicons name="refresh" size={15} color="#1C1C1E" />
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>

        <View style={styles.composerWrap}>
          {imageUri ? (
            <View style={styles.preview}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.previewClose} onPress={() => setImageUri(null)} accessibilityLabel="Remove photo">
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={styles.composer}>
            <TouchableOpacity style={styles.iconBtn} onPress={attach} accessibilityLabel="Add a photo">
              <Ionicons name="camera-outline" size={22} color="#1C1C1E" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={listening ? 'Listening...' : kind === 'study' ? 'Ask your tutor anything' : 'Message Tutorly'}
              placeholderTextColor="#AEAEB2"
              multiline
              numberOfLines={1}
              maxLength={2000}
              onSubmitEditing={() => send()}
              blurOnSubmit={false}
            />
            {micAvailable && !canSend ? (
              <TouchableOpacity
                style={[styles.iconBtn, listening && styles.micOn]}
                onPress={toggleMic}
                accessibilityLabel={listening ? 'Stop dictation' : 'Dictate'}
              >
                <Ionicons name={listening ? 'stop' : 'mic-outline'} size={20} color={listening ? '#FFFFFF' : '#1C1C1E'} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.sendBtn, !canSend && styles.sendOff]}
                onPress={() => send()}
                disabled={!canSend}
                accessibilityLabel="Send"
              >
                <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={styleMenu} transparent animationType="fade" onRequestClose={() => setStyleMenu(false)}>
        <Pressable style={styles.backdrop} onPress={() => setStyleMenu(false)}>
          <View style={styles.menu}>
            <Text style={styles.menuTitle}>How should your tutor help?</Text>
            {(Object.keys(STYLES) as StudyStyle[]).map((k) => (
              <TouchableOpacity
                key={k}
                style={[styles.menuItem, studyStyle === k && styles.menuItemOn]}
                onPress={() => {
                  setStudyStyle(k);
                  setStyleMenu(false);
                }}
              >
                <Ionicons name={STYLES[k].icon} size={20} color="#1C1C1E" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuLabel}>{STYLES[k].label}</Text>
                  <Text style={styles.menuDetail}>{STYLES[k].detail}</Text>
                </View>
                {studyStyle === k ? <Ionicons name="checkmark" size={18} color="#1C1C1E" /> : null}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={historyOpen} transparent animationType="slide" onRequestClose={() => setHistoryOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setHistoryOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.sheetHeader}>
              <Text style={styles.menuTitle}>Past chats</Text>
              <TouchableOpacity onPress={() => setHistoryOpen(false)} accessibilityLabel="Close">
                <Ionicons name="close" size={22} color="#1C1C1E" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              {saved.length === 0 ? <Text style={styles.menuDetail}>Your conversations will show up here.</Text> : null}
              {saved.map((c) => (
                <View key={c.id} style={styles.savedRow}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => openSaved(c)}>
                    <Text style={styles.menuLabel} numberOfLines={1}>{c.title}</Text>
                    <Text style={styles.menuDetail}>
                      {c.mode === 'chat' ? 'Chat' : `Study · ${STYLES[c.mode].label}`} · {new Date(c.updatedAt).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeSaved(c.id)} accessibilityLabel="Delete chat" style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={18} color="#AEAEB2" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFEFEF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 6 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  segment: { flexDirection: 'row', backgroundColor: '#E1E1E6', borderRadius: 12, padding: 3 },
  segmentItem: { paddingHorizontal: 22, paddingVertical: 7, borderRadius: 9 },
  segmentOn: { backgroundColor: '#FFFFFF' },
  segmentText: { fontSize: 14, fontWeight: '600', color: '#6C6C70' },
  segmentTextOn: { color: '#1C1C1E' },
  subBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  stylePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  stylePillText: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  subBarNote: { fontSize: 13, color: '#6C6C70' },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1C1C1E', borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  livePillText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  messages: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  hero: { alignItems: 'center', paddingTop: 20, paddingBottom: 22 },
  heroIcon: {
    width: 60, height: 60, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', textAlign: 'center' },
  heroLead: { fontSize: 14, color: '#6C6C70', marginTop: 6, textAlign: 'center' },
  starter: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13, marginBottom: 8,
  },
  starterText: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1C1C1E' },
  bubble: { maxWidth: '86%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#1C1C1E', borderBottomRightRadius: 6 },
  tutorBubble: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderBottomLeftRadius: 6 },
  bubbleText: { fontSize: 15, lineHeight: 22, color: '#1C1C1E' },
  userText: { color: '#FFFFFF' },
  bubbleImage: { width: 200, height: 150, borderRadius: 12, marginBottom: 6, backgroundColor: '#333' },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  thinkingText: { fontSize: 14, color: '#6C6C70' },
  retry: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF',
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7,
  },
  retryText: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  composerWrap: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 10, backgroundColor: '#EFEFEF' },
  preview: { width: 64, height: 64, marginBottom: 6, marginLeft: 4 },
  previewImage: { width: 64, height: 64, borderRadius: 12 },
  previewClose: {
    position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#1C1C1E',
    alignItems: 'center', justifyContent: 'center',
  },
  composer: {
    flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#FFFFFF', borderRadius: 22, paddingHorizontal: 6, paddingVertical: 5,
  },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  micOn: { backgroundColor: '#FF3B30' },
  input: {
    flex: 1, fontSize: 15, lineHeight: 20, color: '#1C1C1E', maxHeight: 120, paddingHorizontal: 6,
    paddingTop: Platform.OS === 'ios' ? 9 : 8, paddingBottom: 8,
    ...(Platform.OS === 'web' ? ({ outlineWidth: 0 } as object) : {}),
  },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center' },
  sendOff: { backgroundColor: '#C7C7CC' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  menu: { backgroundColor: '#FFFFFF', margin: 12, marginBottom: 32, borderRadius: 20, padding: 16 },
  menuTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14 },
  menuItemOn: { backgroundColor: '#F2F2F7' },
  menuLabel: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  menuDetail: { fontSize: 12, color: '#6C6C70', marginTop: 2 },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, paddingBottom: 32 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  savedRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
});
