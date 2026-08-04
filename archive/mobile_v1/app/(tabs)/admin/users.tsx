import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users, Search, ShieldOff, ShieldCheck, Trash2,
  AlertCircle, User, Mail, Phone, Crown
} from 'lucide-react-native';
import { useThemeStore } from '../../../src/store/themeStore';
import { typography } from '../../../src/theme/typography';
import { api } from '../../../src/lib/api';
import * as Haptics from 'expo-haptics';
import { useTranslation } from "react-i18next";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'FARMER' | 'OWNER' | 'ADMIN';
  isVerified: boolean;
  isSuspended: boolean;
  createdAt: string;
}

const ROLE_CONFIG = {
  FARMER: { color: '#059669', bg: '#D1FAE5', label: 'Farmer' },
  OWNER:  { color: '#3B82F6', bg: '#DBEAFE', label: 'Owner' },
  ADMIN:  { color: '#7C3AED', bg: '#EDE9FE', label: 'Admin' },
};

export default function AdminUsers() {
    const { t } = useTranslation();
  const { theme } = useThemeStore();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [filtered, setFiltered] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'FARMER' | 'OWNER' | 'ADMIN'>('ALL');

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/analytics/admin/users');
      const list = Array.isArray(res.data) ? res.data : (res.data?.users || []);
      setUsers(list);
      setFiltered(list);
    } catch (err: any) {
      console.error('Failed to load users:', err.message);
      Alert.alert('Error', 'Could not load user registry. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  const onRefresh = () => { setRefreshing(true); fetchUsers(); };

  useEffect(() => {
    let result = users;
    if (roleFilter !== 'ALL') result = result.filter(u => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, roleFilter, users]);

  const handleSuspend = (user: UserRecord) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const isSuspended = user.isSuspended;
    Alert.alert(
      isSuspended ? 'Activate User' : 'Suspend User',
      `Are you sure you want to ${isSuspended ? 'activate' : 'suspend'} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isSuspended ? 'Activate' : 'Suspend',
          style: isSuspended ? 'default' : 'destructive',
          onPress: async () => {
            setActionLoading(user.id);
            try {
              await api.put(`/analytics/admin/users/${user.id}/suspend`, {
                suspended: !isSuspended
              });
              setUsers(prev =>
                prev.map(u => u.id === user.id ? { ...u, isSuspended: !isSuspended } : u)
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

  const handleDelete = (user: UserRecord) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Delete User',
      `This will permanently delete ${user.name}'s account and all associated data. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(user.id);
            try {
              await api.delete(`/analytics/admin/users/${user.id}`);
              setUsers(prev => prev.filter(u => u.id !== user.id));
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

  const stats = {
    total: users.length,
    farmers: users.filter(u => u.role === 'FARMER').length,
    owners: users.filter(u => u.role === 'OWNER').length,
    suspended: users.filter(u => u.isSuspended).length,
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 16 }]}>
            {t('loading_user_registry')}</Text>
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
          <Text style={[typography.h1, { color: theme.text }]}>{t('user_registry')}</Text>
          <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: 4 }]}>
            {t('manage_platform_users_and_permissions')}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
            <Text style={[typography.h2, { color: '#1D4ED8', fontSize: 20 }]}>{stats.total}</Text>
            <Text style={[typography.caption, { color: '#1E3A8A' }]}>{t('total')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
            <Text style={[typography.h2, { color: '#059669', fontSize: 20 }]}>{stats.farmers}</Text>
            <Text style={[typography.caption, { color: '#065F46' }]}>{t('farmers')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#EDE9FE' }]}>
            <Text style={[typography.h2, { color: '#7C3AED', fontSize: 20 }]}>{stats.owners}</Text>
            <Text style={[typography.caption, { color: '#4C1D95' }]}>{t('owners')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[typography.h2, { color: '#DC2626', fontSize: 20 }]}>{stats.suspended}</Text>
            <Text style={[typography.caption, { color: '#7F1D1D' }]}>{t('suspended')}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Search size={18} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder={t('search_users_by_name_or_email')}
            placeholderTextColor={theme.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Role Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {(['ALL', 'FARMER', 'OWNER', 'ADMIN'] as const).map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.filterChip, roleFilter === r && { backgroundColor: theme.primary }]}
              onPress={() => setRoleFilter(r)}
            >
              <Text style={[styles.filterChipText, { color: roleFilter === r ? '#FFF' : theme.textSecondary }]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* User Cards */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertCircle size={48} color={theme.textMuted} />
            <Text style={[typography.title, { color: theme.textSecondary, marginTop: 16, textAlign: 'center' }]}>
              {t('no_users_found')}</Text>
          </View>
        ) : (
          filtered.map(user => {
            const roleCfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.FARMER;
            const isLoading = actionLoading === user.id;

            return (
              <View key={user.id} style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                {/* User Header */}
                <View style={styles.cardHeader}>
                  <View style={[styles.avatar, { backgroundColor: roleCfg.bg }]}>
                    <Text style={{ fontSize: 18 }}>
                      {user.role === 'ADMIN' ? '👑' : user.role === 'OWNER' ? '🏭' : '🌾'}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={[typography.title, { color: theme.text }]} numberOfLines={1}>
                        {user.name}
                      </Text>
                      {user.isSuspended && (
                        <View style={styles.suspendedBadge}>
                          <Text style={styles.suspendedBadgeText}>{t('suspended')}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[typography.caption, { color: theme.textSecondary }]} numberOfLines={1}>
                      {user.email}
                    </Text>
                  </View>
                  <View style={[styles.roleBadge, { backgroundColor: roleCfg.bg }]}>
                    <Text style={[styles.roleBadgeText, { color: roleCfg.color }]}>
                      {roleCfg.label}
                    </Text>
                  </View>
                </View>

                {/* User Details */}
                <View style={styles.detailRow}>
                  <Text style={[typography.caption, { color: theme.textMuted }]}>
                    {t('joined')}{new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </Text>
                  <Text style={[typography.caption, { color: user.isVerified ? '#059669' : '#F59E0B' }]}>
                    {user.isVerified ? '✓ Verified' : '⚠ Unverified'}
                  </Text>
                </View>

                {/* Action Buttons */}
                {user.role !== 'ADMIN' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        { backgroundColor: user.isSuspended ? '#D1FAE5' : '#FEE2E2' }
                      ]}
                      onPress={() => handleSuspend(user)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color={user.isSuspended ? '#059669' : '#EF4444'} />
                      ) : user.isSuspended ? (
                        <>
                          <ShieldCheck size={14} color="#059669" />
                          <Text style={[styles.actionBtnText, { color: '#059669' }]}>{t('activate')}</Text>
                        </>
                      ) : (
                        <>
                          <ShieldOff size={14} color="#EF4444" />
                          <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>{t('suspend')}</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}
                      onPress={() => handleDelete(user)}
                      disabled={isLoading}
                    >
                      <Trash2 size={14} color="#EF4444" />
                      <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>{t('delete')}</Text>
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
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, padding: 12, borderRadius: 16, alignItems: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, borderWidth: 1.5, marginBottom: 16 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600' },
  filterRow: { gap: 8, paddingRight: 24, marginBottom: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.06)' },
  filterChipText: { fontSize: 12, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  card: { borderRadius: 24, padding: 20, marginBottom: 16, elevation: 2, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  suspendedBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  suspendedBadgeText: { fontSize: 9, fontWeight: '900', color: '#EF4444' },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roleBadgeText: { fontSize: 11, fontWeight: '800' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 14, gap: 6 },
  actionBtnText: { fontSize: 12, fontWeight: '800' },
});
