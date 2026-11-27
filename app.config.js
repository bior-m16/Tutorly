module.exports = {
  expo: {
    name: 'Tutorly',
    slug: 'tutorly',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#EFEFEF',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.tutorly.app',
      infoPlist: {
        NSCameraUsageDescription: 'Tutorly needs camera access to scan your homework problems',
        NSPhotoLibraryUsageDescription: 'Tutorly needs photo library access to upload homework images',
        NSMicrophoneUsageDescription: 'Tutorly uses the microphone so you can talk to your tutor',
        // Keeps a live tutor call going if the screen locks.
        UIBackgroundModes: ['audio'],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1C1C1E',
      },
      permissions: [
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'com.android.vending.BILLING',
        'android.permission.RECORD_AUDIO',
        'android.permission.MODIFY_AUDIO_SETTINGS',
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.BLUETOOTH',
      ],
      package: 'com.tutorly.app',
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      ['expo-camera', { cameraPermission: 'Tutorly needs camera access to scan your homework' }],
      ['expo-image-picker', { photosPermission: 'Tutorly needs photo access to upload homework images' }],
      [
        'expo-speech-recognition',
        {
          microphonePermission: 'Tutorly uses the microphone so you can talk to your tutor',
          speechRecognitionPermission: 'Tutorly turns your speech into text so your tutor can answer',
        },
      ],
      // Live voice tutor (ElevenLabs over WebRTC).
      '@livekit/react-native-expo-plugin',
      '@config-plugins/react-native-webrtc',
    ],
    extra: {
      // Public by design: the backend holds the Anthropic key and checks each user's session.
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://qemztgyclxbnamlgbppg.supabase.co',
      supabaseKey:
        process.env.EXPO_PUBLIC_SUPABASE_KEY ?? 'sb_publishable_ZvAqMLEyBQGT_fK0Ir8lEg_6lsMXfm_',
      // RevenueCat public SDK keys (safe to ship). Leave empty to hide purchases.
      revenuecatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
      revenuecatAndroidKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
      eas: { projectId: process.env.EAS_PROJECT_ID ?? '' },
    },
  },
};
