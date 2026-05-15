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

const CORNER = 22;
const THICK = 2;

function EmptyState({ onScan }: { onScan: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyBracketBox}>
        <View style={[styles.eBracket, styles.eTL]} />
        <View style={[styles.eBracket, styles.eTR]} />
        <View style={[styles.eBracket, styles.eBL]} />
        <View style={[styles.eBracket, styles.eBR]} />
        <Ionicons name="book-outline" size={44} color="#AEAEB2" />
      </View>
      <Text style={styles.emptyTitle}>No History Yet</Text>
      <Text style={styles.emptySubtext}>
        Scan your first homework problem to get started
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onScan} activeOpacity={0.7}>
        <Ionicons name="camera-outline" size={18} color="#FFF" />
        <Text style={styles.emptyBtnText}>Scan a Problem</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { history, loading, deleteResult, clearHistory, reload } = useHistory();

  useFocusEffect(
    useCallback(() => { void reload(); }, [reload])
  );

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete?', 'Remove this problem from history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteResult(id) },
    ]);
  }, [deleteResult]);

  const handleClearAll = useCallback(() => {
    if (history.length === 0) return;
    Alert.alert('Clear All?', 'Remove all saved problems permanently?', [
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
        <ActivityIndicator size="large" color="#AEAEB2" />
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
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={15} color="#FF3B30" />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, history.length === 0 && styles.listEmpty]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState onScan={() => navigation.navigate('Scan')} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#EFEFEF' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFEFEF' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: '#AEAEB2', marginTop: 2, fontWeight: '500' },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  clearText: { fontSize: 13, fontWeight: '600', color: '#FF3B30' },

  list: { padding: 16 },
  listEmpty: { flex: 1 },

  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12,
  },
  emptyBracketBox: {
    width: 120, height: 120, marginBottom: 8,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  eBracket: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#AEAEB2' },
  eTL: { top: 0, left: 0, borderTopWidth: THICK, borderLeftWidth: THICK },
  eTR: { top: 0, right: 0, borderTopWidth: THICK, borderRightWidth: THICK },
  eBL: { bottom: 0, left: 0, borderBottomWidth: THICK, borderLeftWidth: THICK },
  eBR: { bottom: 0, right: 0, borderBottomWidth: THICK, borderRightWidth: THICK },

  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  emptySubtext: { fontSize: 14, color: '#6C6C70', textAlign: 'center', lineHeight: 21 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1C1C1E', borderRadius: 16,
    paddingHorizontal: 24, paddingVertical: 13, marginTop: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
