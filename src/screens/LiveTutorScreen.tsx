import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

async function micAllowed(): Promise<boolean> {
  if (Platform.OS !== 'android') return true; // iOS and browsers ask when the call starts
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
  return result === PermissionsAndroid.RESULTS.GRANTED;
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
      const text = m.message?.trim();
      if (!text) return;
      const role = m.role === 'user' || m.source === 'user' ? 'user' : 'agent';
      setLines((prev) => [...prev.slice(-5), { role, text }]);
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

  // The orb breathes while the tutor talks and rests while it listens.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isSpeaking) {
      Animated.timing(pulse, { toValue: 0, duration: 250, useNativeDriver: true }).start();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isSpeaking, pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const halo = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.45] });

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

  const lastAgent = [...lines].reverse().find((l) => l.role === 'agent');
  const lastUser = [...lines].reverse().find((l) => l.role === 'user');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <TouchableOpacity style={styles.close} onPress={hangUp} accessibilityLabel="Close">
          <Ionicons name="chevron-down" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Live tutor</Text>
        <Text style={styles.timer}>{connected ? clock(seconds) : ''}</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.orbWrap}>
          <Animated.View style={[styles.halo, { opacity: halo, transform: [{ scale }] }]} />
          <Animated.View style={[styles.orb, { transform: [{ scale }] }, !connected && styles.orbIdle]}>
            <Ionicons name={isSpeaking ? 'volume-high' : 'mic'} size={38} color="#1C1C1E" />
          </Animated.View>
        </View>
        <Text style={styles.status}>{label}</Text>

        {problem ? (
          <>
            <Text style={styles.lead}>{problem}</Text>
            <TouchableOpacity style={styles.primary} onPress={start}>
              <Ionicons name="refresh" size={16} color="#1C1C1E" />
              <Text style={styles.primaryText}>Try again</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.captions}>
            {lastUser ? <Text style={styles.youSaid} numberOfLines={2}>You: {lastUser.text}</Text> : null}
            <Text style={styles.tutorSaid} numberOfLines={5}>
              {lastAgent?.text ?? (connected ? 'Say hi, or tell your tutor what you are working on.' : '')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.control, isMuted && styles.controlOn]}
          onPress={() => setMuted(!isMuted)}
          disabled={!connected}
          accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}
        >
          <Ionicons name={isMuted ? 'mic-off' : 'mic-outline'} size={26} color={isMuted ? '#1C1C1E' : '#FFFFFF'} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.control, styles.hangUp]} onPress={hangUp} accessibilityLabel="End call">
          <Ionicons name="call" size={26} color="#FFFFFF" style={{ transform: [{ rotate: '135deg' }] }} />
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
  orbWrap: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  halo: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: '#7FD1AE' },
  orb: {
    width: 150, height: 150, borderRadius: 75, backgroundColor: '#B8F0D6', alignItems: 'center', justifyContent: 'center',
  },
  orbIdle: { backgroundColor: '#5E6B66' },
  status: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 14, textAlign: 'center' },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 16, textAlign: 'center' },
  lead: { color: '#AEAEB2', fontSize: 15, lineHeight: 21, textAlign: 'center', marginTop: 6 },
  captions: { minHeight: 130, alignItems: 'center' },
  youSaid: { color: '#8E8E93', fontSize: 14, textAlign: 'center', marginBottom: 10 },
  tutorSaid: { color: '#E5E5EA', fontSize: 17, lineHeight: 24, textAlign: 'center' },
  primary: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, backgroundColor: '#FFFFFF', borderRadius: 22,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  primaryText: { color: '#1C1C1E', fontSize: 15, fontWeight: '700' },
  secondary: { marginTop: 22, borderRadius: 22, borderWidth: 1, borderColor: '#3A3A3C', paddingHorizontal: 24, paddingVertical: 11 },
  secondaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 36, paddingBottom: 28, paddingTop: 12 },
  control: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#2C2C2E', alignItems: 'center', justifyContent: 'center' },
  controlOn: { backgroundColor: '#FFFFFF' },
  hangUp: { backgroundColor: '#FF3B30' },
});
