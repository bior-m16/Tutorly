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
        backgroundColor: '#EFEFEF',
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
      // Read at build time from EAS secret or local .env — never shipped as a
      // plain EXPO_PUBLIC_ string so it isn't trivially grep-able in the bundle.
      anthropicApiKey:
        process.env.ANTHROPIC_API_KEY ??
        process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ??
        '',
      eas: { projectId: process.env.EAS_PROJECT_ID ?? '' },
    },
  },
};
