import React, { useCallback, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import GlowBackdrop from '../components/GlowBackdrop';
import { useHistory } from '../hooks/useHistory';
import { useDecks } from '../hooks/useDecks';
import { loadTutorChats } from '../hooks/useTutorChats';
import { checkIn, dayKey, loadCheckIns, streakLength } from '../hooks/useStreak';
import { hasPlus } from '../services/subscriptions';
import { showAlert } from '../utils/alert';
import { C, NEON, glow } from '../theme';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PERKS: { label: string; free: string; plus: string }[] = [
  { label: 'Answers and study tools', free: '5 a day', plus: 'Unlimited' },
  { label: 'Live calls with Tia', free: 'In your 5', plus: 'Unlimited' },
  { label: 'Quizzes, decks, summaries', free: 'In your 5', plus: 'Unlimited' },
];

function lastSevenDays(): { key: string; label: string }[] {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({ key: dayKey(d), label: i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' }) });
  }
  return out;
}

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { history, reload: loadHistory } = useHistory();
  const { decks, reload: reloadDecks } = useDecks();
  const [chats, setChats] = useState(0);
  const [days, setDays] = useState<string[]>([]);
  const [plus, setPlus] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
      reloadDecks();
      loadTutorChats().then((c) => setChats(c.length));
      loadCheckIns().then(setDays);
      hasPlus().then(setPlus).catch(() => setPlus(false));
    }, [loadHistory, reloadDecks]),
  );

  const today = dayKey();
  const checkedToday = days.includes(today);
  const streak = streakLength(days);
  const week = lastSevenDays();

  const share = () =>
    Share.share({
      message: "I've been studying with Tutorly: snap a homework question, get step-by-step help, quizzes, flashcards and a live tutor you can talk to.",
    }).catch(() => undefined);

  const about = () =>
    showAlert('About Tutorly', `Version ${Constants.expoConfig?.version ?? '1.0.0'}\nYour study tools and live tutor, Tia.`);

  const goTab = (name: 'History' | 'Tutor') => navigation.getParent()?.navigate(name) ?? (navigation as any).navigate(name);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <GlowBackdrop height={320} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Who */}
        <View style={styles.header}>
          <LinearGradient colors={[...NEON]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.avatar, glow(C.violet, 14, 0.35)]}>
            <Ionicons name="person" size={26} color="#FFFFFF" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>Guest learner</Text>
            <Text style={styles.sub}>{plus ? 'Tutorly Plus member' : 'Free plan · your progress stays on this device'}</Text>
          </View>
        </View>

        {/* Plus */}
        <View style={[styles.plusCard, glow(C.pink, 22, 0.18)]}>
          <LinearGradient
            colors={['#EEF2FF', '#F6EEFF', '#FFEFF7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]}
          />
          <View style={styles.plusTop}>
            <View style={{ flex: 1 }}>
              <LinearGradient colors={[...NEON]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.badge}>
                <Ionicons name="sparkles" size={11} color="#FFFFFF" />
                <Text style={styles.badgeText}>PLUS</Text>
              </LinearGradient>
              <Text style={styles.plusTitle}>{plus ? "You're on Plus" : 'Learn without limits'}</Text>
              <Text style={styles.plusSub}>{plus ? 'Everything is unlimited. Thanks for supporting Tutorly!' : 'Unlimited help, every tool, every day.'}</Text>
            </View>
            {!plus ? (
              <TouchableOpacity onPress={() => navigation.navigate('Plus')} activeOpacity={0.85} style={[{ borderRadius: 16 }, glow(C.violet, 14, 0.4)]}>
                <LinearGradient colors={[...NEON]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.plusBtn}>
                  <Text style={styles.plusBtnText}>See plans</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <Ionicons name="checkmark-circle" size={34} color={C.neon} />
            )}
          </View>
          {!plus ? (
            <>
              <View style={styles.tableHead}>
                <Text style={[styles.th, { flex: 1 }]}>What you get</Text>
                <Text style={[styles.th, styles.col]}>Free</Text>
                <Text style={[styles.th, styles.col, { color: C.neon }]}>Plus</Text>
              </View>
              {PERKS.map((p) => (
                <View key={p.label} style={styles.tr}>
                  <Text style={styles.td}>{p.label}</Text>
                  <Text style={[styles.tdSmall, styles.col]}>{p.free}</Text>
                  <Text style={[styles.tdSmall, styles.col, styles.tdPlus]}>{p.plus}</Text>
                </View>
              ))}
            </>
          ) : null}
        </View>

        {/* Numbers */}
        <View style={styles.stats}>
          {[
            { n: history.length, label: 'Solved', icon: 'checkmark-done' as const, color: C.blue },
            { n: decks.length, label: 'Decks', icon: 'albums' as const, color: C.pink },
            { n: chats, label: 'Chats', icon: 'chatbubbles' as const, color: C.violet },
          ].map((s) => (
            <View key={s.label} style={[styles.stat, glow(C.neon, 12, 0.08)]}>
              <Ionicons name={s.icon} size={18} color={s.color} />
              <Text style={styles.statNum}>{s.n}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Streak */}
        <View style={[styles.card, glow(C.neon, 14, 0.08)]}>
          <View style={styles.streakTop}>
            <View style={styles.flame}>
              <Ionicons name="flame" size={20} color="#FF7A45" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{streak > 0 ? `${streak}-day streak` : 'Start a streak'}</Text>
              <Text style={styles.cardSub}>Check in each day you study</Text>
            </View>
            <TouchableOpacity
              disabled={checkedToday}
              onPress={async () => setDays(await checkIn())}
              style={[styles.checkBtn, checkedToday && styles.checkBtnDone]}
            >
              <Text style={[styles.checkText, checkedToday && styles.checkTextDone]}>{checkedToday ? 'Done today' : 'Check in'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.week}>
            {week.map((d) => {
              const on = days.includes(d.key);
              const isToday = d.key === today;
              return (
                <View key={d.key} style={styles.dayWrap}>
                  {on ? (
                    <LinearGradient colors={[...NEON]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.day}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </LinearGradient>
                  ) : (
                    <View style={[styles.day, styles.dayOff, isToday && styles.dayToday]} />
                  )}
                  <Text style={[styles.dayLabel, isToday && { color: C.neon, fontWeight: '700' }]}>{d.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Your stuff */}
        <View style={[styles.list, glow(C.neon, 14, 0.08)]}>
          <Row icon="time-outline" color={C.blue} label="Study history" onPress={() => goTab('History')} />
          <Row icon="albums-outline" color={C.pink} label="Flashcard decks" onPress={() => navigation.navigate('StudySetup', { kind: 'flashcards' })} />
          <Row icon="chatbubbles-outline" color={C.violet} label="Tutor chats" onPress={() => goTab('Tutor')} last />
        </View>

        <View style={[styles.list, glow(C.neon, 14, 0.08)]}>
          <Row icon="help-buoy-outline" color={C.neon} label="Help and feedback" onPress={() => navigation.navigate('Help')} />
          <Row icon="share-social-outline" color={C.pink} label="Share Tutorly with friends" onPress={share} />
          <Row icon="information-circle-outline" color={C.blue} label="About Tutorly" onPress={about} last />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row(props: { icon: keyof typeof Ionicons.glyphMap; color: string; label: string; onPress: () => void; last?: boolean }) {
  return (
    <TouchableOpacity style={[styles.row, !props.last && styles.rowLine]} onPress={props.onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: `${props.color}1A` }]}>
        <Ionicons name={props.icon} size={18} color={props.color} />
      </View>
      <Text style={styles.rowLabel}>{props.label}</Text>
      <Ionicons name="chevron-forward" size={18} color={C.faint} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 8, paddingBottom: 18 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 26, fontWeight: '800', color: C.ink, letterSpacing: -0.4 },
  sub: { fontSize: 13, color: C.sub, marginTop: 2 },

  plusCard: { borderRadius: 24, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(122,92,255,0.18)', overflow: 'hidden' },
  plusTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  plusTitle: { fontSize: 22, fontWeight: '800', color: C.ink, marginTop: 8, letterSpacing: -0.3 },
  plusSub: { fontSize: 13, color: C.sub, marginTop: 3 },
  plusBtn: { borderRadius: 16, paddingHorizontal: 18, paddingVertical: 13 },
  plusBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  tableHead: { flexDirection: 'row', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(122,92,255,0.15)' },
  th: { fontSize: 12, fontWeight: '700', color: C.sub },
  col: { width: 74, textAlign: 'center' },
  tr: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  td: { flex: 1, fontSize: 14, fontWeight: '600', color: C.ink },
  tdSmall: { fontSize: 12, color: C.sub },
  tdPlus: { color: C.neon, fontWeight: '800' },

  stats: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  stat: { flex: 1, backgroundColor: C.card, borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: C.ink, marginTop: 4 },
  statLabel: { fontSize: 12, color: C.sub, fontWeight: '600' },

  card: { backgroundColor: C.card, borderRadius: 22, padding: 16, marginBottom: 14 },
  streakTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flame: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF0E6', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '800', color: C.ink },
  cardSub: { fontSize: 12, color: C.sub, marginTop: 2 },
  checkBtn: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#FFE8F4', borderWidth: 1, borderColor: 'rgba(255,93,177,0.35)' },
  checkBtnDone: { backgroundColor: C.chip, borderColor: 'transparent' },
  checkText: { color: '#E0449A', fontWeight: '800', fontSize: 14 },
  checkTextDone: { color: C.sub },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  dayWrap: { alignItems: 'center', gap: 6 },
  day: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayOff: { backgroundColor: C.chip },
  dayToday: { borderWidth: 2, borderColor: 'rgba(106,76,255,0.45)' },
  dayLabel: { fontSize: 11, color: C.sub },

  list: { backgroundColor: C.card, borderRadius: 22, paddingHorizontal: 14, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowLine: { borderBottomWidth: 1, borderBottomColor: C.line },
  rowIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: C.ink },
});
