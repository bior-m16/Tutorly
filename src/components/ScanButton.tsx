import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
        <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
          <Ionicons name="camera-outline" size={size * 0.4} color="#1C1C1E" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  circle: {
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#AEAEB2',
  },
  cTL: { top: 0, left: 0,     borderTopWidth: THICK,    borderLeftWidth: THICK,  borderTopLeftRadius: 3 },
  cTR: { top: 0, right: 0,    borderTopWidth: THICK,    borderRightWidth: THICK, borderTopRightRadius: 3 },
  cBL: { bottom: 0, left: 0,  borderBottomWidth: THICK, borderLeftWidth: THICK,  borderBottomLeftRadius: 3 },
  cBR: { bottom: 0, right: 0, borderBottomWidth: THICK, borderRightWidth: THICK, borderBottomRightRadius: 3 },
});
