import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  Alert, 
  TouchableOpacity 
} from 'react-native';
import { api } from '../../src/lib/api';
import { useBookingStore } from '../../src/store/bookingStore';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, MapPin, XCircle, CheckCircle2, MessageSquare } from 'lucide-react-native';
import { useRouter } from 'expo-router';

// Design System & Components
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { PremiumButton } from '../../src/components/PremiumButton';
import { BookingCardSkeleton } from '../../src/components/Shimmers';
import { EmptyState } from '../../src/components/EmptyState';
import { FadeInImage } from '../../src/components/FadeInImage';
import * as Haptics from 'expo-haptics';
import { useTranslation } from "react-i18next";

type BookingStatusSegment = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export default function BookingsScreen() {
    const { t } = useTranslation();
  const { bookings, setBookings } = useBookingStore();
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [activeSegment, setActiveSegment] = useState<BookingStatusSegment>('PENDING');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings();
  }, []);

  const updateBookingStatus = async (bookingId: string, newStatus: string, originalStatus: string) => {
    try {
      setUpdatingId(bookingId);
      useBookingStore.getState().updateBookingStatusOptimistic(bookingId, newStatus);
      await api.put(`/bookings/${bookingId}/status`, { status: newStatus });
      setUpdatingId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchBookings();
    } catch (error: any) {
      useBookingStore.getState().updateBookingStatusOptimistic(bookingId, originalStatus);
      setUpdatingId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Update Failed', error.response?.data?.error || 'Failed to sync status.');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING': return { color: '#F59E0B', label: 'Processing' };
      case 'ACCEPTED': return { color: theme.primary, label: 'Confirmed' };
      case 'ACTIVE': return { color: theme.primary, label: 'In Progress' };
      case 'REJECTED': return { color: theme.error, label: 'Declined' };
      case 'COMPLETED': return { color: theme.textMuted, label: 'Completed' };
      case 'CANCELLED': return { color: theme.error, label: 'Cancelled' };
      default: return { color: theme.textSecondary, label: status };
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (activeSegment === 'PENDING') return b.status === 'PENDING' || b.status === 'ACCEPTED';
      if (activeSegment === 'ACTIVE') return b.status === 'ACTIVE';
      if (activeSegment === 'COMPLETED') return b.status === 'COMPLETED';
      if (activeSegment === 'CANCELLED') return b.status === 'REJECTED' || b.status === 'CANCELLED';
      return false;
    });
  }, [bookings, activeSegment]);

  const renderItem = ({ item }: { item: any }) => {
    const statusConfig = getStatusConfig(item.status);
    const otherParty = user?.role === 'OWNER' ? item.farmer : item.owner;

    return (
      <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
        <View style={styles.cardTop}>
          <FadeInImage uri={item.equipment?.imageUrl} style={styles.thumb} />
          <View style={styles.headerInfo}>
            <Text style={[typography.title, { color: theme.text }]} numberOfLines={1}>
              {item.equipment?.name}
            </Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
              <Text style={[typography.caption, { color: theme.textSecondary, fontWeight: '700' }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
          <Text style={[typography.title, { color: theme.text }]}>₹{item.totalPrice}</Text>
        </View>

        <View style={[styles.timelineBox, { backgroundColor: theme.surface }]}>
          <View style={styles.timeItem}>
            <Calendar size={14} color={theme.textMuted} />
            <Text style={[typography.caption, { color: theme.textSecondary, marginLeft: 8 }]}>
              {new Date(item.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} — {new Date(item.endDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            </Text>
          </View>
          <View style={styles.timeItem}>
            <MapPin size={14} color={theme.textMuted} />
            <Text style={[typography.caption, { color: theme.textSecondary, marginLeft: 8 }]} numberOfLines={1}>
              {item.equipment?.location || 'Nashik'}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.personRow}>
            <View style={[styles.avatar, { backgroundColor: theme.primary + '10' }]}>
              <Text style={[styles.avatarText, { color: theme.primary }]}>{otherParty?.name?.charAt(0)}</Text>
            </View>
            <Text style={[typography.bodySmall, { color: theme.text, fontWeight: '700', marginLeft: 10 }]}>
              {otherParty?.name}
            </Text>
          </View>
          
          <View style={styles.actions}>
            {user?.role === 'OWNER' && item.status === 'PENDING' ? (
              <View style={styles.buttonGroup}>
                <TouchableOpacity 
                  style={[styles.miniBtn, { backgroundColor: theme.error + '10' }]}
                  onPress={() => updateBookingStatus(item.id, 'REJECTED', item.status)}
                >
                  <XCircle size={18} color={theme.error} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.miniBtn, { backgroundColor: theme.primary + '10' }]}
                  onPress={() => updateBookingStatus(item.id, 'ACCEPTED', item.status)}
                >
                  <CheckCircle2 size={18} color={theme.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.buttonGroup}>
                {/* Contact Owner Button */}
                <TouchableOpacity 
                  style={[styles.contactBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: '/chat/[id]', params: { id: item.id } });
                  }}
                >
                  <MessageSquare size={16} color={theme.primary} />
                  <Text style={[typography.caption, { color: theme.primary, fontWeight: 'bold', marginLeft: 6 }]}>{t('contact')}</Text>
                </TouchableOpacity>

                {user?.role === 'FARMER' && item.status === 'ACCEPTED' && (
                  <PremiumButton 
                    title={t('start')} 
                    onPress={() => updateBookingStatus(item.id, 'ACTIVE', item.status)} 
                    size="small"
                    loading={updatingId === item.id}
                  />
                )}

                {user?.role === 'FARMER' && item.status === 'ACTIVE' && (
                  <PremiumButton 
                    title={t('return')} 
                    onPress={() => updateBookingStatus(item.id, 'COMPLETED', item.status)} 
                    size="small"
                    variant="outline"
                    loading={updatingId === item.id}
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const segments: { id: BookingStatusSegment; label: string }[] = [
    { id: 'PENDING', label: 'Pending' },
    { id: 'ACTIVE', label: 'Active' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[typography.h1, { color: theme.text }]}>{t('bookings')}</Text>
        <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: 4 }]}>
          {t('track_your_equipment_schedule')}</Text>
      </View>

      {/* Segmented Top Tabs */}
      <View style={[styles.segmentContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {segments.map((seg) => (
          <TouchableOpacity
            key={seg.id}
            style={[styles.segmentTab, activeSegment === seg.id && { backgroundColor: theme.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSegment(seg.id);
            }}
          >
            <Text style={[styles.segmentText, { color: activeSegment === seg.id ? '#FFF' : theme.textSecondary }]}>
              {seg.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {loading ? (
        <View style={styles.listContainer}>
          <BookingCardSkeleton />
          <BookingCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={
            <EmptyState 
              icon={<Calendar size={48} color={theme.textMuted} />}
              title={`No ${activeSegment.toLowerCase()} bookings`}
              subtitle="Your equipment schedule will appear here."
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
  header: { paddingHorizontal: 28, paddingTop: 24, marginBottom: 20 },
  segmentContainer: { flexDirection: 'row', marginHorizontal: 28, marginBottom: 24, borderRadius: 16, borderWidth: 1.5, padding: 4, gap: 4 },
  segmentTab: { flex: 1, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 12, fontWeight: '700' },
  listContainer: { paddingHorizontal: 28, paddingBottom: 100 },
  card: { borderRadius: 32, padding: 24, marginBottom: 24, elevation: 4, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  thumb: { width: 44, height: 44, borderRadius: 12 },
  headerInfo: { flex: 1, marginLeft: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  timelineBox: { padding: 16, borderRadius: 20, marginBottom: 20, gap: 12 },
  timeItem: { flexDirection: 'row', alignItems: 'center' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 20 },
  personRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: '800', fontSize: 13 },
  actions: {},
  buttonGroup: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  miniBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  contactBtn: { flexDirection: 'row', alignItems: 'center', height: 38, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1.5 },
});
