import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Soft neon light behind a screen's top area: a blue glow top-left and a pink one top-right.
const blur = (px: number) => (Platform.OS === 'web' ? ({ filter: `blur(${px}px)` } as object) : {});

export default function GlowBackdrop({ height = 360 }: { height?: number }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { height, overflow: 'hidden' }]}>
      <LinearGradient
        colors={['rgba(61,107,255,0.22)', 'rgba(61,107,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.8 }}
        style={[styles.blob, { left: -80, top: -90, width: 320, height: 300 }, blur(30)]}
      />
      <LinearGradient
        colors={['rgba(255,93,177,0.24)', 'rgba(155,92,255,0.10)', 'rgba(255,93,177,0)']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.9 }}
        style={[styles.blob, { right: -90, top: -60, width: 340, height: 320 }, blur(34)]}
      />
      <LinearGradient
        colors={['rgba(255,179,138,0.18)', 'rgba(255,179,138,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.blob, { left: '25%', top: 120, width: 260, height: 200 }, blur(40)]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: { position: 'absolute', borderRadius: 200 },
});
