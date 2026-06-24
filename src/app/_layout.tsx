import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#000',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#fff' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Sign In', headerBackTitle: '' }} />
        <Stack.Screen name="signup" options={{ title: 'Create Account', headerBackTitle: '' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="create-campaign"
          options={{ title: 'New Campaign', headerBackTitle: '' }}
        />
        <Stack.Screen
          name="campaign-detail"
          options={{ title: 'Campaign', headerBackTitle: '' }}
        />
        <Stack.Screen
          name="chat"
          options={{ title: 'Chat', headerBackTitle: '' }}
        />
      </Stack>
    </>
  );
}
