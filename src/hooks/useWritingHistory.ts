import AsyncStorage from '@react-native-async-storage/async-storage';
import { WritingPiece } from '../types';

const KEY = 'tutorly_writing';
const MAX = 30;

export async function loadWriting(): Promise<WritingPiece[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WritingPiece[]) : [];
  } catch {
    return [];
  }
}

export async function saveWriting(piece: WritingPiece): Promise<void> {
  const rest = (await loadWriting()).filter((p) => p.id !== piece.id);
  await AsyncStorage.setItem(KEY, JSON.stringify([piece, ...rest].slice(0, MAX)));
}

export async function deleteWriting(id: string): Promise<WritingPiece[]> {
  const next = (await loadWriting()).filter((p) => p.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
