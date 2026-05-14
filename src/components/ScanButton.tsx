import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onPress: () => void;
  size?: number;
}

export default function ScanButton({ onPress, size = 72 }: Props) {
  const outer = size + 28;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.wrapper}>
      {/* Outer bracket ring */}
      <View style={[styles.outerRing, { width: outer, height: outer, borderRadius: outer / 2 }]}>
        {/* Corner bracket indicators at 4 corners */}
        <View style={[styles.bracket, styles.bTL]} />
        <View style={[styles.bracket, styles.bTR]} />
        <View style={[styles.bracket, styles.bBL]} />
        <View style={[styles.bracket, styles.bBR]} />
        {/* Center button */}
        <View style={[styles.btn, { width: size, height: size, borderRadius: size / 2 }]}>
          <Ionicons name="camera" size={size * 0.38} color="#FFFFFF" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const BRACKET = 16;
const THICK = 2.5;

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  outerRing: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
  },
  bracket: {
    position: 'absolute',
    width: BRACKET,
    height: BRACKET,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  bTL: { top: 8, left: 8, borderTopWidth: THICK, borderLeftWidth: THICK },
  bTR: { top: 8, right: 8, borderTopWidth: THICK, borderRightWidth: THICK },
  bBL: { bottom: 8, left: 8, borderBottomWidth: THICK, borderLeftWidth: THICK },
  bBR: { bottom: 8, right: 8, borderBottomWidth: THICK, borderRightWidth: THICK },
  btn: {
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
});
