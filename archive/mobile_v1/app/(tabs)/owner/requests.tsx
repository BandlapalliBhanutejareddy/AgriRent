import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckCircle2, XCircle, Clock, Calendar, Package,
  User, ChevronRight, AlertCircle
} from 'lucide-react-native';
import { useThemeStore } from '../../../src/store/themeStore';
import { useAuthStore } from '../../../src/store/authStore';
import { typography } from '../../../src/theme/typography';
import { api } from '../../../src/lib/api';
import * as Haptics from 'expo-haptics';
import { useTranslation } from "react-i18next";

interface Booking {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  totalPrice: number;
  farmer?: { id: string; name: string; email: string };
  equipment?: { id: string; title: string; category: string };
  createdAt: string;
}

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   color: '#F59E0B', bg: '#FEF3C7' },
  ACCEPTED:  { label: 'Accepted',  color: '#10B981', bg: '#D1FAE5' },
  REJECTED:  { label: 'Rejected',  color: '#EF4444', bg: '#FEE2E2' },
  COMPLETED: { label: 'Completed', color: '#6366F1', bg: '#EDE9FE' },
  CANCELLED: { label: 'Cancelled', color: '#9CA3AF', bg: '#F3F4F6' },
};

export default function OwnerRequests() {
    const { t } = useTranslation();
  const { theme } = useThemeStore();
  const { session } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'COMPLETED'>('ALL');

  const fetchBookings = useCallback(async () => {
    try {
      const res = await api.get('/bookings/owner');
      const data = Array.isArray(res.data) ? res.data : (res.data?.bookings || []);
      setBookings(data);
    } catch (err: any) {
      console.error('Failed to fetch owner bookings:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const onRefresh = () => { setRefreshing(true); fetchBookings(); };

  const handleAction = async (bookingId: string, action: 'ACCEPTED' | 'REJECTED' | 'COMPLETED') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const labels = { ACCEPTED: 'Accept', REJECTED: 'Reject', COMPLETED: 'Mark Complete' };
    Alert.alert(
      `${labels[action]} Booking`,
      `Are you sure you want to ${labels[action].toLowerCase()} this booking request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: labels[action],
          style: action === 'REJECTED' ? 'destructive' : 'default',
          onPress: async () => {
            setActionLoading(bookingId);
            try {
              await api.put(`/bookings/${bookingId}/status`, { status: action });
              setBookings(prev =>
                prev.map(b => b.id === bookingId ? { ...b, status: action } : b)
              );
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Action failed. Please try again.');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter);

  const stats = {
    pending: bookings.filter(b => b.status === 'PENDING').length,
    active: bookings.filter(b => b.status === 'ACCEPTED').length,
    revenue: bookings
      .filter(b => b.status === 'COMPLETED')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0),
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 16 }]}>
            {t('loading_booking_requests')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[typography.h1, { color: theme.text }]}>{t('booking_requests')}</Text>
          <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: 4 }]}>
            {t('manage_your_equipment_rental_requests')}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[typography.h2, { color: '#D97706' }]}>{stats.pending}</Text>
            <Text style={[typography.caption, { color: '#92400E', marginTop: 2 }]}>{t('pending')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[typography.h2, { color: '#059669' }]}>{stats.active}</Text>
            <Text style={[typography.caption, { color: '#065F46', marginTop: 2 }]}>{t('active')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#EDE9FE' }]}>
            <Text style={[typography.h2, { color: '#7C3AED' }]}>₹{stats.revenue.toLocaleString()}</Text>
            <Text style={[typography.caption, { color: '#4C1D95', marginTop: 2 }]}>{t('revenue')}</Text>
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {(['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && { backgroundColor: theme.primary }]}
              onPress={() => { Haptics.selectionAsync(); setFilter(f); }}
            >
              <Text style={[styles.filterChipText, { color: filter === f ? '#FFF' : theme.textSecondary }]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Booking Cards */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertCircle size={48} color={theme.textMuted} />
            <Text style={[typography.title, { color: theme.textSecondary, marginTop: 16, textAlign: 'center' }]}>
              {t('no')}{filter === 'ALL' ? '' : filter.toLowerCase()} {t('booking_requests')}</Text>
            <Text style={[typography.caption, { color: theme.textMuted, textAlign: 'center', marginTop: 8 }]}>
              {t('pull_down_to_refresh')}</Text>
          </View>
        ) : (
          filtered.map((booking) => {
            const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
            const isLoading = actionLoading === booking.id;
            const days = Math.max(1,
              Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24))
            );

            return (
              <View key={booking.id} style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Package size={16} color={theme.primary} />
                    <Text style={[typography.title, { color: theme.text, marginLeft: 8, flex: 1 }]} numberOfLines={1}>
                      {booking.equipment?.title || 'Equipment'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                    <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                  </View>
                </View>

                {/* Farmer Info */}
                <View style={styles.infoRow}>
                  <User size={14} color={theme.textMuted} />
                  <Text style={[typography.caption, { color: theme.textSecondary, marginLeft: 6 }]}>
                    {booking.farmer?.name || 'Unknown'} · {booking.farmer?.email || ''}
                  </Text>
                </View>

                {/* Dates & Price */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Calendar size={14} color={theme.textMuted} />
                    <Text style={[typography.caption, { color: theme.textSecondary, marginLeft: 6 }]}>
                      {new Date(booking.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      {' → '}
                      {new Date(booking.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      {' · '}{days}d
                    </Text>
                  </View>
                  <Text style={[typography.title, { color: theme.primary, fontSize: 15 }]}>
                    ₹{(booking.totalPrice || 0).toLocaleString()}
                  </Text>
                </View>

                {/* Action Buttons for PENDING */}
                {booking.status === 'PENDING' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleAction(booking.id, 'REJECTED')}
                      disabled={isLoading}
                    >
                      <XCircle size={16} color="#EF4444" />
                      <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>{t('reject')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.acceptBtn]}
                      onPress={() => handleAction(booking.id, 'ACCEPTED')}
                      disabled={isLoading}
                    >
                      {isLoading
                        ? <ActivityIndicator size="small" color="#FFF" />
                        : <>
                            <CheckCircle2 size={16} color="#FFF" />
                            <Text style={[styles.actionBtnText, { color: '#FFF' }]}>{t('accept')}</Text>
                          </>
                      }
                    </TouchableOpacity>
                  </View>
                )}

                {/* Complete Button for ACCEPTED */}
                {booking.status === 'ACCEPTED' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.completeBtn, { flex: 1 }]}
                      onPress={() => handleAction(booking.id, 'COMPLETED')}
                      disabled={isLoading}
                    >
                      {isLoading
                        ? <ActivityIndicator size="small" color="#FFF" />
                        : <>
                            <Clock size={16} color="#FFF" />
                            <Text style={[styles.actionBtnText, { color: '#FFF' }]}>{t('mark_complete')}</Text>
                          </>
                      }
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 32 },
  header: { marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, padding: 16, borderRadius: 20, alignItems: 'center' },
  filterRow: { gap: 8, paddingRight: 24, marginBottom: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.06)' },
  filterChipText: { fontSize: 12, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  card: { borderRadius: 24, padding: 20, marginBottom: 16, elevation: 2, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 16, gap: 6 },
  rejectBtn: { backgroundColor: '#FEE2E2' },
  acceptBtn: { backgroundColor: '#059669' },
  completeBtn: { backgroundColor: '#7C3AED' },
  actionBtnText: { fontSize: 13, fontWeight: '800' },
});
