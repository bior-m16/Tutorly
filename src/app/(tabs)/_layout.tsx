import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type TabBarProps = {
  state: any;
  descriptors: any;
  navigation: any;
};

function PillTabBar({ state, descriptors, navigation }: TabBarProps) {
  return (
    <View style={styles.barWrapper}>
      <View style={styles.pill}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;
          const isFocused = state.index === index;

          function onPress() {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
              style={[styles.tab, isFocused && styles.activeTab]}
            >
              <Text style={[styles.tabText, isFocused && styles.activeTabText]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <PillTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#000',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarLabel: 'Home' }} />
      <Tabs.Screen name="applications" options={{ title: 'Applications', tabBarLabel: 'Applications' }} />
      <Tabs.Screen name="inbox" options={{ title: 'Inbox', tabBarLabel: 'Inbox' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barWrapper: {
    backgroundColor: '#fff',
    paddingBottom: 28,
    paddingTop: 8,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: '#000',
    borderRadius: 100,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 100,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  activeTabText: {
    color: '#000',
  },
});
