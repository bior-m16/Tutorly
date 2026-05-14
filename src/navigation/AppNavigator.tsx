import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ScanScreen from '../screens/ScanScreen';
import ResultScreen from '../screens/ResultScreen';
import { RootStackParamList, BottomTabParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

const C = {
  bg: '#0B0B0B',
  surface: '#141414',
  border: '#2C2C2E',
  text: '#FFFFFF',
  textMuted: '#48484A',
  active: '#FFFFFF',
};

const NAV_THEME = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: C.bg,
    card: C.surface,
    border: C.border,
    text: C.text,
    primary: C.text,
  },
};

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => {
          const icons: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
            Home: ['home', 'home-outline'],
            History: ['time', 'time-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['home', 'home-outline'];
          return (
            <Ionicons
              name={focused ? active : inactive}
              size={size}
              color={focused ? C.active : C.textMuted}
            />
          );
        },
        tabBarActiveTintColor: C.active,
        tabBarInactiveTintColor: C.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer theme={NAV_THEME}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen
          name="Scan"
          component={ScanScreen}
          options={{ presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{
            headerShown: true,
            title: 'Solution',
            headerBackTitle: 'Back',
            headerStyle: { backgroundColor: C.surface },
            headerTintColor: C.text,
            headerShadowVisible: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingBottom: 4,
    height: 60,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
