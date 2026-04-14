// app/(app)/_layout.tsx
// 4 tabs: Home, Crypto, Cards, Profile
// Transactions live inside Home — no wasted tab

import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, spacing, layout } from '@/theme';

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  label: string;
  color: string;
};

function TabIcon({ name, focused, label, color }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      <Ionicons
        name={focused ? name : `${name}-outline` as any}
        size={22}
        color={color}
      />
      <Text style={[styles.tabLabel, { color, fontWeight: focused ? '600' : '400' }]}>
        {label}
      </Text>
    </View>
  );
}

export default function AppLayout() {
  const { theme } = useTheme();
  const insets    = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor:  theme.tabBar.bg,
          borderTopColor:   theme.border.DEFAULT,
          borderTopWidth:   0.5,
          height:           layout.tabBarHeight + insets.bottom,
          paddingBottom:    insets.bottom,
          paddingTop:       spacing[2],
        },
        tabBarActiveTintColor:   theme.tabBar.active,
        tabBarInactiveTintColor: theme.tabBar.inactive,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="home" focused={focused} label="Home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="crypto"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="logo-bitcoin" focused={focused} label="Crypto" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="card" focused={focused} label="Cards" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="person" focused={focused} label="Profile" color={color} />
          ),
        }}
      />
      {/* transactions.tsx exists as a route but hidden from tab bar */}
      <Tabs.Screen name="transactions" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem:  { alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabLabel: { letterSpacing: 0.2, fontSize: 10 },
});