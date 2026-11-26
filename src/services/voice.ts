// Speech in and out for the tutor.
// Speech-to-text uses expo-speech-recognition, a native module: it works in development and store
// builds and in browsers with the Web Speech API (Chrome, Safari), but not in Expo Go.
// Text-to-speech uses expo-speech, which works everywhere.
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

type Recognizer = {
  start(options: Record<string, unknown>): void;
  stop(): void;
  abort(): void;
  requestPermissionsAsync(): Promise<{ granted: boolean }>;
};
type Listen = (event: string, cb: (e: any) => void) => { remove(): void };

let cached: { module: Recognizer; listen: Listen } | null | undefined;

function recognizer() {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-speech-recognition');
    const available = mod.isRecognitionAvailable?.() ?? false;
    cached = available ? { module: mod.ExpoSpeechRecognitionModule, listen: mod.addSpeechRecognitionListener } : null;
  } catch {
    cached = null; // Expo Go, or a build without the native module
  }
  return cached;
}

export function canListen(): boolean {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const w = window as any;
    if (!w.SpeechRecognition && !w.webkitSpeechRecognition) return false;
  }
  return recognizer() !== null;
}

export interface Listening {
  /** Resolves with the final transcript ('' if nothing was heard). */
  done: Promise<string>;
  /** Stop listening and keep what was heard so far. */
  stop(): void;
  /** Stop listening and discard. */
  cancel(): void;
}

/** Listens for one utterance. onPartial receives the words as they are recognised. */
export async function listen(onPartial?: (text: string) => void): Promise<Listening> {
  const r = recognizer();
  if (!r) throw new Error('Voice input is not available on this device');
  const { granted } = await r.module.requestPermissionsAsync();
  if (!granted) throw new Error('Microphone permission was not granted');

  let latest = '';
  let cancelled = false;
  const subs: { remove(): void }[] = [];
  const done = new Promise<string>((resolve, reject) => {
    subs.push(
      r.listen('result', (e) => {
        latest = e.results?.[0]?.transcript ?? latest;
        onPartial?.(latest);
      }),
      r.listen('error', (e) => {
        // "no-speech" and "aborted" just mean nothing usable was said.
        if (e.error === 'no-speech' || e.error === 'aborted' || e.error === 'speech-timeout') resolve(cancelled ? '' : latest);
        else reject(new Error(e.message || e.error));
      }),
      r.listen('end', () => resolve(cancelled ? '' : latest)),
    );
  }).finally(() => subs.forEach((s) => s.remove()));

  r.module.start({ lang: 'en-US', interimResults: true, continuous: false, addsPunctuation: true });
  return {
    done,
    stop: () => r.module.stop(),
    cancel: () => {
      cancelled = true;
      r.module.abort();
    },
  };
}

/** Reads text aloud. Resolves when speaking finishes or is stopped. */
export function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    Speech.stop();
    Speech.speak(text, {
      language: 'en-US',
      rate: Platform.OS === 'ios' ? 0.52 : 1.0,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}
