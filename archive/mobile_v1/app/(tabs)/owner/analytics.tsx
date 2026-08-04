import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TrendingUp, CircleDollarSign, Package, Star,
  BarChart3, Calendar, ArrowUp, ArrowDown
} from 'lucide-react-native';
import { useThemeStore } from '../../../src/store/themeStore';
import { useAuthStore } from '../../../src/store/authStore';
import { typography } from '../../../src/theme/typography';
import { api } from '../../../src/lib/api';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';
import { useTranslation } from "react-i18next";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 96;
const CHART_HEIGHT = 120;

interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  averageRating: number;
  topEquipment: { title: string; bookings: number; revenue: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
  utilization: number;
}

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function OwnerAnalytics() {
    const { t } = useTranslation();
  const { theme, isDarkMode } = useThemeStore();
  const { session } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await api.get('/analytics/owner');
      const d = res.data;
      setData({
        totalRevenue: d.totalRevenue || 0,
        totalBookings: d.totalBookings || 0,
        completedBookings: d.completedBookings || 0,
        pendingBookings: d.pendingBookings || 0,
        averageRating: d.averageRating || 4.8,
        topEquipment: d.topEquipment || [],
        monthlyRevenue: d.monthlyRevenue || d.revenueByMonth || [],
        utilization: d.utilization || 0,
      });
    } catch (err: any) {
      console.error('Owner analytics fetch failed:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const onRefresh = () => { setRefreshing(true); fetchAnalytics(); };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 16 }]}>
            {t('loading_analytics')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Normalize monthly chart bars
  const monthly = data?.monthlyRevenue?.slice(-6) || [];
  const maxRev = Math.max(...monthly.map(m => m.revenue), 1);
  const barWidth = monthly.length > 0 ? (CHART_WIDTH / monthly.length) - 8 : 30;

  const kpis = [
    {
      label: 'Total Revenue',
      value: `₹${(data?.totalRevenue || 0).toLocaleString()}`,
      icon: <CircleDollarSign size={20} color="#059669" />,
      bg: '#D1FAE5',
      positive: true,
    },
    {
      label: 'Bookings',
      value: String(data?.totalBookings || 0),
      icon: <Package size={20} color="#3B82F6" />,
      bg: '#DBEAFE',
      positive: true,
    },
    {
      label: 'Completed',
      value: String(data?.completedBookings || 0),
      icon: <TrendingUp size={20} color="#8B5CF6" />,
      bg: '#EDE9FE',
      positive: true,
    },
    {
      label: 'Rating',
      value: `${(data?.averageRating || 4.8).toFixed(1)} ⭐`,
      icon: <Star size={20} color="#F59E0B" />,
      bg: '#FEF3C7',
      positive: true,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[typography.h1, { color: theme.text }]}>{t('analytics')}</Text>
          <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: 4 }]}>
            {t('your_fleet_performance_overview')}</Text>
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          {kpis.map((kpi, i) => (
            <View key={i} style={[styles.kpiCard, { backgroundColor: kpi.bg }]}>
              <View style={styles.kpiIcon}>{kpi.icon}</View>
              <Text style={[typography.h2, { color: theme.text, marginTop: 12, fontSize: 18 }]}>
                {kpi.value}
              </Text>
              <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 4 }]}>
                {kpi.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Revenue Chart */}
        <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.chartHeader}>
            <BarChart3 size={18} color={theme.primary} />
            <Text style={[typography.title, { color: theme.text, marginLeft: 10 }]}>
              {t('monthly_revenue_last_6_months')}</Text>
          </View>

          {monthly.length > 0 ? (
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 24} style={{ marginTop: 8 }}>
              <G>
                {monthly.map((m, i) => {
                  const barHeight = Math.max(4, (m.revenue / maxRev) * CHART_HEIGHT);
                  const x = i * (CHART_WIDTH / monthly.length) + 4;
                  const y = CHART_HEIGHT - barHeight;
                  const month = m.month
                    ? MONTHS_SHORT[new Date(m.month + '-01').getMonth()] || m.month.slice(5, 7)
                    : '';
                  return (
                    <G key={i}>
                      <Rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx={6}
                        fill={theme.primary}
                        opacity={0.3 + (i / monthly.length) * 0.7}
                      />
                      <SvgText
                        x={x + barWidth / 2}
                        y={CHART_HEIGHT + 18}
                        fontSize="10"
                        fill={theme.textMuted as string}
                        textAnchor="middle"
                        fontWeight="700"
                      >
                        {month}
                      </SvgText>
                    </G>
                  );
                })}
              </G>
            </Svg>
          ) : (
            <View style={styles.noDataBox}>
              <Text style={[typography.caption, { color: theme.textMuted }]}>
                {t('no_revenue_data_yet_complete_bookings_to')}</Text>
            </View>
          )}
        </View>

        {/* Utilization */}
        <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.chartHeader}>
            <Calendar size={18} color={theme.primary} />
            <Text style={[typography.title, { color: theme.text, marginLeft: 10 }]}>
              {t('fleet_utilization')}</Text>
          </View>
          <View style={styles.utilizationRow}>
            <View style={[styles.utilizationBar, { backgroundColor: theme.border }]}>
              <View style={[
                styles.utilizationFill,
                {
                  width: `${Math.min(100, data?.utilization || 0)}%`,
                  backgroundColor: theme.primary
                }
              ]} />
            </View>
            <Text style={[typography.title, { color: theme.primary, marginLeft: 16 }]}>
              {(data?.utilization || 0).toFixed(0)}%
            </Text>
          </View>
          <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 8 }]}>
            {data?.completedBookings || 0} {t('completed_out_of')}{data?.totalBookings || 0} {t('total_bookings')}</Text>
        </View>

        {/* Top Equipment */}
        {data?.topEquipment && data.topEquipment.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.chartHeader, { marginBottom: 16 }]}>
              <TrendingUp size={18} color={theme.primary} />
              <Text style={[typography.title, { color: theme.text, marginLeft: 10 }]}>
                {t('top_performing_equipment')}</Text>
            </View>
            {data.topEquipment.slice(0, 4).map((eq, i) => (
              <View key={i} style={styles.topEquipRow}>
                <View style={[styles.rankBadge, { backgroundColor: theme.primary + '20' }]}>
                  <Text style={[typography.caption, { color: theme.primary, fontWeight: '900' }]}>
                    #{i + 1}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[typography.body, { color: theme.text }]} numberOfLines={1}>
                    {eq.title}
                  </Text>
                  <Text style={[typography.caption, { color: theme.textSecondary }]}>
                    {eq.bookings} {t('bookings')}</Text>
                </View>
                <Text style={[typography.title, { color: theme.primary }]}>
                  ₹{(eq.revenue || 0).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
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
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  kpiCard: { width: '47%', padding: 20, borderRadius: 24 },
  kpiIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center' },
  chartCard: { borderRadius: 28, padding: 24, marginBottom: 16, borderWidth: 1.5 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  noDataBox: { paddingVertical: 24, alignItems: 'center' },
  utilizationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  utilizationBar: { flex: 1, height: 12, borderRadius: 6, overflow: 'hidden' },
  utilizationFill: { height: '100%', borderRadius: 6 },
  topEquipRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.06)' },
  rankBadge: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
});
