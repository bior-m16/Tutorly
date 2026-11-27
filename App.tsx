import React from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';

// On web, drop the browser's black focus ring on text boxes; the app styles its own fields.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = 'input:focus, textarea:focus { outline: none; }';
  document.head.appendChild(style);
}

export default function App() {
  return (
    <>
      <StatusBar style="dark" backgroundColor="#FFF8F5" />
      <AppNavigator />
    </>
  );
}
