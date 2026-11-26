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
    ],
    extra: {
      // Public by design: the backend holds the Anthropic key and checks each user's session.
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://qemztgyclxbnamlgbppg.supabase.co',
      supabaseKey:
        process.env.EXPO_PUBLIC_SUPABASE_KEY ?? 'sb_publishable_ZvAqMLEyBQGT_fK0Ir8lEg_6lsMXfm_',
      eas: { projectId: process.env.EAS_PROJECT_ID ?? '' },
    },
  },
};
