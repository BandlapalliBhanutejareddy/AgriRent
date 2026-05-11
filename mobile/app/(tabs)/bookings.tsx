import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { api } from '../../src/lib/api';
import { useBookingStore } from '../../src/store/bookingStore';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, MapPin, XCircle, CheckCircle2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';

// Design System & Components
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { PremiumButton } from '../../src/components/PremiumButton';
import { BookingCardSkeleton } from '../../src/components/Shimmers';
import { EmptyState } from '../../src/components/EmptyState';
import { FadeInImage } from '../../src/components/FadeInImage';

export default function BookingsScreen() {
  const { bookings, setBookings } = useBookingStore();
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const router = useRouter();
  
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
    } catch (error: any) {
      useBookingStore.getState().updateBookingStatusOptimistic(bookingId, originalStatus);
      setUpdatingId(null);
      Alert.alert('Update Failed', error.response?.data?.error || 'Failed to sync status.');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PENDING': return { color: '#F59E0B', label: 'Processing' };
      case 'ACCEPTED': return { color: theme.primary, label: 'Confirmed' };
      case 'ACTIVE': return { color: theme.primary, label: 'In Progress' };
      case 'REJECTED': return { color: theme.error, label: 'Declined' };
      case 'COMPLETED': return { color: theme.textMuted, label: 'Finished' };
      default: return { color: theme.textSecondary, label: status };
    }
  };

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
                <Text style={[typography.bodySmall, { color: theme.text, fontWeight: '700', marginLeft: 10 }]}>{otherParty?.name}</Text>
            </View>
            
            <View style={styles.actions}>
                {user?.role === 'OWNER' && item.status === 'PENDING' && (
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
                )}
                
                {user?.role === 'FARMER' && item.status === 'ACCEPTED' && (
                    <PremiumButton 
                        title="Start" 
                        onPress={() => updateBookingStatus(item.id, 'ACTIVE', item.status)} 
                        size="small"
                        loading={updatingId === item.id}
                    />
                )}

                {user?.role === 'FARMER' && item.status === 'ACTIVE' && (
                    <PremiumButton 
                        title="Return" 
                        onPress={() => updateBookingStatus(item.id, 'COMPLETED', item.status)} 
                        size="small"
                        variant="outline"
                        loading={updatingId === item.id}
                    />
                )}
            </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[typography.h1, { color: theme.text }]}>Bookings</Text>
        <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: 4 }]}>
            Track your equipment schedule
        </Text>
      </View>
      
      {loading ? (
        <View style={styles.listContainer}>
          <BookingCardSkeleton />
          <BookingCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={
            <EmptyState 
              icon={<Calendar size={48} color={theme.textMuted} />}
              title="No bookings"
              subtitle="Your equipment rentals will appear here."
              buttonTitle="Go to Marketplace"
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
  header: { paddingHorizontal: 28, paddingTop: 24, marginBottom: 48 },
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
  buttonGroup: { flexDirection: 'row', gap: 12 },
  miniBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});
