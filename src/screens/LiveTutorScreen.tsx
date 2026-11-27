import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, PermissionsAndroid, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LimitReachedError, friendlyError, startVoiceSession } from '../services/claudeService';
import { showErrorOrPaywall } from '../utils/limit';

// The live voice tutor runs on ElevenLabs Agents. ElevenLabs handles listening, the tutor's
// replies and its voice; our backend only hands out a short-lived token for each session.
// The SDK is loaded lazily so a build without its native modules shows a message instead of crashing.
type Sdk = typeof import('@elevenlabs/react-native');
let sdk: Sdk | null | undefined;
function loadSdk(): Sdk | null {
  if (sdk === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      sdk = require('@elevenlabs/react-native') as Sdk;
    } catch {
      sdk = null;
    }
  }
  return sdk;
}

type Line = { role: 'user' | 'agent'; text: string };

/** Longest live call, in seconds. Keeps the cost of any one call bounded. */
const MAX_CALL_SECONDS = 600;

async function micAllowed(): Promise<boolean> {
  if (Platform.OS !== 'android') return true; // iOS and browsers ask when the call starts
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

/** Removes voice-direction tags such as "[warmly]" that the agent's voice model reads as cues, not words. */
function cleanCaption(text: string): string {
  return text.replace(/\[[^\]]{1,30}\]\s*/g, '').replace(/\s{2,}/g, ' ').trim();
}

function clock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function LiveTutorScreen() {
  const lib = loadSdk();
  if (!lib) return <Unavailable />;
  const { ConversationProvider } = lib;
  return (
    <ConversationProvider>
      <LiveCall lib={lib} />
    </ConversationProvider>
  );
}

function Unavailable() {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Ionicons name="headset-outline" size={44} color="#FFFFFF" />
        <Text style={styles.title}>Live tutor needs the latest app</Text>
        <Text style={styles.lead}>Update Tutorly to talk with your tutor out loud.</Text>
        <TouchableOpacity style={styles.secondary} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function LiveCall({ lib }: { lib: Sdk }) {
  const navigation = useNavigation();
  const [lines, setLines] = useState<Line[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const closing = useRef(false);

  const conversation = lib.useConversation({
    onMessage: (m) => {
      const text = cleanCaption(m.message ?? '');
      if (!text) return;
      const role = m.role === 'user' || m.source === 'user' ? 'user' : 'agent';
      setLines((prev) => [...prev, { role, text }]);
    },
    onError: (message) => {
      if (!closing.current) setProblem(message || 'The call dropped.');
    },
    onDisconnect: (details) => {
      if (closing.current) return;
      if (details.reason === 'error') setProblem('The call dropped. Check your connection and try again.');
      else if (details.reason === 'agent') setProblem('Your tutor ended the call.');
    },
  });
  const { status, isSpeaking, isMuted, setMuted } = conversation;
  const connected = status === 'connected';

  const start = async () => {
    closing.current = false;
    setSeconds(0);
    setLines([]);
    setProblem(null);
    setStarting(true);
    try {
      if (!(await micAllowed())) {
        setProblem('Allow microphone access in Settings to talk with your tutor.');
        return;
      }
      const conversationToken = await startVoiceSession();
      conversation.startSession({ conversationToken, connectionType: 'webrtc' });
    } catch (err) {
      if (err instanceof LimitReachedError) {
        showErrorOrPaywall('Live tutor', err, () => start());
        setProblem(err.message);
      } else {
        setProblem(friendlyError(err));
      }
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    start();
    return () => {
      closing.current = true;
      conversation.endSession();
    };
    // Start once when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Call timer.
  useEffect(() => {
    if (!connected) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [connected]);

  useEffect(() => {
    if (seconds < MAX_CALL_SECONDS || closing.current) return;
    closing.current = true;
    conversation.endSession();
    setProblem('That was a great session! Calls last up to 10 minutes. Start a new one any time.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  // Ripples spread from the orb while the call is live: quick and bright while the tutor talks,
  // slow and faint while it listens.
  const ripples = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  const speak = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!connected) {
      ripples.forEach((r) => r.setValue(0));
      return;
    }
    const duration = isSpeaking ? 1100 : 2200;
    const loops = ripples.map((r, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * (duration / 2)),
          Animated.timing(r, { toValue: 1, duration, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(r, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    Animated.timing(speak, { toValue: isSpeaking ? 1 : 0, duration: 250, useNativeDriver: true }).start();
    return () => loops.forEach((l) => l.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, isSpeaking]);
  const orbScale = speak.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  // Keep the newest line in view.
  const scroll = useRef<ScrollView>(null);
  useEffect(() => {
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
  }, [lines.length]);

  const hangUp = () => {
    closing.current = true;
    conversation.endSession();
    navigation.goBack();
  };

  const label = problem
    ? 'Call ended'
    : starting || status === 'connecting'
      ? 'Connecting...'
      : !connected
        ? 'Getting ready...'
        : isMuted
          ? 'You are muted'
          : isSpeaking
            ? 'Tutor is speaking'
            : 'Listening... go ahead';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <TouchableOpacity style={styles.close} onPress={hangUp} accessibilityLabel="Close">
          <Ionicons name="chevron-down" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Live tutor</Text>
        <Text style={styles.timer}>{connected ? clock(seconds) : ''}</Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.orbWrap}>
          {ripples.map((r, i) => (
            <Animated.View
              key={i}
              style={[
                styles.ripple,
                {
                  opacity: r.interpolate({ inputRange: [0, 1], outputRange: [isSpeaking ? 0.5 : 0.25, 0] }),
                  transform: [{ scale: r.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
                },
              ]}
            />
          ))}
          <Animated.View style={[styles.orb, !connected && styles.orbIdle, { transform: [{ scale: orbScale }] }]}>
            <Ionicons name={isSpeaking ? 'volume-high' : isMuted ? 'mic-off' : 'mic'} size={30} color="#1C1C1E" />
          </Animated.View>
        </View>
        <Text style={styles.status}>{label}</Text>
      </View>

      <ScrollView ref={scroll} style={styles.transcript} contentContainerStyle={styles.transcriptContent}>
        {lines.length === 0 && connected && !problem ? (
          <Text style={styles.hint}>Say hi, or tell your tutor what you are working on.</Text>
        ) : null}
        {lines.map((l, i) => (
          <View key={i} style={[styles.bubble, l.role === 'user' ? styles.userBubble : styles.tutorBubble]}>
            <Text style={[styles.bubbleText, l.role === 'user' && styles.userText]}>{l.text}</Text>
          </View>
        ))}
        {problem ? (
          <View style={styles.problem}>
            <Text style={styles.lead}>{problem}</Text>
            <TouchableOpacity style={styles.primary} onPress={start}>
              <Ionicons name="refresh" size={16} color="#1C1C1E" />
              <Text style={styles.primaryText}>{lines.length ? 'Start a new call' : 'Try again'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.control, isMuted && styles.controlOn]}
          onPress={() => setMuted(!isMuted)}
          disabled={!connected}
          accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}
        >
          <Ionicons name={isMuted ? 'mic-off' : 'mic-outline'} size={24} color={isMuted ? '#1C1C1E' : '#FFFFFF'} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.control, styles.hangUp]} onPress={hangUp} accessibilityLabel="End call">
          <Ionicons name="call" size={24} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111114' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 6 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  timer: { width: 44, color: '#AEAEB2', fontSize: 14, textAlign: 'right', fontVariant: ['tabular-nums'] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  hero: { alignItems: 'center', paddingTop: 8, paddingBottom: 12 },
  orbWrap: { width: 170, height: 170, alignItems: 'center', justifyContent: 'center' },
  ripple: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: '#7FD1AE' },
  orb: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#B8F0D6', alignItems: 'center', justifyContent: 'center' },
  orbIdle: { backgroundColor: '#5E6B66' },
  status: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  transcript: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  transcriptContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, flexGrow: 1 },
  hint: { color: '#8E8E93', fontSize: 15, textAlign: 'center', marginTop: 12 },
  bubble: { maxWidth: '82%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10 },
  tutorBubble: { alignSelf: 'flex-start', backgroundColor: '#24242A', borderBottomLeftRadius: 6 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#B8F0D6', borderBottomRightRadius: 6 },
  bubbleText: { color: '#F2F2F7', fontSize: 15, lineHeight: 22 },
  userText: { color: '#1C1C1E' },
  problem: { alignItems: 'center', marginTop: 12 },
  lead: { color: '#AEAEB2', fontSize: 15, lineHeight: 21, textAlign: 'center', marginTop: 6 },
  primary: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, backgroundColor: '#FFFFFF', borderRadius: 22,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  primaryText: { color: '#1C1C1E', fontSize: 15, fontWeight: '700' },
  secondary: { marginTop: 22, borderRadius: 22, borderWidth: 1, borderColor: '#3A3A3C', paddingHorizontal: 24, paddingVertical: 11 },
  secondaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 36, paddingBottom: 20, paddingTop: 10 },
  control: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#2C2C2E', alignItems: 'center', justifyContent: 'center' },
  controlOn: { backgroundColor: '#FFFFFF' },
  hangUp: { backgroundColor: '#FF3B30' },
});
