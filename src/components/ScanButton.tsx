import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NEON, glow } from '../theme';

interface Props {
  onPress: () => void;
  size?: number;
}

const CORNER = 18;
const THICK  = 2;
const GAP    = 14;

export default function ScanButton({ onPress, size = 72 }: Props) {
  const outer = size + GAP * 2 + CORNER;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.wrapper}>
      <View style={{ width: outer, height: outer, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
        <View style={[styles.corner, styles.cTL]} />
        <View style={[styles.corner, styles.cTR]} />
        <View style={[styles.corner, styles.cBL]} />
        <View style={[styles.corner, styles.cBR]} />
        <View style={[{ width: size, height: size, borderRadius: size / 2 }, glow('#9B5CFF', 24, 0.45)]}>
          <LinearGradient
            colors={[...NEON]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
          >
            <Ionicons name="camera-outline" size={size * 0.4} color="#FFFFFF" />
          </LinearGradient>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#B9A8FF',
  },
  cTL: { top: 0, left: 0,     borderTopWidth: THICK,    borderLeftWidth: THICK,  borderTopLeftRadius: 3 },
  cTR: { top: 0, right: 0,    borderTopWidth: THICK,    borderRightWidth: THICK, borderTopRightRadius: 3 },
  cBL: { bottom: 0, left: 0,  borderBottomWidth: THICK, borderLeftWidth: THICK,  borderBottomLeftRadius: 3 },
  cBR: { bottom: 0, right: 0, borderBottomWidth: THICK, borderRightWidth: THICK, borderBottomRightRadius: 3 },
});
