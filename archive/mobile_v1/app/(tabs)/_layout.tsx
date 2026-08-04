import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';

export default function TabLayout() {
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const router = useRouter();
  
  const role = user?.role || 'FARMER';
  
  const isFarmer = role === 'FARMER';
  const isOwner = role === 'OWNER';
  const isAdmin = role === 'ADMIN';

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: isOwner ? '#3B82F6' : isAdmin ? '#8B5CF6' : '#10B981',
          tabBarInactiveTintColor: theme.textMuted,
          tabBarStyle: {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
            height: Platform.OS === 'ios' ? 88 : 68,
            paddingBottom: Platform.OS === 'ios' ? 28 : 12,
            paddingTop: 10,
            elevation: 8,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '900',
            marginTop: 4,
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }
        }}>
        
        {/* COMMON HOME TAB (Redirects internally based on role in home.tsx) */}
        <Tabs.Screen
          name="home"
          options={{
            title: isAdmin ? 'Overview' : 'Home',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name={isAdmin ? "view-dashboard-variant" : "home-variant"} size={26} color={color} />,
          }}
        />

        {/* FARMER TABS */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Marketplace',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="tractor" size={26} color={color} />,
            href: isFarmer ? '/(tabs)/' : null, 
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            title: 'AI Advisor',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="robot-outline" size={26} color={color} />,
            href: isFarmer ? '/(tabs)/ai' : null, 
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: 'My Rentals',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="calendar-check" size={26} color={color} />,
            href: isFarmer ? '/(tabs)/bookings' : null, 
          }}
        />

        {/* OWNER TABS */}
        <Tabs.Screen
          name="owner/dashboard"
          options={{
            title: 'My Fleet',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="garage-variant" size={26} color={color} />,
            href: isOwner ? '/(tabs)/owner/dashboard' : null,
          }}
        />
        <Tabs.Screen
          name="owner/requests"
          options={{
            title: 'Requests',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="bell-ring" size={26} color={color} />,
            href: isOwner ? '/(tabs)/owner/requests' : null,
          }}
        />
        <Tabs.Screen
          name="owner/analytics"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="chart-bar" size={26} color={color} />,
            href: isOwner ? '/(tabs)/owner/analytics' : null,
          }}
        />

        {/* ADMIN TABS */}
        <Tabs.Screen
          name="admin/approvals"
          options={{
            title: 'Approvals',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="check-decagram" size={26} color={color} />,
            href: isAdmin ? '/(tabs)/admin/approvals' : null,
          }}
        />
        <Tabs.Screen
          name="admin/users"
          options={{
            title: 'Users',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account-group" size={26} color={color} />,
            href: isAdmin ? '/(tabs)/admin/users' : null,
          }}
        />
        <Tabs.Screen
          name="admin/alerts"
          options={{
            title: 'Alerts',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="alert-circle-outline" size={26} color={color} />,
            href: isAdmin ? '/(tabs)/admin/alerts' : null,
          }}
        />

        {/* COMMON PROFILE TAB */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account-circle-outline" size={26} color={color} />,
          }}
        />

        {/* HIDE THESE TABS FROM BOTTOM BAR */}
        <Tabs.Screen name="chat" options={{ href: null }} />
        <Tabs.Screen name="guides/index" options={{ href: null }} />
        <Tabs.Screen name="guides/[id]" options={{ href: null }} />

      </Tabs>
    </View>
  );
}
