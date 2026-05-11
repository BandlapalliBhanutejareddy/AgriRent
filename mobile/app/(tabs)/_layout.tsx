import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/authStore';

export default function TabLayout() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const isOwner = user?.role === 'OWNER';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#10B981',
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: t('home'),
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home-variant" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t('marketplace'),
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="tractor" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t('bookings'),
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="calendar-check" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai-advisor"
        options={{
          title: t('advisor'),
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="robot" size={24} color={color} />,
          href: isOwner ? null : '/(tabs)/ai-advisor', // Hide from owners
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="guides/index"
        options={{
          title: t('guides'),
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="book-open-variant" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
