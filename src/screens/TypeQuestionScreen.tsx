import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { solveTypedQuestion } from '../services/claudeService';
import { showErrorOrPaywall } from '../utils/limit';
import { RootStackParamList } from '../types';
import { glow } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const EXAMPLES = ['Solve 3x − 7 = 11', 'What causes the seasons on Earth?', 'Balance: H2 + O2 → H2O'];

export default function TypeQuestionScreen() {
  const navigation = useNavigation<Nav>();
  const initial = useRoute<RouteProp<RootStackParamList, 'TypeQuestion'>>().params?.initial ?? '';
  const [question, setQuestion] = useState(initial);
  const [loading, setLoading] = useState(false);

  const solve = async () => {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    try {
      const result = await solveTypedQuestion(q);
      navigation.replace('Result', { result });
    } catch (err) {
      showErrorOrPaywall('Could not solve that', err, solve);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.body}>
          <TextInput
            style={styles.input}
            value={question}
            onChangeText={setQuestion}
            placeholder="Type or paste your homework question…"
            placeholderTextColor="#ADA7C2"
            multiline
            autoFocus
            textAlignVertical="top"
          />
          {question.length === 0 ? (
            <View style={styles.examples}>
              <Text style={styles.examplesLabel}>Try one</Text>
              {EXAMPLES.map((e) => (
                <TouchableOpacity key={e} style={styles.example} onPress={() => setQuestion(e)} activeOpacity={0.7}>
                  <Text style={styles.exampleText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.solveBtn, (!question.trim() || loading) && { opacity: 0.4 }]}
          onPress={solve}
          disabled={!question.trim() || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="sparkles" size={18} color="#FFF" />
              <Text style={styles.solveText}>Solve step by step</Text>
            </>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F5' },
  body: { flex: 1, padding: 16 },
  input: {
    minHeight: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    lineHeight: 23,
    color: '#1D1A33',
    borderWidth: 1.5,
    borderColor: 'rgba(122,92,255,0.35)',
  },
  examples: { marginTop: 20, gap: 8 },
  examplesLabel: { fontSize: 11, fontWeight: '700', color: '#ADA7C2', textTransform: 'uppercase', letterSpacing: 1 },
  example: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  exampleText: { fontSize: 14, color: '#1D1A33' },
  solveBtn: {
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6A4CFF', ...glow('#7A5CFF', 16, 0.35),
    borderRadius: 16,
    paddingVertical: 16,
  },
  solveText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
