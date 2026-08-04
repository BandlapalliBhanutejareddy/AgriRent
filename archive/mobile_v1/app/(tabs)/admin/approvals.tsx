import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Package, CheckCircle2, XCircle, Trash2, MapPin,
  Tag, AlertCircle, Image as ImageIcon, Filter
} from 'lucide-react-native';
import { useThemeStore } from '../../../src/store/themeStore';
import { typography } from '../../../src/theme/typography';
import { api } from '../../../src/lib/api';
import * as Haptics from 'expo-haptics';
import { useTranslation } from "react-i18next";

interface Equipment {
  id: string;
  title: string;
  category: string;
  pricePerDay: number;
  location?: string;
  description?: string;
  available: boolean;
  owner?: { name: string; email: string };
  createdAt: string;
  _count?: { bookings: number };
}

const CATEGORY_ICONS: Record<string, string> = {
  TRACTOR: '🚜', HARVESTER: '🌾', IRRIGATION: '💧',
  IMPLEMENT: '🔧', SEEDER: '🌱', OTHER: '⚙️',
};

export default function AdminApprovals() {
    const { t } = useTranslation();
  const { theme } = useThemeStore();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'AVAILABLE' | 'UNAVAILABLE'>('ALL');

  const fetchEquipment = useCallback(async () => {
    try {
      const res = await api.get('/analytics/admin/equipment');
      const list = Array.isArray(res.data) ? res.data : (res.data?.equipment || res.data?.items || []);
      setEquipment(list);
    } catch (err: any) {
      console.error('Equipment fetch failed:', err.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEquipment(); }, [fetchEquipment]);
  const onRefresh = () => { setRefreshing(true); fetchEquipment(); };

  const handleToggleAvailability = (eq: Equipment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const action = eq.available ? 'Deactivate' : 'Activate';
    Alert.alert(
      `${action} Equipment`,
      `${action} "${eq.title}"? This will ${eq.available ? 'prevent new bookings' : 'allow new bookings'}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          style: eq.available ? 'destructive' : 'default',
          onPress: async () => {
            setActionLoading(eq.id);
            try {
              await api.put(`/analytics/admin/equipment/${eq.id}/toggle`);
              setEquipment(prev =>
                prev.map(e => e.id === eq.id ? { ...e, available: !e.available } : e)
              );
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Action failed');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const handleDelete = (eq: Equipment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Delete Equipment',
      `Permanently delete "${eq.title}"? All associated bookings will also be affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(eq.id);
            try {
              await api.delete(`/analytics/admin/equipment/${eq.id}`);
              setEquipment(prev => prev.filter(e => e.id !== eq.id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Delete failed');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const filtered = filter === 'ALL' ? equipment
    : filter === 'AVAILABLE' ? equipment.filter(e => e.available)
    : equipment.filter(e => !e.available);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 16 }]}>
            {t('loading_equipment_list')}</Text>
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
          <Text style={[typography.h1, { color: theme.text }]}>{t('equipment')}</Text>
          <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: 4 }]}>
            {t('moderate_platform_equipment_listings')}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
            <Text style={[typography.h2, { color: '#1D4ED8' }]}>{equipment.length}</Text>
            <Text style={[typography.caption, { color: '#1E3A8A' }]}>{t('total')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[typography.h2, { color: '#059669' }]}>
              {equipment.filter(e => e.available).length}
            </Text>
            <Text style={[typography.caption, { color: '#065F46' }]}>{t('active')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[typography.h2, { color: '#DC2626' }]}>
              {equipment.filter(e => !e.available).length}
            </Text>
            <Text style={[typography.caption, { color: '#7F1D1D' }]}>{t('inactive')}</Text>
          </View>
        </View>

        {/* Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {(['ALL', 'AVAILABLE', 'UNAVAILABLE'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && { backgroundColor: theme.primary }]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, { color: filter === f ? '#FFF' : theme.textSecondary }]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Equipment Cards */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertCircle size={48} color={theme.textMuted} />
            <Text style={[typography.title, { color: theme.textSecondary, marginTop: 16, textAlign: 'center' }]}>
              {t('no_equipment_found')}</Text>
          </View>
        ) : (
          filtered.map(eq => {
            const isLoading = actionLoading === eq.id;
            const icon = CATEGORY_ICONS[eq.category] || '⚙️';

            return (
              <View key={eq.id} style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: theme.surface }]}>
                    <Text style={{ fontSize: 22 }}>{icon}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[typography.title, { color: theme.text }]} numberOfLines={1}>
                      {eq.title}
                    </Text>
                    <Text style={[typography.caption, { color: theme.textSecondary }]}>
                      {eq.owner?.name || 'Unknown owner'}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: eq.available ? '#10B981' : '#EF4444' }
                  ]} />
                </View>

                {/* Details */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Tag size={12} color={theme.textMuted} />
                    <Text style={[typography.caption, { color: theme.textSecondary, marginLeft: 4 }]}>
                      {eq.category}
                    </Text>
                  </View>
                  {eq.location && (
                    <View style={styles.detailItem}>
                      <MapPin size={12} color={theme.textMuted} />
                      <Text style={[typography.caption, { color: theme.textSecondary, marginLeft: 4 }]}>
                        {eq.location}
                      </Text>
                    </View>
                  )}
                  <Text style={[typography.title, { color: theme.primary, fontSize: 14 }]}>
                    ₹{eq.pricePerDay}{t('day')}</Text>
                </View>

                {/* Status & Bookings */}
                <View style={styles.metaRow}>
                  <Text style={[typography.caption, { color: theme.textMuted }]}>
                    {eq._count?.bookings || 0} {t('total_bookings')}</Text>
                  <Text style={[typography.caption, { color: theme.textMuted }]}>
                    {new Date(eq.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      { backgroundColor: eq.available ? '#FEE2E2' : '#D1FAE5', flex: 1 }
                    ]}
                    onPress={() => handleToggleAvailability(eq)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={eq.available ? '#EF4444' : '#059669'} />
                    ) : eq.available ? (
                      <>
                        <XCircle size={14} color="#EF4444" />
                        <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>{t('deactivate')}</Text>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} color="#059669" />
                        <Text style={[styles.actionBtnText, { color: '#059669' }]}>{t('activate')}</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
                    onPress={() => handleDelete(eq)}
                    disabled={isLoading}
                  >
                    <Trash2 size={14} color="#EF4444" />
                    <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>{t('delete')}</Text>
                  </TouchableOpacity>
                </View>
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14, gap: 6 },
  actionBtnText: { fontSize: 12, fontWeight: '800' },
});
