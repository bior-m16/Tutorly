import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import { supabase } from '../../lib/supabase';

const BG = { uri: 'https://raw.githubusercontent.com/bior-m16/Pawell/main/UGC%20Hub%20Background.png' };

type Campaign = {
  id: string;
  title: string;
  brief: string;
  product_url: string;
  cpm_rate: number;
  budget_total: number;
  budget_remaining: number;
  platforms: string[];
  status: string;
  deadline: string | null;
};

export default function CampaignDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [existingApp, setExistingApp] = useState<{ id: string; status: string } | null>(null);
  const [pitch, setPitch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/login'); return; }
    setUserId(user.id);

    const { data: camp } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    setCampaign(camp ?? null);

    const { data: app } = await supabase
      .from('applications')
      .select('id, status')
      .eq('campaign_id', id)
      .eq('creator_id', user.id)
      .maybeSingle();

    setExistingApp(app ?? null);
    setLoading(false);
  }

  async function handleApply() {
    if (!userId || !campaign) return;
    setSubmitting(true);

    const { error } = await supabase.from('applications').insert({
      campaign_id: campaign.id,
      creator_id: userId,
      pitch: pitch.trim(),
    });

    setSubmitting(false);
    if (error) { Alert.alert('Error', error.message); return; }

    Alert.alert('Applied!', 'Your application has been submitted.');
    await loadData();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!campaign) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Campaign not found.</Text>
      </View>
    );
  }

  return (
    <ImageBackground source={BG} style={styles.bg} imageStyle={styles.bgImage}>
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{campaign.title}</Text>
          <StatusBadge status={campaign.status} />
        </View>

        <View style={styles.metaRow}>
          <MetaChip label="CPM" value={`$${campaign.cpm_rate}`} />
          <MetaChip label="Budget left" value={`$${campaign.budget_remaining}`} />
          <MetaChip label="Total" value={`$${campaign.budget_total}`} />
        </View>

        {campaign.platforms?.length > 0 && (
          <View style={styles.platforms}>
            {campaign.platforms.map((p) => (
              <View key={p} style={styles.platformTag}>
                <Text style={styles.platformTagText}>{p}</Text>
              </View>
            ))}
          </View>
        )}

        {campaign.brief ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Brief</Text>
            <Text style={styles.sectionBody}>{campaign.brief}</Text>
          </View>
        ) : null}

        {campaign.product_url ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Product URL</Text>
            <Text style={styles.sectionBody}>{campaign.product_url}</Text>
          </View>
        ) : null}

        <View style={styles.earningsBox}>
          <Text style={styles.earningsLabel}>Your earnings per 1,000 views</Text>
          <Text style={styles.earningsAmount}>
            ${(campaign.cpm_rate * 0.85).toFixed(2)}
          </Text>
          <Text style={styles.earningsSub}>Platform takes 15%</Text>
        </View>

        {existingApp ? (
          <View style={styles.appliedBox}>
            <Text style={styles.appliedText}>
              Application {existingApp.status}
            </Text>
            {existingApp.status === 'approved' && (
              <TouchableOpacity
                style={styles.messageBtn}
                onPress={async () => {
                  const { data } = await supabase
                    .from('conversations')
                    .select('id')
                    .eq('application_id', existingApp.id)
                    .single();
                  if (data) router.push({ pathname: '/chat', params: { id: data.id } });
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.messageBtnText}>Message Business</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          campaign.status === 'active' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Your pitch (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="Tell the business why you're a great fit..."
                  placeholderTextColor="#bbb"
                  value={pitch}
                  onChangeText={setPitch}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity
                style={[styles.applyBtn, submitting && { opacity: 0.6 }]}
                onPress={handleApply}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.applyBtnText}>Apply to Campaign</Text>
                )}
              </TouchableOpacity>
            </>
          )
        )}
      </ScrollView>
    </SafeAreaView>
    </ImageBackground>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaChip}>
      <Text style={styles.metaChipLabel}>{label}</Text>
      <Text style={styles.metaChipValue}>{value}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    active: { bg: '#e6f9ef', text: '#1a7a42' },
    closed: { bg: '#fde8e8', text: '#c0392b' },
    paused: { bg: '#fff8e1', text: '#b8860b' },
    draft: { bg: '#f5f5f5', text: '#666' },
  };
  const c = colors[status] ?? colors.draft;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  bgImage: { opacity: 0.18 },
  container: { flex: 1, backgroundColor: 'rgba(255,255,255,0.78)' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 15, color: '#aaa' },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#000', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  metaRow: { flexDirection: 'row', gap: 10 },
  metaChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  metaChipLabel: { fontSize: 11, color: '#aaa', marginBottom: 2 },
  metaChipValue: { fontSize: 14, fontWeight: '700', color: '#000' },
  platforms: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  platformTag: {
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  platformTagText: { fontSize: 12, fontWeight: '600', color: '#555', textTransform: 'capitalize' },
  section: { gap: 6 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#000' },
  sectionBody: { fontSize: 14, color: '#444', lineHeight: 22 },
  earningsBox: {
    backgroundColor: '#f1f1f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  earningsLabel: { fontSize: 13, color: '#666' },
  earningsAmount: { fontSize: 28, fontWeight: '800', color: '#000' },
  earningsSub: { fontSize: 12, color: '#aaa' },
  appliedBox: { borderRadius: 12, borderWidth: 1, borderColor: '#eee', padding: 16, gap: 12, alignItems: 'center' },
  appliedText: { fontSize: 15, fontWeight: '700', color: '#000', textTransform: 'capitalize' },
  messageBtn: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  messageBtnText: { fontSize: 14, fontWeight: '700', color: '#000' },
  input: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000',
    backgroundColor: '#fafafa',
  },
  textarea: { height: 100 },
  applyBtn: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
