import React, { useLayoutEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Pressable } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flashcard, RootStackParamList } from '../types';

type RouteT = RouteProp<RootStackParamList, 'Flashcards'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function FlashcardsScreen() {
  const { deck } = useRoute<RouteT>().params;
  const navigation = useNavigation<Nav>();

  const [cards, setCards] = useState<Flashcard[]>(deck.cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [learning, setLearning] = useState<Flashcard[]>([]);
  const [done, setDone] = useState(false);
  const flip = useRef(new Animated.Value(0)).current;

  useLayoutEffect(() => {
    navigation.setOptions({ title: deck.title });
  }, [navigation, deck.title]);

  const card = cards[index];

  const toggle = () => {
    Animated.timing(flip, { toValue: flipped ? 0 : 1, duration: 260, useNativeDriver: true }).start();
    setFlipped(!flipped);
  };

  const answer = (knew: boolean) => {
    const nextLearning = knew ? learning : [...learning, card];
    setLearning(nextLearning);
    flip.setValue(0);
    setFlipped(false);
    if (index + 1 >= cards.length) {
      setDone(true);
    } else {
      setIndex(index + 1);
    }
  };

  const restart = (subset: Flashcard[]) => {
    setCards(subset);
    setIndex(0);
    setLearning([]);
    setDone(false);
    flip.setValue(0);
    setFlipped(false);
  };

  if (done) {
    const known = cards.length - learning.length;
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.doneWrap}>
          <Ionicons name={learning.length === 0 ? 'trophy' : 'albums'} size={56} color="#1C1C1E" />
          <Text style={styles.doneTitle}>
            {learning.length === 0 ? 'You know them all!' : `${known} of ${cards.length} down`}
          </Text>
          <Text style={styles.doneSub}>
            {learning.length === 0
              ? 'Come back tomorrow to keep them fresh.'
              : learning.length === 1 ? '1 card still needs practice.' : `${learning.length} cards still need practice.`}
          </Text>
          {learning.length > 0 ? (
            <TouchableOpacity style={styles.primary} onPress={() => restart(learning)} activeOpacity={0.8}>
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.primaryText}>Practise {learning.length === 1 ? 'that card' : `those ${learning.length}`} again</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={learning.length > 0 ? styles.secondary : styles.primary}
            onPress={() => restart(deck.cards)}
            activeOpacity={0.8}
          >
            <Text style={learning.length > 0 ? styles.secondaryText : styles.primaryText}>Start the whole deck again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondary} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.secondaryText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const frontRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.body}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(index / cards.length) * 100}%` }]} />
        </View>
        <Text style={styles.counter}>Card {index + 1} of {cards.length}</Text>

        <Pressable style={styles.cardArea} onPress={toggle}>
          <Animated.View style={[styles.card, { transform: [{ perspective: 1000 }, { rotateY: frontRotate }] }]}>
            <Text style={styles.side}>Prompt</Text>
            <Text style={styles.front}>{card.front}</Text>
            <Text style={styles.tapHint}>Tap to flip</Text>
          </Animated.View>
          <Animated.View style={[styles.card, styles.cardBack, { transform: [{ perspective: 1000 }, { rotateY: backRotate }] }]}>
            <Text style={[styles.side, { color: '#8E8E93' }]}>Answer</Text>
            <Text style={styles.back}>{card.back}</Text>
            <Text style={[styles.tapHint, { color: '#8E8E93' }]}>Tap to flip back</Text>
          </Animated.View>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.action, styles.learningBtn]} onPress={() => answer(false)} activeOpacity={0.8}>
          <Ionicons name="repeat" size={18} color="#C93400" />
          <Text style={[styles.actionText, { color: '#C93400' }]}>Still learning</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.action, styles.knowBtn]} onPress={() => answer(true)} activeOpacity={0.8}>
          <Ionicons name="checkmark" size={18} color="#1E7B34" />
          <Text style={[styles.actionText, { color: '#1E7B34' }]}>Got it</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFEFEF' },
  body: { flex: 1, padding: 16 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: '#DCDCE0', overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: '#1C1C1E' },
  counter: { fontSize: 12, fontWeight: '700', color: '#AEAEB2', marginTop: 14, marginBottom: 14 },
  cardArea: { flex: 1, maxHeight: 460 },
  card: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 4,
  },
  cardBack: { backgroundColor: '#1C1C1E' },
  side: { position: 'absolute', top: 20, left: 24, fontSize: 11, fontWeight: '700', color: '#AEAEB2', textTransform: 'uppercase', letterSpacing: 1 },
  front: { fontSize: 24, fontWeight: '700', color: '#1C1C1E', textAlign: 'center', lineHeight: 32 },
  back: { fontSize: 19, fontWeight: '500', color: '#FFFFFF', textAlign: 'center', lineHeight: 27 },
  tapHint: { position: 'absolute', bottom: 20, fontSize: 12, color: '#AEAEB2', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, padding: 16 },
  action: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingVertical: 16 },
  learningBtn: { backgroundColor: '#FFE9DF' },
  knowBtn: { backgroundColor: '#DDF5E3' },
  actionText: { fontSize: 15, fontWeight: '700' },
  primary: {
    flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1C1C1E', borderRadius: 16, paddingVertical: 16, alignSelf: 'stretch', marginTop: 8,
  },
  primaryText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  secondary: { paddingVertical: 14, alignSelf: 'stretch', alignItems: 'center', marginTop: 4 },
  secondaryText: { color: '#1C1C1E', fontSize: 15, fontWeight: '600' },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  doneTitle: { fontSize: 24, fontWeight: '800', color: '#1C1C1E', marginTop: 16, textAlign: 'center' },
  doneSub: { fontSize: 15, color: '#6C6C70', marginTop: 6, marginBottom: 24, textAlign: 'center' },
});
