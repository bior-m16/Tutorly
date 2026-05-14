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

const C = {
  bg: '#0B0B0B',
  surface: '#1A1A1A',
  border: '#2C2C2E',
  text: '#FFFFFF',
  textMuted: '#8E8E93',
  danger: '#FF453A',
};

function EmptyState({ onScan }: { onScan: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      {/* Scanner bracket decoration */}
      <View style={styles.emptyBrackets}>
        <View style={[styles.eBracket, styles.eTL]} />
        <View style={[styles.eBracket, styles.eTR]} />
        <View style={[styles.eBracket, styles.eBL]} />
        <View style={[styles.eBracket, styles.eBR]} />
        <Ionicons name="book-outline" size={40} color={C.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No History Yet</Text>
      <Text style={styles.emptySubtext}>
        Scan your first homework problem to get started
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onScan}>
        <Ionicons name="camera-outline" size={18} color="#000" />
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
      Alert.alert('Delete?', 'Remove this problem from history?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteResult(id) },
      ]);
    },
    [deleteResult]
  );

  const handleClearAll = useCallback(() => {
    if (history.length === 0) return;
    Alert.alert('Clear All?', 'This will remove all saved problems permanently.', [
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
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={C.textMuted} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSub}>{history.length} problems solved</Text>
        </View>
        {history.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
            <Ionicons name="trash-outline" size={16} color={C.danger} />
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          history.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState onScan={() => navigation.navigate('Scan')} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B0B0B' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0B0B' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: C.text },
  headerSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,69,58,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.2)',
  },
  clearBtnText: { fontSize: 13, fontWeight: '600', color: C.danger },

  listContent: { padding: 16 },
  listEmpty: { flex: 1 },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyBrackets: {
    width: 110,
    height: 110,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  eBracket: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: C.textMuted,
  },
  eTL: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  eTR: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  eBL: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  eBR: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  emptySubtext: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 21 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.text,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 13,
    marginTop: 8,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#000' },
});
