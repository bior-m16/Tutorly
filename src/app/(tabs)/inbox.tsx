import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import { supabase } from '../../../lib/supabase';

const BG = { uri: 'https://raw.githubusercontent.com/bior-m16/Pawell/main/UGC%20Hub%20Background.png' };

type Conversation = {
  id: string;
  last_message: string | null;
  last_message_at: string;
  business_id: string;
  creator_id: string;
  other_name: string;
};

export default function InboxScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/login'); return; }
    setUserId(user.id);
    await fetchConversations(user.id);
    setLoading(false);
  }

  async function fetchConversations(uid: string) {
    const { data } = await supabase
      .from('conversations')
      .select(`
        id, last_message, last_message_at, business_id, creator_id,
        business:profiles!conversations_business_id_fkey(full_name),
        creator:profiles!conversations_creator_id_fkey(full_name)
      `)
      .or(`business_id.eq.${uid},creator_id.eq.${uid}`)
      .order('last_message_at', { ascending: false });

    const mapped = (data ?? []).map((c: any) => ({
      id: c.id,
      last_message: c.last_message,
      last_message_at: c.last_message_at,
      business_id: c.business_id,
      creator_id: c.creator_id,
      other_name:
        c.business_id === uid
          ? c.creator?.full_name ?? 'Creator'
          : c.business?.full_name ?? 'Business',
    }));
    setConversations(mapped);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (userId) await fetchConversations(userId);
    setRefreshing(false);
  }, [userId]);

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  function renderItem({ item }: { item: Conversation }) {
    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.8}
        onPress={() => router.push({ pathname: '/chat', params: { id: item.id } })}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.other_name[0]?.toUpperCase()}</Text>
        </View>
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={styles.name}>{item.other_name}</Text>
            <Text style={styles.time}>{timeAgo(item.last_message_at)}</Text>
          </View>
          <Text style={styles.preview} numberOfLines={1}>
            {item.last_message ?? 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ImageBackground source={BG} style={styles.bg} imageStyle={styles.bgImage}>
    <SafeAreaView style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Messages</Text>}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No conversations yet.</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  bgImage: { opacity: 0.18 },
  container: { flex: 1, backgroundColor: 'rgba(255,255,255,0.78)' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  row: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  rowContent: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  name: { fontSize: 14, fontWeight: '700', color: '#000' },
  time: { fontSize: 12, color: '#aaa' },
  preview: { fontSize: 13, color: '#777' },
  separator: { height: 1, backgroundColor: '#f1f1f1', marginLeft: 80 },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#aaa' },
});
