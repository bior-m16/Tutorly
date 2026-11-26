import AsyncStorage from '@react-native-async-storage/async-storage';
import { Summary } from '../types';

const KEY = 'tutorly_summaries';
const MAX = 30;

export async function loadSummaries(): Promise<Summary[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Summary[]) : [];
  } catch {
    return [];
  }
}

export async function saveSummary(s: Summary): Promise<void> {
  const rest = (await loadSummaries()).filter((x) => x.id !== s.id);
  await AsyncStorage.setItem(KEY, JSON.stringify([s, ...rest].slice(0, MAX)));
}
