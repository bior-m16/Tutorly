import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { generateFlashcards, generateQuiz } from '../services/claudeService';
import { saveDeck, useDecks } from '../hooks/useDecks';
import { showErrorOrPaywall } from '../utils/limit';
import { showAlert } from '../utils/alert';
import { RootStackParamList } from '../types';
import { glow } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type RouteT = RouteProp<RootStackParamList, 'StudySetup'>;
type Source = { topic: string } | { imageUri: string };

const COPY = {
  quiz: {
    title: 'Quiz Me',
    lead: "Turn anything you're studying into a 5-question quiz.",
    button: 'Make my quiz',
    error: 'Could not make a quiz',
  },
  flashcards: {
    title: 'Flashcards',
    lead: 'Get a deck of cards for the key terms and ideas, then flip through them.',
    button: 'Make my cards',
    error: 'Could not make flashcards',
  },
};

const STARTERS = ['The water cycle', 'Causes of World War I', 'Pythagorean theorem', 'Parts of a cell', 'Supply and demand', 'Newton’s laws of motion'];

const SOON: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'From a YouTube video', icon: 'logo-youtube' },
  { label: 'From a website', icon: 'globe-outline' },
  { label: 'From a recording', icon: 'mic-outline' },
];

export default function StudySetupScreen() {
  const navigation = useNavigation<Nav>();
  const { kind } = useRoute<RouteT>().params;
  const copy = COPY[kind];
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState<null | 'topic' | 'photo'>(null);
  const { decks, reload } = useDecks();

  useLayoutEffect(() => {
    navigation.setOptions({ title: copy.title });
  }, [navigation, copy.title]);

  useFocusEffect(
    useCallback(() => {
      if (kind === 'flashcards') void reload();
    }, [kind, reload]),
  );

  const run = async (source: Source) => {
    setLoading('topic' in source ? 'topic' : 'photo');
    try {
      if (kind === 'quiz') {
        const quiz = await generateQuiz(source);
        navigation.replace('Quiz', { quiz });
      } else {
        const deck = await generateFlashcards(source);
        await saveDeck(deck);
        navigation.replace('Flashcards', { deck });
      }
    } catch (err) {
      showErrorOrPaywall(copy.error, err, () => run(source));
    } finally {
      setLoading(null);
    }
  };

  const fromPhoto = async (camera: boolean) => {
    if (loading) return;
    if (camera && Platform.OS !== 'web') {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        showAlert('Camera access needed', 'Allow camera access in Settings to scan your notes.');
        return;
      }
    }
    const opts = { mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 };
    const picked = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!picked.canceled && picked.assets[0]?.uri) await run({ imageUri: picked.assets[0].uri });
  };

  const busy = loading !== null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.lead}>{copy.lead}</Text>

        {kind === 'flashcards' && decks.length > 0 ? (
          <>
            <Text style={styles.label}>Your decks</Text>
            <View style={styles.card}>
              {decks.slice(0, 5).map((d, i) => (
                <React.Fragment key={d.id}>
                  {i > 0 ? <View style={styles.sep} /> : null}
                  <Row
                    icon="albums-outline"
                    label={d.title}
                    detail={`${d.cards.length} cards`}
                    onPress={() => navigation.navigate('Flashcards', { deck: d })}
                    disabled={busy}
                  />
                </React.Fragment>
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.label}>Type a topic</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            value={topic}
            onChangeText={setTopic}
            placeholder="e.g. Photosynthesis, the French Revolution, fractions"
            placeholderTextColor="#ADA7C2"
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.primary, (!topic.trim() || busy) && { opacity: 0.4 }]}
            onPress={() => run({ topic: topic.trim() })}
            disabled={!topic.trim() || busy}
            activeOpacity={0.8}
          >
            {loading === 'topic' ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>{copy.button}</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Or use your notes</Text>
        <View style={styles.card}>
          <Row icon="camera-outline" label="Scan notes" onPress={() => fromPhoto(true)} disabled={busy} loading={loading === 'photo'} />
          <View style={styles.sep} />
          <Row icon="images-outline" label="Choose a photo" onPress={() => fromPhoto(false)} disabled={busy} />
        </View>

        <Text style={styles.label}>Need an idea? Pick a starter topic</Text>
        <View style={styles.starters}>
          {STARTERS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.starter, busy && { opacity: 0.4 }]}
              onPress={() => setTopic(t)}
              disabled={busy}
              activeOpacity={0.7}
            >
              <Text style={styles.starterText}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Coming soon</Text>
        <View style={styles.card}>
          {SOON.map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 ? <View style={styles.sep} /> : null}
              <Row icon={s.icon} label={s.label} soon />
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row(props: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  soon?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, props.soon && { opacity: 0.45 }]}
      onPress={props.onPress}
      disabled={props.soon || props.disabled}
      activeOpacity={0.7}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={props.icon} size={18} color="#1D1A33" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel} numberOfLines={1}>{props.label}</Text>
        {props.detail ? <Text style={styles.rowDetail}>{props.detail}</Text> : null}
      </View>
      {props.loading ? (
        <ActivityIndicator color="#1D1A33" />
      ) : props.soon ? (
        <Text style={styles.soon}>Soon</Text>
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#ADA7C2" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F5' },
  content: { padding: 16, paddingBottom: 32 },
  lead: { fontSize: 15, color: '#6B6585', lineHeight: 21, marginBottom: 8 },
  label: {
    fontSize: 11, fontWeight: '700', color: '#ADA7C2', textTransform: 'uppercase',
    letterSpacing: 1, marginTop: 18, marginBottom: 8,
  },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12 },
  input: { minHeight: 80, fontSize: 15, lineHeight: 21, color: '#1D1A33', padding: 4 },
  primary: {
    marginTop: 10, backgroundColor: '#6A4CFF', ...glow('#7A5CFF', 16, 0.35), borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  primaryText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F4EFFF', alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '600', color: '#1D1A33' },
  rowDetail: { fontSize: 12, color: '#6B6585', marginTop: 1 },
  soon: { fontSize: 12, fontWeight: '700', color: '#ADA7C2' },
  sep: { height: 1, backgroundColor: 'rgba(106,76,255,0.10)', marginVertical: 4, marginLeft: 46 },
  starters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  starter: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  starterText: { fontSize: 13, fontWeight: '500', color: '#1D1A33' },
});
