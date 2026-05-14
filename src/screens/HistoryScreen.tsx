import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHistory } from '../hooks/useHistory';
import HistoryItem from '../components/HistoryItem';
import { HomeworkResult, RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const COLORS = {
  primary: '#6C63FF',
  background: '#F8F9FE',
  text: '#2D3748',
  textLight: '#718096',
  white: '#FFFFFF',
  danger: '#FC8181',
};

function EmptyState({ onScan }: { onScan: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📚</Text>
      <Text style={styles.emptyTitle}>No History Yet</Text>
      <Text style={styles.emptySubtext}>
        Scan your first homework problem to get started!
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onScan}>
        <Ionicons name="camera-outline" size={20} color={COLORS.white} />
        <Text style={styles.emptyBtnText}>Scan a Problem</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { history, loading, deleteResult, clearHistory, reload } = useHistory();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert('Delete?', 'Remove this problem from your history?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteResult(id) },
      ]);
    },
    [deleteResult]
  );

  const handleClearAll = useCallback(() => {
    if (history.length === 0) return;
    Alert.alert('Clear All History?', 'This will remove all saved problems. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: () => clearHistory() },
    ]);
  }, [history.length, clearHistory]);

  const renderItem = useCallback(
    ({ item }: { item: HomeworkResult }) => (
      <HistoryItem
        item={item}
        onPress={() => navigation.navigate('Result', { result: item })}
        onDelete={() => handleDelete(item.id)}
      />
    ),
    [navigation, handleDelete]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSubtitle}>{history.length} problems solved</Text>
        </View>
        {history.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            <Text style={styles.clearBtnText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          history.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState onScan={() => navigation.navigate('Scan')} />}
        ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.danger,
  },
  listContent: {
    padding: 16,
  },
  listContentEmpty: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 13,
    marginTop: 8,
  },
  emptyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
