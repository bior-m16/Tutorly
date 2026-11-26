import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { askFollowUp, friendlyError } from '../services/claudeService';
import { ChatTurn, RootStackParamList } from '../types';

type RouteT = RouteProp<RootStackParamList, 'Ask'>;

const SUGGESTIONS = ['Why does this step work?', 'Explain it more simply', 'What should I learn first?'];

export default function AskScreen() {
  const { result, stepNumber } = useRoute<RouteT>().params;
  const step = stepNumber ? result.steps.find((s) => s.stepNumber === stepNumber) : undefined;

  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;
    const history = turns;
    setTurns([...history, { role: 'user', text: question }]);
    setInput('');
    setError(null);
    setLoading(true);
    try {
      const reply = await askFollowUp(result, history, question, stepNumber);
      setTurns((t) => [...t, { role: 'assistant', text: reply }]);
    } catch (err) {
      setError(friendlyError(err));
      // Drop the unanswered question so the next send keeps user/assistant turns alternating.
      setTurns(history);
      setInput(question);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.content}>
          <View style={styles.context}>
            <Text style={styles.contextLabel}>
              {step ? `Step ${step.stepNumber}: ${step.title}` : 'This problem'}
            </Text>
            <Text style={styles.contextText} numberOfLines={3}>
              {step ? step.explanation : result.question}
            </Text>
          </View>

          {turns.length === 0 ? (
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity key={s} style={styles.chip} onPress={() => send(s)} activeOpacity={0.7}>
                  <Text style={styles.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {turns.map((t, i) => (
            <View key={i} style={[styles.bubble, t.role === 'user' ? styles.userBubble : styles.tutorBubble]}>
              <Text style={t.role === 'user' ? styles.userText : styles.tutorText}>{t.text}</Text>
            </View>
          ))}

          {loading ? <ActivityIndicator style={{ marginTop: 12 }} color="#1C1C1E" /> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your tutor…"
            placeholderTextColor="#AEAEB2"
            multiline
            onSubmitEditing={() => send(input)}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
            onPress={() => send(input)}
            disabled={!input.trim() || loading}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-up" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFEFEF' },
  content: { padding: 16, paddingBottom: 24 },

  context: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 14 },
  contextLabel: { fontSize: 12, fontWeight: '700', color: '#AEAEB2', marginBottom: 6 },
  contextText: { fontSize: 14, color: '#1C1C1E', lineHeight: 20 },

  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { fontSize: 13, color: '#1C1C1E', fontWeight: '500' },

  bubble: { maxWidth: '85%', borderRadius: 16, padding: 12, marginTop: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#1C1C1E' },
  tutorBubble: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF' },
  userText: { color: '#FFFFFF', fontSize: 14, lineHeight: 20 },
  tutorText: { color: '#1C1C1E', fontSize: 14, lineHeight: 21 },

  error: { color: '#FF3B30', fontSize: 13, marginTop: 10 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: '#F5F5F7',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1C1C1E',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
