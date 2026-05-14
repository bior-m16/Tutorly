import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { CameraView, CameraViewRef, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyzeHomeworkImage } from '../services/claudeService';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const C = {
  bg: '#0B0B0B',
  surface: '#1A1A1A',
  border: '#2C2C2E',
  text: '#FFFFFF',
  textMuted: '#8E8E93',
  overlay: 'rgba(0,0,0,0.72)',
};

const VIEWFINDER = 280;
const CORNER = 26;
const THICK = 3;

export default function ScanScreen() {
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const [analyzing, setAnalyzing] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraViewRef>(null);

  const processImage = useCallback(
    async (uri: string) => {
      setAnalyzing(true);
      try {
        const result = await analyzeHomeworkImage(uri);
        navigation.replace('Result', { result });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to analyze the image. Please try again.';
        Alert.alert('Analysis Failed', message, [
          { text: 'Try Again', onPress: () => setCapturedUri(null) },
          { text: 'Cancel', onPress: () => navigation.goBack() },
        ]);
      } finally {
        setAnalyzing(false);
      }
    },
    [navigation]
  );

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePicture({ quality: 0.85 });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
        await processImage(photo.uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  }, [processImage]);

  const handlePickFromGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow access to your photo library in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      await processImage(result.assets[0].uri);
    }
  }, [processImage]);

  // Web: gallery only
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <TouchableOpacity style={styles.webClose} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color={C.text} />
        </TouchableOpacity>
        <View style={styles.webBrackets}>
          <View style={[styles.wCorner, styles.wTL]} />
          <View style={[styles.wCorner, styles.wTR]} />
          <View style={[styles.wCorner, styles.wBL]} />
          <View style={[styles.wCorner, styles.wBR]} />
        </View>
        <Text style={styles.webTitle}>Upload Problem</Text>
        <Text style={styles.webSub}>Camera scanning available on mobile</Text>
        <TouchableOpacity style={styles.webBtn} onPress={handlePickFromGallery}>
          <Ionicons name="images-outline" size={22} color={C.text} />
          <Text style={styles.webBtnText}>Choose Image</Text>
        </TouchableOpacity>
        {analyzing && (
          <View style={styles.webAnalyzing}>
            <ActivityIndicator size="large" color={C.text} />
            <Text style={styles.webAnalyzingText}>Analyzing with Claude AI…</Text>
          </View>
        )}
      </View>
    );
  }

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permContainer}>
        <View style={styles.permIcon}>
          <Ionicons name="camera-outline" size={40} color={C.text} />
        </View>
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permText}>
          Tutorly needs camera access to scan homework problems
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePickFromGallery} style={{ marginTop: 12 }}>
          <Text style={styles.permGallery}>Or pick from gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {/* Scrim overlay */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayRow}>
          <View style={styles.overlaySide} />
          {/* Viewfinder — transparent cutout with corner brackets */}
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cTL]} />
            <View style={[styles.corner, styles.cTR]} />
            <View style={[styles.corner, styles.cBL]} />
            <View style={[styles.corner, styles.cBR]} />
            <Text style={styles.hint}>Align problem in frame</Text>
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* Top bar */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.topLabel}>Tutorly</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      {/* Bottom controls */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.sideBtn} onPress={handlePickFromGallery}>
          <Ionicons name="images-outline" size={24} color={C.text} />
          <Text style={styles.sideBtnLabel}>Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.captureBtn}
          onPress={handleCapture}
          disabled={analyzing}
          activeOpacity={0.75}
        >
          <View style={styles.captureRing}>
            <View style={styles.captureDot} />
          </View>
        </TouchableOpacity>

        <View style={{ width: 56 }} />
      </View>

      {/* Analyzing overlay */}
      {analyzing && (
        <View style={styles.analyzingOverlay}>
          {capturedUri && (
            <Image source={{ uri: capturedUri }} style={styles.capturedPreview} resizeMode="cover" />
          )}
          <View style={styles.analyzingCard}>
            <ActivityIndicator size="large" color={C.text} />
            <Text style={styles.analyzingTitle}>Analyzing…</Text>
            <Text style={styles.analyzingText}>Claude AI is solving your problem</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Web
  webContainer: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  webClose: { position: 'absolute', top: 56, left: 20 },
  webBrackets: {
    width: 160,
    height: 160,
    marginBottom: 32,
    position: 'relative',
  },
  wCorner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: C.text,
  },
  wTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  wTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  wBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  wBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  webTitle: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 8 },
  webSub: { fontSize: 13, color: C.textMuted, textAlign: 'center', marginBottom: 32 },
  webBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  webBtnText: { fontSize: 16, fontWeight: '600', color: C.text },
  webAnalyzing: { marginTop: 32, alignItems: 'center', gap: 12 },
  webAnalyzingText: { fontSize: 15, color: C.textMuted },

  // Permission
  permContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: C.bg,
    gap: 12,
  },
  permIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 8,
  },
  permTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  permText: { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 21 },
  permBtn: {
    backgroundColor: C.text,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 8,
  },
  permBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
  permGallery: { color: C.textMuted, fontSize: 14, fontWeight: '600' },

  // Camera overlay
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: C.overlay },
  overlayRow: { flexDirection: 'row', height: VIEWFINDER },
  overlaySide: { flex: 1, backgroundColor: C.overlay },
  overlayBottom: { flex: 1.4, backgroundColor: C.overlay },
  viewfinder: { width: VIEWFINDER, height: VIEWFINDER },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#FFFFFF',
  },
  cTL: { top: 0, left: 0, borderTopWidth: THICK, borderLeftWidth: THICK, borderTopLeftRadius: 3 },
  cTR: { top: 0, right: 0, borderTopWidth: THICK, borderRightWidth: THICK, borderTopRightRadius: 3 },
  cBL: { bottom: 0, left: 0, borderBottomWidth: THICK, borderLeftWidth: THICK, borderBottomLeftRadius: 3 },
  cBR: { bottom: 0, right: 0, borderBottomWidth: THICK, borderRightWidth: THICK, borderBottomRightRadius: 3 },
  hint: {
    position: 'absolute',
    bottom: -28,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLabel: { color: C.text, fontSize: 16, fontWeight: '700' },

  // Bottom controls
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 36,
    paddingBottom: 52,
    paddingTop: 20,
  },
  sideBtn: { width: 56, alignItems: 'center', gap: 5 },
  sideBtnLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  captureBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureDot: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },

  // Analyzing
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  capturedPreview: {
    width: 180,
    height: 180,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  analyzingCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    gap: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  analyzingTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  analyzingText: { fontSize: 13, color: C.textMuted },
});
