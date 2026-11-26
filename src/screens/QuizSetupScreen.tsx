import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { generateQuiz } from '../services/claudeService';
import { showErrorOrPaywall } from '../utils/limit';
import { showAlert } from '../utils/alert';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SOON: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'From a YouTube video', icon: 'logo-youtube' },
  { label: 'From a website', icon: 'globe-outline' },
  { label: 'From a recording', icon: 'mic-outline' },
];

export default function QuizSetupScreen() {
  const navigation = useNavigation<Nav>();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState<null | 'topic' | 'photo'>(null);

  const run = async (source: { topic: string } | { imageUri: string }) => {
    setLoading('topic' in source ? 'topic' : 'photo');
    try {
      const quiz = await generateQuiz(source);
      navigation.replace('Quiz', { quiz });
    } catch (err) {
      showErrorOrPaywall('Could not make a quiz', err, () => run(source));
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
        <Text style={styles.lead}>Turn anything you're studying into a 5-question quiz.</Text>

        <Text style={styles.label}>Type a topic</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            value={topic}
            onChangeText={setTopic}
            placeholder="e.g. Photosynthesis, the French Revolution, fractions"
            placeholderTextColor="#AEAEB2"
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.primary, (!topic.trim() || busy) && { opacity: 0.4 }]}
            onPress={() => run({ topic: topic.trim() })}
            disabled={!topic.trim() || busy}
            activeOpacity={0.8}
          >
            {loading === 'topic' ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>Make my quiz</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Or use your notes</Text>
        <View style={styles.card}>
          <Row icon="camera-outline" label="Scan notes" onPress={() => fromPhoto(true)} disabled={busy} loading={loading === 'photo'} />
          <View style={styles.sep} />
          <Row icon="images-outline" label="Choose a photo" onPress={() => fromPhoto(false)} disabled={busy} />
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
        <Ionicons name={props.icon} size={18} color="#1C1C1E" />
      </View>
      <Text style={styles.rowLabel}>{props.label}</Text>
      {props.loading ? (
        <ActivityIndicator color="#1C1C1E" />
      ) : props.soon ? (
        <Text style={styles.soon}>Soon</Text>
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#AEAEB2" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFEFEF' },
  content: { padding: 16, paddingBottom: 32 },
  lead: { fontSize: 15, color: '#6C6C70', lineHeight: 21, marginBottom: 8 },
  label: {
    fontSize: 11, fontWeight: '700', color: '#AEAEB2', textTransform: 'uppercase',
    letterSpacing: 1, marginTop: 18, marginBottom: 8,
  },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12 },
  input: { minHeight: 80, fontSize: 15, lineHeight: 21, color: '#1C1C1E', padding: 4 },
  primary: {
    marginTop: 10, backgroundColor: '#1C1C1E', borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  primaryText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  soon: { fontSize: 12, fontWeight: '700', color: '#AEAEB2' },
  sep: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: 4, marginLeft: 46 },
});
