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
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyzeHomeworkImage } from '../services/claudeService';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const COLORS = {
  primary: '#6C63FF',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.55)',
  danger: '#FC8181',
};

export default function ScanScreen() {
  const navigation = useNavigation<Nav>();
  const [permission, requestPermission] = useCameraPermissions();
  const [analyzing, setAnalyzing] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
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
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, base64: false });
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

  // Web platform: only gallery
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.webContainer}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.webTitle}>Upload Homework Image</Text>
        <Text style={styles.webSubtitle}>Camera scanning is available on mobile devices</Text>
        <TouchableOpacity style={styles.webGalleryBtn} onPress={handlePickFromGallery}>
          <Ionicons name="images" size={28} color={COLORS.white} />
          <Text style={styles.webGalleryText}>Choose Image</Text>
        </TouchableOpacity>
        {analyzing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.analyzingText}>Analyzing with Claude AI...</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={COLORS.primary} />
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          Tutorly needs your camera to scan homework problems
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryFallback} onPress={handlePickFromGallery}>
          <Text style={styles.galleryFallbackText}>Or pick from gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {/* Dim overlay with viewfinder cutout effect */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayMiddleRow}>
          <View style={styles.overlaySide} />
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* Top controls */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.scanLabel}>Align problem in frame</Text>
        <View style={{ width: 44 }} />
      </SafeAreaView>

      {/* Bottom controls */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={handlePickFromGallery}>
          <Ionicons name="images-outline" size={26} color={COLORS.white} />
          <Text style={styles.btnLabel}>Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.captureBtn}
          onPress={handleCapture}
          disabled={analyzing}
          activeOpacity={0.8}
        >
          <View style={styles.captureInner} />
        </TouchableOpacity>

        <View style={{ width: 64 }} />
      </View>

      {/* Analyzing overlay */}
      {analyzing && (
        <View style={styles.analyzingOverlay}>
          {capturedUri && (
            <Image source={{ uri: capturedUri }} style={styles.capturedPreview} resizeMode="cover" />
          )}
          <View style={styles.analyzingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.analyzingTitle}>Analyzing...</Text>
            <Text style={styles.analyzingSubtext}>Claude AI is solving your problem</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const VIEWFINDER_SIZE = 280;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  webTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 20,
  },
  webSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
    textAlign: 'center',
  },
  webGalleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginTop: 32,
  },
  webGalleryText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#F8F9FE',
    gap: 12,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D3748',
    marginTop: 8,
  },
  permissionText: {
    fontSize: 15,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 12,
  },
  permissionBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  galleryFallback: {
    marginTop: 8,
  },
  galleryFallbackText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'stretch',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  overlayMiddleRow: {
    flexDirection: 'row',
    height: VIEWFINDER_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  overlayBottom: {
    flex: 1.5,
    backgroundColor: COLORS.overlay,
  },
  viewfinder: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: COLORS.white,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 4,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  scanLabel: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: 48,
    paddingTop: 24,
  },
  iconBtn: {
    width: 56,
    alignItems: 'center',
    gap: 4,
  },
  btnLabel: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  capturedPreview: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 24,
  },
  analyzingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  analyzingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D3748',
  },
  analyzingSubtext: {
    fontSize: 14,
    color: '#718096',
  },
  loadingOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  analyzingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
});
