import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// The live tutor's glowing orb: a slowly swirling blue, indigo, purple and pink sphere.
// It swirls faster and pulses while the tutor speaks, and dims before the call connects.

const COLORS = ['#1E3BFF', '#3D6BFF', '#4B3BD6', '#7A5CFF', '#2F4BFF'] as const;

interface Props {
  size?: number;
  active: boolean;
  speaking: boolean;
}

const blur = (px: number) => (Platform.OS === 'web' ? ({ filter: `blur(${px}px)` } as object) : {});

export default function VoiceOrb({ size = 150, active, speaking }: Props) {
  const spin = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  // Continuous swirl. Restarting at the current angle keeps the speed change smooth.
  useEffect(() => {
    let stopped = false;
    const run = () => {
      spin.setValue(0);
      Animated.timing(spin, {
        toValue: 1,
        duration: speaking ? 3500 : 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => finished && !stopped && run());
    };
    run();
    return () => {
      stopped = true;
      spin.stopAnimation();
    };
  }, [speaking, spin]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);

  useEffect(() => {
    if (!speaking) {
      Animated.timing(pulse, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [speaking, pulse]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const counter = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [active ? 0.45 : 0.15, 0.8] });
  const dx = drift.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.12, size * 0.12] });
  const dy = drift.interpolate({ inputRange: [0, 1], outputRange: [size * 0.1, -size * 0.08] });

  const big = size * 1.6;
  const r = size / 2;

  return (
    <View style={{ width: size * 1.7, height: size * 1.7, alignItems: 'center', justifyContent: 'center' }}>
      {/* Glow behind the sphere: layered soft discs (blurred on web). */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          styles.center,
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
      >
        <View style={[styles.disc, { width: size * 1.45, height: size * 1.45, borderRadius: size, backgroundColor: 'rgba(122,92,255,0.25)' }, blur(28)]} />
        <View style={[styles.disc, { width: size * 1.22, height: size * 1.22, borderRadius: size, backgroundColor: 'rgba(194,107,255,0.3)' }, blur(18)]} />
      </Animated.View>

      <Animated.View
        style={[
          { width: size, height: size, borderRadius: r, overflow: 'hidden', opacity: active ? 1 : 0.55, transform: [{ scale }] },
          Platform.OS === 'ios' ? { shadowColor: '#7A5CFF', shadowOpacity: 0.8, shadowRadius: 30, shadowOffset: { width: 0, height: 0 } } : null,
        ]}
      >
        {/* Swirling base colours. */}
        <Animated.View style={{ position: 'absolute', left: (size - big) / 2, top: (size - big) / 2, width: big, height: big, transform: [{ rotate }] }}>
          <LinearGradient colors={[...COLORS]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
        </Animated.View>
        {/* A pink cloud drifting the other way. */}
        <Animated.View
          style={[
            { position: 'absolute', left: size * 0.38, top: size * 0.4, width: size * 0.75, height: size * 0.75, borderRadius: size, opacity: 0.85 },
            { transform: [{ translateX: dx }, { translateY: dy }, { rotate: counter }] },
            blur(14),
          ]}
        >
          <LinearGradient
            colors={['rgba(255,110,199,0)', 'rgba(255,110,199,0.95)', 'rgba(194,107,255,0.5)', 'rgba(194,107,255,0)']}
            start={{ x: 0.2, y: 0.2 }}
            end={{ x: 0.9, y: 0.9 }}
            style={{ flex: 1, borderRadius: size }}
          />
        </Animated.View>
        {/* A pale sky-blue cloud near the top-right. */}
        <Animated.View
          style={[
            { position: 'absolute', left: size * 0.35, top: -size * 0.15, width: size * 0.75, height: size * 0.75, borderRadius: size, opacity: 0.7 },
            { transform: [{ translateX: dy }, { translateY: dx }] },
            blur(12),
          ]}
        >
          <LinearGradient
            colors={['rgba(143,216,255,0)', 'rgba(143,216,255,0.9)', 'rgba(143,216,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1, borderRadius: size }}
          />
        </Animated.View>
        {/* An indigo shadow at the bottom-left gives the sphere depth. */}
        <LinearGradient
          colors={['rgba(30,20,120,0)', 'rgba(30,20,120,0.45)']}
          start={{ x: 0.7, y: 0.2 }}
          end={{ x: 0.1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Soft highlight at the top-left. */}
        <LinearGradient
          colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
          start={{ x: 0.15, y: 0.05 }}
          end={{ x: 0.55, y: 0.55 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  disc: { position: 'absolute' },
});
