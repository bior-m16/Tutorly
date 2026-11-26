import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Deck } from '../types';

const STORAGE_KEY = 'tutorly_decks';

async function read(): Promise<Deck[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Deck[]) : [];
  } catch {
    return [];
  }
}

export async function saveDeck(deck: Deck): Promise<void> {
  const decks = await read();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([deck, ...decks.filter((d) => d.id !== deck.id)]));
}

export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>([]);

  const reload = useCallback(async () => {
    setDecks(await read());
  }, []);

  const deleteDeck = useCallback(async (id: string) => {
    const next = (await read()).filter((d) => d.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setDecks(next);
  }, []);

  return { decks, reload, deleteDeck };
}
