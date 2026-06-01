import React from 'react';
import { Tabs } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function getIconName(name: string, focused: boolean): any {
  const noOutline = ['logo-bitcoin'];
  if (noOutline.includes(name)) return name;
  return focused ? name : `${name}-outline`;
}

function TabIcon({
  name,
  focused,
  label,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  label: string;
}) {
  return (
    <View style={[styles.tabItem, focused && styles.activeTabItem]}>
      <Ionicons
        name={getIconName(name, focused)}
        size={21}
        color={focused ? '#D7FF64' : '#7B8190'}
      />
      <Text
        style={[styles.tabLabel, focused && styles.activeLabel]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export default function AppLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 50 + insets.bottom,
          paddingTop: 4,
          paddingBottom: insets.bottom + 4,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#0B0F1A',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.04)',
          elevation: 0,
          shadowOpacity: 0,
          position: 'absolute',
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={styles.androidBackground} />
          ),
      }}
    >
      {/* ── Visible tabs ──────────────────────────────────────────────── */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} label="Home" />
          ),
        }}
      />

      <Tabs.Screen
        name="crypto"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="logo-bitcoin" focused={focused} label="Markets" />
          ),
        }}
      />

      <Tabs.Screen
        name="cards"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="card" focused={focused} label="Cards" />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" focused={focused} label="Profile" />
          ),
        }}
      />

      {/* ── Hidden top-level screens ───────────────────────────────────── */}
      <Tabs.Screen name="analytics"          options={{ href: null }} />
      <Tabs.Screen name="rewards"            options={{ href: null }} />
      <Tabs.Screen name="convert"            options={{ href: null }} />
      <Tabs.Screen name="send"               options={{ href: null }} />
      <Tabs.Screen name="top-up"             options={{ href: null }} />
      <Tabs.Screen name="transactions"       options={{ href: null }} />
      <Tabs.Screen name="transaction"        options={{ href: null }} />
      <Tabs.Screen name="one-time-account"   options={{ href: null }} />

      {/* ── Folder groups — their sub-screens are managed by nested Stacks ── */}
      <Tabs.Screen name="bills"  options={{ href: null }} />
      <Tabs.Screen name="kyc"    options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  androidBackground: {
    flex: 1,
    backgroundColor: '#0B0F1A',
  },
  tabItem: {
    minWidth: 68,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  activeTabItem: {
    backgroundColor: 'rgba(215,255,100,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(215,255,100,0.14)',
  },
  tabLabel: {
    marginTop: 2,
    fontSize: 10,
    color: '#7B8190',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  activeLabel: {
    color: '#FFFFFF',
  },
});
