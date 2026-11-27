import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import GlowBackdrop from '../components/GlowBackdrop';
import { Plan, buyPlan, getPlans, hasPlus, purchasesAvailable, restorePlus } from '../services/subscriptions';
import { showAlert } from '../utils/alert';
import { friendlyError } from '../services/claudeService';
import { C, NEON, glow } from '../theme';

const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; color: string; title: string; body: string }[] = [
  { icon: 'infinite', color: C.neon, title: 'No daily cap', body: 'Snap, type and ask as many questions as you need.' },
  { icon: 'mic', color: C.pink, title: 'Talk with Tia any time', body: 'Live voice sessions with your tutor, as often as you like.' },
  { icon: 'albums', color: C.blue, title: 'Every study tool', body: 'Quizzes, flashcards, summaries and writing help, unlimited.' },
  { icon: 'heart', color: C.violet, title: 'Support Tutorly', body: 'Help us keep building better ways to learn.' },
];

export default function PlusScreen() {
  const navigation = useNavigation();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [plus, setPlus] = useState(false);
  const canBuy = purchasesAvailable();

  useEffect(() => {
    hasPlus().then(setPlus).catch(() => undefined);
    getPlans()
      .then((list) => {
        setPlans(list);
        // Default to the longest plan, which usually costs least per month.
        if (list.length) setPicked(list[list.length - 1].id);
      })
      .catch(() => setPlans([]));
  }, []);

  const buy = async () => {
    if (!picked) return;
    setBusy(true);
    try {
      if (await buyPlan(picked)) {
        setPlus(true);
        showAlert('Welcome to Plus!', 'Everything in Tutorly is now unlimited.');
      }
    } catch (err) {
      showAlert('Purchase failed', friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    setBusy(true);
    try {
      const ok = await restorePlus();
      setPlus(ok);
      showAlert(ok ? 'Plus restored' : 'Nothing to restore', ok ? 'Your Plus plan is active again.' : 'We could not find a Plus plan on this store account.');
    } catch (err) {
      showAlert('Restore failed', friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const store = Platform.OS === 'ios' ? 'Apple ID' : 'Google Play account';

  return (
    <SafeAreaView style={styles.safe}>
      <GlowBackdrop height={380} />
      <View style={styles.top}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.close} accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={C.ink} />
        </TouchableOpacity>
        {canBuy ? (
          <TouchableOpacity onPress={restore} disabled={busy}>
            <Text style={styles.restore}>Restore</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[...NEON]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.heroIcon, glow(C.violet, 26, 0.5)]}>
          <Ionicons name="sparkles" size={34} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.kicker}>TUTORLY PLUS</Text>
        <Text style={styles.title}>{plus ? "You're on Plus" : 'Learn without limits'}</Text>
        <Text style={styles.lead}>
          {plus ? 'Thanks for supporting Tutorly. Everything is unlimited.' : 'Free gives you 5 a day. Plus removes the cap on everything.'}
        </Text>

        <View style={[styles.card, glow(C.neon, 16, 0.1)]}>
          {BENEFITS.map((b, i) => (
            <View key={b.title} style={[styles.benefit, i < BENEFITS.length - 1 && styles.line]}>
              <View style={[styles.benefitIcon, { backgroundColor: `${b.color}1A` }]}>
                <Ionicons name={b.icon} size={18} color={b.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitBody}>{b.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {plus ? null : !canBuy ? (
          <View style={styles.note}>
            <Ionicons name="phone-portrait-outline" size={20} color={C.neon} />
            <Text style={styles.noteText}>Plans are available in the Tutorly app on your phone.</Text>
          </View>
        ) : plans === null ? (
          <ActivityIndicator color={C.neon} style={{ marginTop: 24 }} />
        ) : plans.length === 0 ? (
          <View style={styles.note}>
            <Ionicons name="time-outline" size={20} color={C.neon} />
            <Text style={styles.noteText}>Plans aren't available right now. Please try again later.</Text>
          </View>
        ) : (
          <>
            {plans.map((p) => {
              const on = p.id === picked;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setPicked(p.id)}
                  activeOpacity={0.85}
                  style={[styles.plan, on && styles.planOn, on && glow(C.violet, 16, 0.25)]}
                >
                  <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planLabel}>{p.label}</Text>
                    {p.trial ? <Text style={styles.trial}>{p.trial}</Text> : null}
                  </View>
                  <Text style={styles.price}>
                    {p.price}
                    <Text style={styles.period}>{p.period}</Text>
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity onPress={buy} disabled={busy || !picked} activeOpacity={0.85} style={[{ marginTop: 18, borderRadius: 18 }, glow(C.violet, 18, 0.4)]}>
              <LinearGradient colors={[...NEON]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
                {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.ctaText}>Continue</Text>}
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.fine}>
              Plus renews automatically at the price shown until you cancel. Cancel any time in your {store} settings at least 24 hours
              before the period ends.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingTop: 4 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  restore: { color: C.neon, fontSize: 15, fontWeight: '700', paddingHorizontal: 8 },
  content: { paddingHorizontal: 20, paddingBottom: 40, alignItems: 'stretch', maxWidth: 560, width: '100%', alignSelf: 'center' },
  heroIcon: { width: 76, height: 76, borderRadius: 26, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 8 },
  kicker: { textAlign: 'center', color: C.neon, fontSize: 12, fontWeight: '800', letterSpacing: 2, marginTop: 18 },
  title: { textAlign: 'center', color: C.ink, fontSize: 30, fontWeight: '800', letterSpacing: -0.6, marginTop: 6 },
  lead: { textAlign: 'center', color: C.sub, fontSize: 15, lineHeight: 21, marginTop: 8, marginBottom: 20 },
  card: { backgroundColor: C.card, borderRadius: 22, paddingHorizontal: 16 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  line: { borderBottomWidth: 1, borderBottomColor: C.line },
  benefitIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  benefitTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  benefitBody: { fontSize: 13, color: C.sub, marginTop: 2, lineHeight: 18 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.chip, borderRadius: 16, padding: 14, marginTop: 18 },
  noteText: { flex: 1, color: C.ink, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  plan: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 18, padding: 16, marginTop: 12,
    borderWidth: 2, borderColor: 'transparent',
  },
  planOn: { borderColor: C.violet },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.faint, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: C.violet },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.violet },
  planLabel: { fontSize: 16, fontWeight: '700', color: C.ink },
  trial: { fontSize: 12, color: C.pink, fontWeight: '700', marginTop: 2 },
  price: { fontSize: 17, fontWeight: '800', color: C.ink },
  period: { fontSize: 13, fontWeight: '600', color: C.sub },
  cta: { borderRadius: 18, paddingVertical: 16, alignItems: 'center' },
  ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  fine: { color: C.faint, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 14 },
});
