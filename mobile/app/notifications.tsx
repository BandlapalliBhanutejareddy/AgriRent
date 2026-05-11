import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, SectionList } from 'react-native';
import { api } from '../src/lib/api';
import { useThemeStore } from '../src/store/themeStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, ArrowLeft, CheckCircle2, Calendar, CreditCard, MessageSquare, AlertTriangle, ChevronRight } from 'lucide-react-native';

// Design System & Components
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';
import { EmptyState } from '../src/components/EmptyState';
import { ShimmerLine } from '../src/components/Shimmers';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { theme, isDarkMode } = useThemeStore();
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.log('Failed to mark notification as read');
    }
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
  };

  const getIcon = (type: string) => {
    const props = { size: 18, color: theme.primary };
    if (type.includes('BOOKING')) return <Calendar {...props} />;
    if (type.includes('PAYMENT')) return <CreditCard {...props} />;
    if (type.includes('CHAT')) return <MessageSquare {...props} />;
    return <Bell {...props} />;
  };

  const sections = useMemo(() => {
    const today: any[] = [];
    const earlier: any[] = [];
    const now = new Date();
    
    notifications.forEach(n => {
        const date = new Date(n.createdAt);
        if (now.toDateString() === date.toDateString()) {
            today.push(n);
        } else {
            earlier.push(n);
        }
    });

    const result = [];
    if (today.length > 0) result.push({ title: 'Today', data: today });
    if (earlier.length > 0) result.push({ title: 'Earlier', data: earlier });
    return result;
  }, [notifications]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor: item.isRead ? theme.card + '50' : theme.card, 
          borderColor: theme.border,
          shadowColor: theme.shadow,
        }
      ]}
      activeOpacity={0.7}
      onPress={() => {
        if (!item.isRead) markAsRead(item.id);
        if (item.type.includes('BOOKING')) router.push('/(tabs)/bookings');
        if (item.type.includes('CHAT')) router.push({ pathname: '/chat/[id]', params: { id: item.relatedId } });
      }}
    >
      <View style={styles.iconContainer}>
          <View style={[styles.iconBg, { backgroundColor: item.isRead ? theme.border : theme.primary + '15' }]}>
            {getIcon(item.type)}
          </View>
          {!item.isRead && <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]} />}
      </View>
      
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[typography.title, { color: theme.text, fontWeight: item.isRead ? '600' : '800' }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[typography.caption, { color: theme.textMuted }]}>
            {getRelativeTime(item.createdAt)}
          </Text>
        </View>
        <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: 2 }]} numberOfLines={2}>
          {item.message}
        </Text>
      </View>
      <ChevronRight size={16} color={theme.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ArrowLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[typography.h2, { color: theme.text }]}>Notifications</Text>
        <TouchableOpacity>
            <Text style={[typography.label, { color: theme.primary }]}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.listContainer}>
          <ShimmerLine style={{ width: '100%', height: 80, borderRadius: 16, marginBottom: 12 }} />
          <ShimmerLine style={{ width: '100%', height: 80, borderRadius: 16, marginBottom: 12 }} />
          <ShimmerLine style={{ width: '100%', height: 80, borderRadius: 16, marginBottom: 12 }} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={[styles.sectionTitle, { color: theme.textMuted, backgroundColor: theme.background }]}>{title.toUpperCase()}</Text>
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={
            <EmptyState 
              icon={<Bell size={48} color={theme.textMuted} />}
              title="All caught up!"
              subtitle="You don't have any notifications at the moment."
              buttonTitle="Explore Marketplace"
              onButtonPress={() => router.push('/(tabs)')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.screenHorizontal, paddingTop: spacing.md, marginBottom: spacing.lg },
  backBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  listContainer: { paddingHorizontal: spacing.screenHorizontal, paddingBottom: spacing.bottomSafe },
  sectionTitle: { paddingVertical: spacing.md, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: spacing.md, 
    borderRadius: 20, 
    marginBottom: spacing.sm, 
    borderWidth: 1, 
    elevation: 2, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4 
  },
  iconContainer: { position: 'relative' },
  iconBg: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  unreadBadge: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#FFF' },
  content: { flex: 1, marginLeft: spacing.md, marginRight: spacing.xs },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
