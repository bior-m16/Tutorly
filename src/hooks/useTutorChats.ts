import AsyncStorage from '@react-native-async-storage/async-storage';
import { TutorChat } from '../types';

const KEY = 'tutorly_tutor_chats';
const MAX = 30;

export async function loadTutorChats(): Promise<TutorChat[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TutorChat[]) : [];
  } catch {
    return [];
  }
}

export async function saveTutorChat(chat: TutorChat): Promise<void> {
  const rest = (await loadTutorChats()).filter((c) => c.id !== chat.id);
  await AsyncStorage.setItem(KEY, JSON.stringify([chat, ...rest].slice(0, MAX)));
}

export async function deleteTutorChat(id: string): Promise<void> {
  const rest = (await loadTutorChats()).filter((c) => c.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(rest));
}
