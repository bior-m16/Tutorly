import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeworkResult } from '../types';

const STORAGE_KEY = 'tutorly_history';

export function useHistory() {
  const [history, setHistory] = useState<HomeworkResult[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored) as HomeworkResult[]);
      }
    } catch {
      // start with empty history on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const saveResult = useCallback(async (result: HomeworkResult) => {
    setHistory((prev) => {
      const updated = [result, ...prev];
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteResult = useCallback(async (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return { history, loading, saveResult, deleteResult, clearHistory, reload: loadHistory };
}
