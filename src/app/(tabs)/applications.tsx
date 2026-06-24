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
type Application = {
  id: string;
  pitch: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  campaigns: { id: string; title: string; cpm_rate: number } | null;
  profiles: { id: string; full_name: string } | null;
};

export default function ApplicationsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/login'); return; }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      await fetchApplications(profileData);
    }
    setLoading(false);
  }

  async function fetchApplications(p: Profile) {
    if (p.role === 'creator') {
      const { data } = await supabase
        .from('applications')
        .select('id, pitch, status, created_at, campaigns(id, title, cpm_rate)')
        .eq('creator_id', p.id)
        .order('created_at', { ascending: false });
      setApplications((data as any) ?? []);
    } else {
      const { data: campaignRows } = await supabase
        .from('campaigns')
        .select('id')
        .eq('owner_id', p.id);

      const campaignIds = (campaignRows ?? []).map((c: any) => c.id);
      if (campaignIds.length === 0) { setApplications([]); return; }

      const { data } = await supabase
        .from('applications')
        .select('id, pitch, status, created_at, campaigns(id, title, cpm_rate), profiles(id, full_name)')
        .in('campaign_id', campaignIds)
        .order('created_at', { ascending: false });
      setApplications((data as any) ?? []);
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (profile) await fetchApplications(profile);
    setRefreshing(false);
  }, [profile]);

  async function handleApprove(app: Application) {
    const { error } = await supabase
      .from('applications')
      .update({ status: 'approved' })
      .eq('id', app.id);

    if (error) { Alert.alert('Error', error.message); return; }

    // Auto-create conversation
    await supabase.from('conversations').insert({
      application_id: app.id,
      business_id: profile?.id,
      creator_id: app.profiles?.id,
    });

    if (profile) await fetchApplications(profile);
  }

  async function handleReject(app: Application) {
    const { error } = await supabase
      .from('applications')
      .update({ status: 'rejected' })
      .eq('id', app.id);

    if (error) { Alert.alert('Error', error.message); return; }
    if (profile) await fetchApplications(profile);
  }

  async function goToChat(appId: string) {
    const { data } = await supabase
      .from('conversations')
      .select('id')
      .eq('application_id', appId)
      .single();

    if (data) {
      router.push({ pathname: '/chat', params: { id: data.id } });
    }
  }

  function renderItem({ item }: { item: Application }) {
    const isBusinessView = profile?.role === 'business';
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {isBusinessView
              ? item.profiles?.full_name ?? 'Creator'
              : item.campaigns?.title ?? 'Campaign'}
          </Text>
          <StatusBadge status={item.status} />
        </View>

        {isBusinessView && item.campaigns && (
          <Text style={styles.subLabel}>{item.campaigns.title} · ${item.campaigns.cpm_rate} CPM</Text>
        )}

        {item.pitch ? (
          <Text style={styles.pitch}>"{item.pitch}"</Text>
        ) : (
          <Text style={styles.noPitch}>No pitch provided</Text>
        )}

        {isBusinessView && item.status === 'pending' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.approveBtn}
              onPress={() => handleApprove(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => handleReject(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'approved' && (
          <TouchableOpacity
            style={styles.messageBtn}
            onPress={() => goToChat(item.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.messageBtnText}>
              {isBusinessView ? 'Message Creator' : 'Message Business'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>
            {profile?.role === 'business' ? 'Incoming Applications' : 'My Applications'}
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {profile?.role === 'business'
                ? 'No applications yet.'
                : "You haven't applied to any campaigns yet."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    approved: { bg: '#e6f9ef', text: '#1a7a42' },
    rejected: { bg: '#fde8e8', text: '#c0392b' },
    pending: { bg: '#f5f5f5', text: '#666' },
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
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
  subLabel: { fontSize: 12, color: '#888' },
  pitch: { fontSize: 13, color: '#444', fontStyle: 'italic', lineHeight: 20 },
  noPitch: { fontSize: 13, color: '#bbb' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  approveBtn: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  rejectBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  rejectBtnText: { color: '#c0392b', fontWeight: '700', fontSize: 13 },
  messageBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 4,
  },
  messageBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#aaa', textAlign: 'center' },
});
