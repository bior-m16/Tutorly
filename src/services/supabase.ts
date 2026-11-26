import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const extra = (Constants.expoConfig?.extra ?? {}) as { supabaseUrl?: string; supabaseKey?: string };

// The URL and publishable key are public by design; the Anthropic key lives only in the backend.
// EXPO_PUBLIC_* vars are inlined at build time; `extra` covers EAS builds; the defaults keep web
// exports working, where expoConfig can be missing.
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl || 'https://qemztgyclxbnamlgbppg.supabase.co';
const SUPABASE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_KEY || extra.supabaseKey || 'sb_publishable_ZvAqMLEyBQGT_fK0Ir8lEg_6lsMXfm_';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

/** Every device gets an anonymous account so the backend can count its free daily solves. */
export async function ensureSession(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw new Error(`sign_in_failed: ${error.message}`);
}
