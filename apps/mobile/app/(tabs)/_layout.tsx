import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ACTIVE_COLOR = '#D4880F'; // primary-500
const INACTIVE_COLOR = '#6B7280'; // typography-500

type TabIconProps = {
  color: string;
  size: number;
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          minHeight: 56,
          paddingBottom: 4,
        },
        tabBarItemStyle: {
          minHeight: 48,
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: 'Home tab',
        }}
      />
      <Tabs.Screen
        name="apiaries"
        options={{
          title: 'Apiaries',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: 'Apiaries tab',
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: 'Plan tab',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: 'Settings tab',
        }}
      />
    </Tabs>
  );
}
