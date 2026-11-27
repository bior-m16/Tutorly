import AsyncStorage from '@react-native-async-storage/async-storage';

// Daily study check-ins, kept on this device.
const KEY = 'tutorly_streak';

export function dayKey(d: Date = new Date()): string {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()}-${m < 10 ? '0' : ''}${m}-${day < 10 ? '0' : ''}${day}`;
}

export async function loadCheckIns(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function checkIn(): Promise<string[]> {
  const days = await loadCheckIns();
  const today = dayKey();
  if (days.includes(today)) return days;
  const next = [...days, today].slice(-120);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

/** Consecutive days checked in, counting back from today (or from yesterday if today isn't done yet). */
export function streakLength(days: string[]): number {
  const set = new Set(days);
  const d = new Date();
  if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(dayKey(d))) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
