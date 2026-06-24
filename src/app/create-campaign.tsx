import { useState } from 'react';
import { useRouter } from 'expo-router';
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
} from 'react-native';
import { supabase } from '../../lib/supabase';

const PLATFORMS = ['tiktok', 'instagram', 'youtube'] as const;

export default function CreateCampaignScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [cpmRate, setCpmRate] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function togglePlatform(p: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function handleSubmit() {
    if (!title.trim()) { Alert.alert('Required', 'Campaign title is required.'); return; }
    if (!cpmRate || isNaN(Number(cpmRate))) { Alert.alert('Required', 'Enter a valid CPM rate.'); return; }
    if (!budget || isNaN(Number(budget))) { Alert.alert('Required', 'Enter a valid budget.'); return; }
    if (selectedPlatforms.length === 0) { Alert.alert('Required', 'Select at least one platform.'); return; }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/login'); return; }

    const budgetNum = parseFloat(budget);
    const { error } = await supabase.from('campaigns').insert({
      owner_id: user.id,
      title: title.trim(),
      brief: brief.trim(),
      product_url: productUrl.trim(),
      cpm_rate: parseFloat(cpmRate),
      budget_total: budgetNum,
      budget_remaining: budgetNum,
      platforms: selectedPlatforms,
      status: 'active',
    });

    setSubmitting(false);
    if (error) { Alert.alert('Error', error.message); return; }
    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="Campaign Title *">
          <TextInput
            style={styles.input}
            placeholder="e.g. Summer product launch"
            placeholderTextColor="#bbb"
            value={title}
            onChangeText={setTitle}
          />
        </Field>

        <Field label="Brief">
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe what creators should make..."
            placeholderTextColor="#bbb"
            value={brief}
            onChangeText={setBrief}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Field>

        <Field label="Product URL">
          <TextInput
            style={styles.input}
            placeholder="https://yourproduct.com"
            placeholderTextColor="#bbb"
            value={productUrl}
            onChangeText={setProductUrl}
            keyboardType="url"
            autoCapitalize="none"
          />
        </Field>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>CPM Rate ($) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5.00"
              placeholderTextColor="#bbb"
              value={cpmRate}
              onChangeText={setCpmRate}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Total Budget ($) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 500"
              placeholderTextColor="#bbb"
              value={budget}
              onChangeText={setBudget}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <Field label="Platforms *">
          <View style={styles.platforms}>
            {PLATFORMS.map((p) => {
              const active = selectedPlatforms.includes(p);
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.platformBtn, active && styles.platformBtnActive]}
                  onPress={() => togglePlatform(p)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.platformBtnText, active && styles.platformBtnTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Field>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Launch Campaign</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#000' },
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
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1, gap: 6 },
  platforms: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  platformBtn: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  platformBtnActive: { backgroundColor: '#000', borderColor: '#000' },
  platformBtnText: { fontSize: 13, fontWeight: '600', color: '#444', textTransform: 'capitalize' },
  platformBtnTextActive: { color: '#fff' },
  submitBtn: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
