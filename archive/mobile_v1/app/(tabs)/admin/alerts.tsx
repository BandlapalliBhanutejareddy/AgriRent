import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertTriangle, Users, Package, CheckCircle2,
  TrendingUp, Clock, ShieldAlert, Bell, Database
} from 'lucide-react-native';
import { useThemeStore } from '../../../src/store/themeStore';
import { typography } from '../../../src/theme/typography';
import { api } from '../../../src/lib/api';
import { useTranslation } from "react-i18next";

interface AlertItem {
  id: string;
  type: 'SUSPENDED_USER' | 'PENDING_BOOKING' | 'EQUIPMENT_ISSUE' | 'SYSTEM';
  title: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}

interface AdminStats {
  totalUsers: number;
  totalEquipment: number;
  totalBookings: number;
  pendingBookings: number;
  suspendedUsers: number;
  completedBookings: number;
  totalRevenue: number;
}

const SEVERITY_CONFIG = {
  HIGH:   { color: '#EF4444', bg: '#FEE2E2', label: 'High' },
  MEDIUM: { color: '#F59E0B', bg: '#FEF3C7', label: 'Medium' },
  LOW:    { color: '#6366F1', bg: '#EDE9FE', label: 'Low' },
};

const ALERT_ICONS = {
  SUSPENDED_USER:   <ShieldAlert size={20} color="#EF4444" />,
  PENDING_BOOKING:  <Clock size={20} color="#F59E0B" />,
  EQUIPMENT_ISSUE:  <Package size={20} color="#6366F1" />,
  SYSTEM:           <Database size={20} color="#6B7280" />,
};

export default function AdminAlerts() {
    const { t } = useTranslation();
  const { theme } = useThemeStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch admin overview
      const [usersRes, equipmentRes, bookingsRes] = await Promise.allSettled([
        api.get('/analytics/admin/users'),
        api.get('/analytics/admin/equipment'),
        api.get('/bookings/admin/all'),
      ]);

      const users = usersRes.status === 'fulfilled'
        ? (Array.isArray(usersRes.value.data) ? usersRes.value.data : usersRes.value.data?.users || [])
        : [];
      const equipment = equipmentRes.status === 'fulfilled'
        ? (Array.isArray(equipmentRes.value.data) ? equipmentRes.value.data : equipmentRes.value.data?.items || [])
        : [];
      const bookings = bookingsRes.status === 'fulfilled'
        ? (Array.isArray(bookingsRes.value.data) ? bookingsRes.value.data : bookingsRes.value.data?.bookings || [])
        : [];

      const suspendedUsers = users.filter((u: any) => u.isSuspended);
      const pendingBookings = bookings.filter((b: any) => b.status === 'PENDING');
      const completedBookings = bookings.filter((b: any) => b.status === 'COMPLETED');
      const totalRevenue = completedBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);

      setStats({
        totalUsers: users.length,
        totalEquipment: equipment.length,
        totalBookings: bookings.length,
        pendingBookings: pendingBookings.length,
        suspendedUsers: suspendedUsers.length,
        completedBookings: completedBookings.length,
        totalRevenue,
      });

      // Build dynamic alerts from real data
      const dynamicAlerts: AlertItem[] = [];

      suspendedUsers.slice(0, 3).forEach((u: any) => {
        dynamicAlerts.push({
          id: `suspended-${u.id}`,
          type: 'SUSPENDED_USER',
          title: 'User Suspended',
          message: `${u.name} (${u.email}) is currently suspended from the platform.`,
          severity: 'HIGH',
          createdAt: u.createdAt,
        });
      });

      if (pendingBookings.length > 0) {
        dynamicAlerts.push({
          id: 'pending-bookings',
          type: 'PENDING_BOOKING',
          title: `${pendingBookings.length} Pending Booking${pendingBookings.length > 1 ? 's' : ''}`,
          message: 'Booking requests are awaiting owner response.',
          severity: pendingBookings.length > 5 ? 'HIGH' : 'MEDIUM',
          createdAt: new Date().toISOString(),
        });
      }

      const unavailableEquip = equipment.filter((e: any) => !e.available);
      if (unavailableEquip.length > 0) {
        dynamicAlerts.push({
          id: 'unavailable-equipment',
          type: 'EQUIPMENT_ISSUE',
          title: `${unavailableEquip.length} Equipment Deactivated`,
          message: 'Some equipment units are currently marked as unavailable.',
          severity: 'LOW',
          createdAt: new Date().toISOString(),
        });
      }

      dynamicAlerts.push({
        id: 'system-health',
        type: 'SYSTEM',
        title: 'Platform Health: Good',
        message: `${users.length} users · ${equipment.length} listings · ₹${totalRevenue.toLocaleString()} total revenue`,
        severity: 'LOW',
        createdAt: new Date().toISOString(),
      });

      setAlerts(dynamicAlerts);
    } catch (err: any) {
      console.error('Admin alerts fetch failed:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 16 }]}>
            {t('loading_platform_alerts')}</Text>
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
          <Text style={[typography.h1, { color: theme.text }]}>{t('platform_alerts')}</Text>
          <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: 4 }]}>
            {t('system_health_and_moderation_overview')}</Text>
        </View>

        {/* Health Summary Grid */}
        {stats && (
          <View style={styles.healthGrid}>
            <View style={[styles.healthCard, { backgroundColor: '#DBEAFE' }]}>
              <Users size={20} color="#1D4ED8" />
              <Text style={[typography.h2, { color: '#1D4ED8', marginTop: 8, fontSize: 22 }]}>
                {stats.totalUsers}
              </Text>
              <Text style={[typography.caption, { color: '#1E3A8A' }]}>{t('users')}</Text>
            </View>
            <View style={[styles.healthCard, { backgroundColor: '#D1FAE5' }]}>
              <Package size={20} color="#059669" />
              <Text style={[typography.h2, { color: '#059669', marginTop: 8, fontSize: 22 }]}>
                {stats.totalEquipment}
              </Text>
              <Text style={[typography.caption, { color: '#065F46' }]}>{t('equipment')}</Text>
            </View>
            <View style={[styles.healthCard, { backgroundColor: '#FEF3C7' }]}>
              <Clock size={20} color="#D97706" />
              <Text style={[typography.h2, { color: '#D97706', marginTop: 8, fontSize: 22 }]}>
                {stats.pendingBookings}
              </Text>
              <Text style={[typography.caption, { color: '#92400E' }]}>{t('pending')}</Text>
            </View>
            <View style={[styles.healthCard, { backgroundColor: '#FEE2E2' }]}>
              <ShieldAlert size={20} color="#DC2626" />
              <Text style={[typography.h2, { color: '#DC2626', marginTop: 8, fontSize: 22 }]}>
                {stats.suspendedUsers}
              </Text>
              <Text style={[typography.caption, { color: '#7F1D1D' }]}>{t('suspended')}</Text>
            </View>
          </View>
        )}

        {/* Revenue Banner */}
        {stats && (
          <View style={[styles.revenueBanner, { backgroundColor: theme.primary }]}>
            <TrendingUp size={24} color="#FFF" />
            <View style={{ marginLeft: 16 }}>
              <Text style={[typography.caption, { color: 'rgba(255,255,255,0.8)' }]}>
                {t('total_platform_revenue')}</Text>
              <Text style={[typography.h1, { color: '#FFF', fontSize: 28 }]}>
                ₹{stats.totalRevenue.toLocaleString()}
              </Text>
              <Text style={[typography.caption, { color: 'rgba(255,255,255,0.8)' }]}>
                {t('from')}{stats.completedBookings} {t('completed_bookings')}</Text>
            </View>
          </View>
        )}

        {/* Alerts List */}
        <View style={styles.alertsSection}>
          <View style={styles.sectionHeader}>
            <Bell size={18} color={theme.primary} />
            <Text style={[typography.h2, { color: theme.text, marginLeft: 10 }]}>
              {t('active_alerts')}{alerts.length})
            </Text>
          </View>

          {alerts.length === 0 ? (
            <View style={styles.emptyState}>
              <CheckCircle2 size={48} color="#10B981" />
              <Text style={[typography.title, { color: theme.textSecondary, marginTop: 16, textAlign: 'center' }]}>
                {t('all_clear_no_active_alerts')}</Text>
            </View>
          ) : (
            alerts.map(alert => {
              const severityCfg = SEVERITY_CONFIG[alert.severity];
              const icon = ALERT_ICONS[alert.type];

              return (
                <View key={alert.id} style={[styles.alertCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                  <View style={styles.alertHeader}>
                    <View style={[styles.alertIconBox, { backgroundColor: severityCfg.bg }]}>
                      {icon}
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[typography.title, { color: theme.text }]} numberOfLines={1}>
                        {alert.title}
                      </Text>
                      <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 4, lineHeight: 18 }]}>
                        {alert.message}
                      </Text>
                    </View>
                    <View style={[styles.severityBadge, { backgroundColor: severityCfg.bg }]}>
                      <Text style={[styles.severityText, { color: severityCfg.color }]}>
                        {severityCfg.label}
                      </Text>
                    </View>
                  </View>
                  <Text style={[typography.caption, { color: theme.textMuted, marginTop: 10 }]}>
                    {new Date(alert.createdAt).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </Text>
                </View>
              );
            })
          )}
        </View>

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
  healthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  healthCard: { width: '47%', padding: 20, borderRadius: 24, alignItems: 'center' },
  revenueBanner: { borderRadius: 28, padding: 24, flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  alertsSection: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  alertCard: { borderRadius: 24, padding: 20, marginBottom: 12, elevation: 2, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  alertHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  alertIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start' },
  severityText: { fontSize: 10, fontWeight: '900' },
});
