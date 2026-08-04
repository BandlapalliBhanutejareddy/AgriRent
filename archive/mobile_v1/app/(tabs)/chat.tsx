import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  RefreshControl 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MessageSquare, ChevronRight } from 'lucide-react-native';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { typography } from '../../src/theme/typography';
import { api } from '../../src/lib/api';
import { useRouter } from 'expo-router';
import { EmptyState } from '../../src/components/EmptyState';
import { ShimmerLine } from '../../src/components/Shimmers';
import { getSocket } from '../../src/lib/socket';
import { useTranslation } from "react-i18next";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'FARMER' | 'OWNER' | 'ADMIN';
  profileImage?: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  pricePerDay: number;
  imageUrl: string;
  location?: string;
}

export interface Conversation {
  id: string;
  farmerId: string;
  ownerId: string;
  status: 'PENDING' | 'ACCEPTED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  totalPrice: number;
  farmer: UserProfile;
  owner: UserProfile;
  equipment: Equipment;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type?: string;
  relatedId?: string;
  createdAt: string;
}

export default function ChatDashboardScreen() {
    const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    
    // Listen for WebSocket-based presence notifications
    socket.on('online_users_list', (users: string[]) => {
      setOnlineUsers(users);
    });
    
    socket.on('user_connected', (userId: string) => {
      setOnlineUsers(prev => [...new Set([...prev, userId])]);
    });
    
    socket.on('user_disconnected', (userId: string) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });
    
    // Request initial list of online users
    socket.emit('get_online_users');
    
    return () => {
      socket.off('online_users_list');
      socket.off('user_connected');
      socket.off('user_disconnected');
    };
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/bookings');
      const activeChats = response.data.filter((b: any) => b.status !== 'CANCELLED');
      setConversations(activeChats);

      // Fetch real notifications to extract unread counts
      const notifResponse = await api.get('/notifications');
      setNotifications(notifResponse.data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, []);

  const filteredConversations = conversations.filter((item) => {
    const otherPartyName = user?.role === 'OWNER' ? item.farmer?.name : item.owner?.name;
    const equipName = item.equipment?.name;
    const matchString = `${otherPartyName} ${equipName}`.toLowerCase();
    return matchString.includes(searchQuery.toLowerCase());
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Processing';
      case 'ACCEPTED': return 'Confirmed';
      case 'ACTIVE': return 'In Progress';
      case 'COMPLETED': return 'Completed';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#F59E0B';
      case 'ACCEPTED': return theme.primary;
      case 'ACTIVE': return theme.primary;
      case 'COMPLETED': return theme.textMuted;
      default: return theme.textSecondary;
    }
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const otherParty = user?.role === 'OWNER' ? item.farmer : item.owner;
    const statusLabel = getStatusLabel(item.status);
    const statusColor = getStatusColor(item.status);

    // REAL WebSocket Presence check
    const isOnline = onlineUsers.includes(otherParty?.id);
    
    // REAL Database Unread notification check
    const hasUnread = notifications.some(n => n.type === 'CHAT' && !n.read && n.relatedId === item.id);

    return (
      <TouchableOpacity
        style={[styles.chatCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}
        onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
        activeOpacity={0.8}
      >
        <View style={styles.avatarWrapper}>
          <View style={[styles.avatar, { backgroundColor: theme.primary + '12' }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>
              {otherParty?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          {isOnline && (
            <View style={[styles.onlineIndicator, { backgroundColor: '#10B981', borderColor: theme.card }]} />
          )}
        </View>

        <View style={styles.chatDetails}>
          <View style={styles.chatHeader}>
            <Text style={[typography.title, { color: theme.text }]} numberOfLines={1}>
              {otherParty?.name || 'AgroRent User'}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>

          <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 4 }]} numberOfLines={1}>
            {t('equipment')}{item.equipment?.name || 'General Machinery'}
          </Text>

          <View style={styles.footerRow}>
            <Text style={[typography.caption, { color: theme.textMuted }]} numberOfLines={1}>
              {new Date(item.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            </Text>
            
            {hasUnread && (
              <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
            )}
          </View>
        </View>

        <ChevronRight size={18} color={theme.textMuted} style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[typography.h1, { color: theme.text }]}>{t('messages')}</Text>
        <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: 4 }]}>
          {t('chat_with_equipment_partners')}</Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Search size={20} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder={t('search_chat_or_equipment')}
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.listContainer}>
          <ShimmerLine style={{ width: '100%', height: 90, borderRadius: 24, marginBottom: 16 }} />
          <ShimmerLine style={{ width: '100%', height: 90, borderRadius: 24, marginBottom: 16 }} />
          <ShimmerLine style={{ width: '100%', height: 90, borderRadius: 24, marginBottom: 16 }} />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon={<MessageSquare size={48} color={theme.textMuted} />}
              title={t('no_chats_active')}
              subtitle="Send a booking request to start messaging owners."
              buttonTitle="Explore Marketplace"
              onButtonPress={() => router.push('/(tabs)')}
            />
          }
        />
      )}
      
      <View style={{ height: 100 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 28, paddingTop: 24, marginBottom: 28 },
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginHorizontal: 28, 
    paddingHorizontal: 16, 
    height: 54, 
    borderRadius: 20, 
    borderWidth: 1.5, 
    marginBottom: 24, 
    gap: 12 
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600', height: '100%' },
  listContainer: { paddingHorizontal: 28, paddingBottom: 100 },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1.5,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8
  },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800' },
  onlineIndicator: { 
    position: 'absolute', 
    bottom: -2, 
    right: -2, 
    width: 14, 
    height: 14, 
    borderRadius: 7, 
    borderWidth: 2 
  },
  chatDetails: { flex: 1, marginLeft: 16 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
});
