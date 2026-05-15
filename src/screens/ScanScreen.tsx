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
// SDK 51: CameraView is a class component; ref type is CameraView
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyzeHomeworkImage } from '../services/claudeService';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const VIEWFINDER = 280;
const CORNER = 26;
const THICK = 3;

export default function ScanScreen() {
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const [analyzing, setAnalyzing] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  // SDK 51: ref holds the CameraView class instance (has takePictureAsync)
  const cameraRef = useRef<CameraView>(null);

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
      // SDK 51: use takePictureAsync on the class instance
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
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

  // Web: gallery only (camera not supported in browser)
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <TouchableOpacity style={styles.webClose} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#1C1C1E" />
        </TouchableOpacity>

        <View style={styles.webBracketBox}>
          <View style={[styles.wCorner, styles.wTL]} />
          <View style={[styles.wCorner, styles.wTR]} />
          <View style={[styles.wCorner, styles.wBL]} />
          <View style={[styles.wCorner, styles.wBR]} />
          <View style={styles.webIconCircle}>
            <Ionicons name="camera-outline" size={40} color="#1C1C1E" />
          </View>
        </View>

        <Text style={styles.webTitle}>Upload Problem</Text>
        <Text style={styles.webSub}>Camera scanning available on mobile</Text>

        <TouchableOpacity style={styles.webBtn} onPress={handlePickFromGallery} activeOpacity={0.7}>
          <Ionicons name="images-outline" size={20} color="#6C6C70" />
          <Text style={styles.webBtnText}>Choose from Gallery</Text>
        </TouchableOpacity>

        {analyzing && (
          <View style={styles.webAnalyzing}>
            <ActivityIndicator size="large" color="#1C1C1E" />
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
        <View style={styles.permIconBox}>
          <Ionicons name="camera-outline" size={38} color="#1C1C1E" />
        </View>
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permText}>
          Tutorly needs camera access to scan homework problems
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission} activeOpacity={0.7}>
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

      {/* Scrim overlay with transparent viewfinder cutout */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayRow}>
          <View style={styles.overlaySide} />
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cTL]} />
            <View style={[styles.corner, styles.cTR]} />
            <View style={[styles.corner, styles.cBL]} />
            <View style={[styles.corner, styles.cBR]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* Top bar */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.topLabel}>Tutorly</Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      {/* Hint below viewfinder */}
      <View style={styles.hintRow}>
        <Text style={styles.hintText}>Align your homework in the frame</Text>
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.sideBtn} onPress={handlePickFromGallery}>
          <Ionicons name="images-outline" size={26} color="#FFF" />
          <Text style={styles.sideBtnLabel}>Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.captureBtn}
          onPress={handleCapture}
          disabled={analyzing}
          activeOpacity={0.8}
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
            <Image
              source={{ uri: capturedUri }}
              style={styles.capturedPreview}
              resizeMode="cover"
            />
          )}
          <View style={styles.analyzingCard}>
            <ActivityIndicator size="large" color="#1C1C1E" />
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

  // ── Web ──────────────────────────────────────────────────────────────
  webContainer: {
    flex: 1,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  webClose: { position: 'absolute', top: 56, left: 20 },
  webBracketBox: {
    width: 160,
    height: 160,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wCorner: { position: 'absolute', width: 26, height: 26, borderColor: '#AEAEB2' },
  wTL: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  wTR: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  wBL: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  wBR: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  webIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  webTitle: { fontSize: 22, fontWeight: '700', color: '#1C1C1E', marginBottom: 8 },
  webSub: {
    fontSize: 13,
    color: '#6C6C70',
    textAlign: 'center',
    marginBottom: 32,
  },
  webBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 28,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  webBtnText: { fontSize: 15, fontWeight: '600', color: '#6C6C70' },
  webAnalyzing: { marginTop: 32, alignItems: 'center', gap: 12 },
  webAnalyzingText: { fontSize: 14, color: '#6C6C70' },

  // ── Permission ────────────────────────────────────────────────────────
  permContainer: {
    flex: 1,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  permIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 8,
  },
  permTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  permText: { fontSize: 14, color: '#6C6C70', textAlign: 'center', lineHeight: 21 },
  permBtn: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 8,
  },
  permBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  permGallery: { color: '#6C6C70', fontSize: 14, fontWeight: '600' },

  // ── Camera overlay ────────────────────────────────────────────────────
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  overlayRow: { flexDirection: 'row', height: VIEWFINDER },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  overlayBottom: { flex: 1.4, backgroundColor: 'rgba(0,0,0,0.55)' },
  viewfinder: { width: VIEWFINDER, height: VIEWFINDER },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#FFFFFF' },
  cTL: { top: 0, left: 0, borderTopWidth: THICK, borderLeftWidth: THICK, borderTopLeftRadius: 3 },
  cTR: { top: 0, right: 0, borderTopWidth: THICK, borderRightWidth: THICK, borderTopRightRadius: 3 },
  cBL: { bottom: 0, left: 0, borderBottomWidth: THICK, borderLeftWidth: THICK, borderBottomLeftRadius: 3 },
  cBR: { bottom: 0, right: 0, borderBottomWidth: THICK, borderRightWidth: THICK, borderBottomRightRadius: 3 },

  // ── Top bar ───────────────────────────────────────────────────────────
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLabel: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // ── Hint ──────────────────────────────────────────────────────────────
  hintRow: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    marginTop: VIEWFINDER / 2 + 16,
    alignItems: 'center',
  },
  hintText: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '500' },

  // ── Bottom controls ───────────────────────────────────────────────────
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
  sideBtnLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600' },
  captureBtn: { alignItems: 'center', justifyContent: 'center' },
  captureRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureDot: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF' },

  // ── Analyzing overlay ─────────────────────────────────────────────────
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
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
    borderColor: 'rgba(255,255,255,0.1)',
  },
  analyzingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  analyzingTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  analyzingText: { fontSize: 13, color: '#6C6C70' },
});
