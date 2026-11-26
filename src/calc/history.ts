import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CalcEntry {
  expr: string;
  result: string;
}

const KEY = 'tutorly_calc_history';
const MAX = 50;

export async function loadCalcHistory(): Promise<CalcEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CalcEntry[]) : [];
  } catch {
    return [];
  }
}

export async function addCalcHistory(entry: CalcEntry): Promise<CalcEntry[]> {
  const next = [entry, ...(await loadCalcHistory())].slice(0, MAX);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function clearCalcHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
