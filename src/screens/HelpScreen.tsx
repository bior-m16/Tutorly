import React, { useMemo, useState } from 'react';
import { LayoutAnimation, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { showAlert } from '../utils/alert';
import { C, glow } from '../theme';

if (Platform.OS === 'android') UIManager.setLayoutAnimationEnabledExperimental?.(true);

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How many questions can I ask for free?',
    a: 'The free plan includes 5 uses a day across every tool: photo answers, typed questions, quizzes, flashcards, summaries, writing help and live calls with Tia. The count resets each day. Plus removes the cap.',
  },
  {
    q: 'How do I cancel Plus?',
    a: 'Plus is billed by your app store. On iPhone open Settings, tap your name, then Subscriptions. On Android open Google Play, tap your profile, then Payments and subscriptions. Cancel at least 24 hours before the period ends to avoid the next charge.',
  },
  {
    q: 'I bought Plus but the app still shows Free.',
    a: 'Open Profile, tap See plans, then tap Restore at the top. Make sure you are signed in to the same store account you paid with.',
  },
  {
    q: 'The answer to my photo looks wrong.',
    a: 'Crop the photo to one question, use good light and hold the phone straight over the page. You can also type the question instead, or tap a step and ask the tutor to explain it another way.',
  },
  {
    q: 'Tia cannot hear me on a live call.',
    a: 'Check that Tutorly is allowed to use the microphone in your phone settings, and that you are not muted (the mic button turns white when muted). A steady Wi-Fi or mobile connection helps. Calls last up to 10 minutes.',
  },
  {
    q: 'Where is my study history kept?',
    a: 'Your history, decks, summaries and tutor chats are saved on this device. Questions you send are processed to create answers and are not used to show you ads.',
  },
  {
    q: 'Can Tutorly do my homework for me?',
    a: 'Tutorly shows the steps so you understand how to get there. Use it to learn and check your work, and follow your school rules about outside help.',
  },
];

export default function HelpScreen() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const email = ((Constants.expoConfig?.extra ?? {}) as { supportEmail?: string }).supportEmail ?? '';

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ.map((f, i) => ({ ...f, i })).filter((f) => !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [query]);

  const toggle = (i: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((o) => (o === i ? null : i));
  };

  const contact = () => {
    const subject = encodeURIComponent('Tutorly feedback');
    const body = encodeURIComponent(`\n\n---\nApp version ${Constants.expoConfig?.version ?? ''} · ${Platform.OS}`);
    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`).catch(() =>
      showAlert('No mail app', `Write to us at ${email}`),
    );
  };

  const clearData = () =>
    showAlert('Clear data on this device?', 'This removes your study history, decks, summaries, writing, tutor chats and streak from this device. It cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('tutorly_'));
          await AsyncStorage.multiRemove(keys);
          showAlert('Cleared', 'Your study data was removed from this device.');
        },
      },
    ]);

  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={[styles.search, glow(C.neon, 12, 0.08)]}>
        <Ionicons name="search" size={18} color={C.faint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search help"
          placeholderTextColor={C.faint}
          style={styles.input}
          returnKeyType="search"
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={C.faint} />
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.section}>Common questions</Text>
      <View style={[styles.card, glow(C.neon, 14, 0.08)]}>
        {shown.length === 0 ? <Text style={styles.empty}>No matches. Try another word.</Text> : null}
        {shown.map((f, n) => {
          const isOpen = open === f.i;
          return (
            <View key={f.q} style={n < shown.length - 1 && styles.line}>
              <TouchableOpacity style={styles.qRow} onPress={() => toggle(f.i)} activeOpacity={0.7}>
                <Text style={[styles.q, isOpen && { color: C.neon }]}>{f.q}</Text>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={isOpen ? C.neon : C.faint} />
              </TouchableOpacity>
              {isOpen ? <Text style={styles.a}>{f.a}</Text> : null}
            </View>
          );
        })}
      </View>

      <Text style={styles.section}>More</Text>
      <View style={[styles.card, glow(C.neon, 14, 0.08)]}>
        {email ? (
          <TouchableOpacity style={[styles.row, styles.line]} onPress={contact} activeOpacity={0.7}>
            <View style={[styles.rowIcon, { backgroundColor: `${C.neon}1A` }]}>
              <Ionicons name="mail-outline" size={18} color={C.neon} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Contact us</Text>
              <Text style={styles.rowSub}>Questions, bugs or ideas</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.faint} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.row} onPress={clearData} activeOpacity={0.7}>
          <View style={[styles.rowIcon, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowLabel, { color: '#FF3B30' }]}>Clear my data on this device</Text>
            <Text style={styles.rowSub}>History, decks, chats and streak</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 14, height: 48 },
  input: { flex: 1, fontSize: 16, color: C.ink, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}) },
  section: { fontSize: 13, fontWeight: '700', color: C.sub, marginTop: 22, marginBottom: 8, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  card: { backgroundColor: C.card, borderRadius: 22, paddingHorizontal: 16 },
  line: { borderBottomWidth: 1, borderBottomColor: C.line },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 15 },
  q: { flex: 1, fontSize: 15, fontWeight: '700', color: C.ink, lineHeight: 21 },
  a: { fontSize: 14, color: C.sub, lineHeight: 21, paddingBottom: 15, marginTop: -4 },
  empty: { fontSize: 14, color: C.sub, paddingVertical: 16, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 16, fontWeight: '600', color: C.ink },
  rowSub: { fontSize: 12, color: C.sub, marginTop: 2 },
});
