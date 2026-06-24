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
  Alert,
} from 'react-native';
import { supabase } from '../../../lib/supabase';

type Profile = { id: string; full_name: string; role: 'business' | 'creator' };
type Campaign = {
  id: string;
  title: string;
  brief: string;
  cpm_rate: number;
  budget_total: number;
  budget_remaining: number;
  platforms: string[];
  status: string;
  created_at: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace('/login');
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      await fetchCampaigns(profileData);
    }
    setLoading(false);
  }

  async function fetchCampaigns(p: Profile) {
    if (p.role === 'business') {
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .eq('owner_id', p.id)
        .order('created_at', { ascending: false });
      setCampaigns(data ?? []);
    } else {
      const { data } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      setCampaigns(data ?? []);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (profile) await fetchCampaigns(profile);
    setRefreshing(false);
  }, [profile]);

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/');
        },
      },
    ]);
  }

  function renderCampaign({ item }: { item: Campaign }) {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => router.push({ pathname: '/campaign-detail', params: { id: item.id } })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <StatusBadge status={item.status} />
        </View>
        <Text style={styles.cardBrief} numberOfLines={2}>{item.brief}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.metaItem}>💰 ${item.cpm_rate} CPM</Text>
          <Text style={styles.metaItem}>💼 ${item.budget_remaining} left</Text>
        </View>
        {item.platforms?.length > 0 && (
          <View style={styles.platforms}>
            {item.platforms.map((p) => (
              <View key={p} style={styles.platformTag}>
                <Text style={styles.platformTagText}>{p}</Text>
              </View>
            ))}
          </View>
        )}
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
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>
            Hey, {profile?.full_name?.split(' ')[0] ?? 'there'} 👋
          </Text>
          <Text style={styles.roleLabel}>
            {profile?.role === 'business' ? 'Business Account' : 'Creator Account'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {profile?.role === 'business' && (
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/create-campaign')}
          activeOpacity={0.85}
        >
          <Text style={styles.createBtnText}>+ New Campaign</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>
        {profile?.role === 'business' ? 'Your Campaigns' : 'Active Campaigns'}
      </Text>

      <FlatList
        data={campaigns}
        keyExtractor={(item) => item.id}
        renderItem={renderCampaign}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {profile?.role === 'business'
                ? 'No campaigns yet. Create your first one!'
                : 'No active campaigns available right now.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    active: { bg: '#e6f9ef', text: '#1a7a42' },
    pending: { bg: '#f5f5f5', text: '#666' },
    closed: { bg: '#fde8e8', text: '#c0392b' },
  };
  const c = colors[status] ?? colors.pending;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#000' },
  roleLabel: { fontSize: 13, color: '#888', marginTop: 2 },
  signOutText: { fontSize: 14, color: '#888', paddingTop: 4 },
  createBtn: {
    backgroundColor: '#000',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 12 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 16,
    backgroundColor: '#fff',
    gap: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#000', flex: 1, marginRight: 8 },
  cardBrief: { fontSize: 13, color: '#666', lineHeight: 20 },
  cardMeta: { flexDirection: 'row', gap: 16 },
  metaItem: { fontSize: 13, color: '#444' },
  platforms: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  platformTag: {
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  platformTagText: { fontSize: 11, fontWeight: '600', color: '#555' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#aaa', textAlign: 'center' },
});
