import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  TrendingUp, 
  Users, 
  Package, 
  Plus, 
  Settings,
  BarChart3,
} from 'lucide-react-native';
import { useThemeStore } from '../../../src/store/themeStore';
import { typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { PremiumButton } from '../../../src/components/PremiumButton';
import { useRouter } from 'expo-router';
import { useTranslation } from "react-i18next";

export default function OwnerDashboard() {
    const { t } = useTranslation();
  const { theme, isDarkMode } = useThemeStore();
  const router = useRouter();

  const metrics = [
    { label: 'Total Earnings', value: '₹42,500', icon: <TrendingUp size={18} color="#15803D" />, trend: '+12%' },
    { label: 'Active Rentals', value: '8', icon: <Package size={18} color="#0369A1" />, trend: 'Stable' },
    { label: 'Total Farmers', value: '24', icon: <Users size={18} color="#7C3AED" />, trend: '+3' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
            <View>
                <Text style={[typography.h1, { color: theme.text }]}>{t('insights')}</Text>
                <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: 4 }]}>{t('manage_your_farming_fleet')}</Text>
            </View>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Settings size={20} color={theme.text} />
            </TouchableOpacity>
        </View>

        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.metricsList}
            snapToInterval={240 + 16}
            decelerationRate="fast"
        >
            {metrics.map((m, i) => (
                <View key={i} style={[styles.metricCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                    <View style={styles.metricTop}>
                        <View style={[styles.metricCircle, { backgroundColor: theme.surface }]}>
                            {m.icon}
                        </View>
                        <Text style={styles.trendText}>{m.trend}</Text>
                    </View>
                    <Text style={[typography.h2, { color: theme.text, marginTop: 20 }]}>{m.value}</Text>
                    <Text style={[typography.caption, { color: theme.textMuted, marginTop: 4 }]}>{m.label}</Text>
                </View>
            ))}
        </ScrollView>

        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={[typography.h2, { color: theme.text }]}>{t('earnings')}</Text>
                <TouchableOpacity><Text style={[typography.label, { color: theme.primary }]}>{t('view_all')}</Text></TouchableOpacity>
            </View>
            <View style={[styles.chartBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.chartHeader}>
                    <BarChart3 size={18} color={theme.primary} />
                    <Text style={[typography.title, { color: theme.text, marginLeft: 10 }]}>{t('revenue_growth')}</Text>
                </View>
                <View style={styles.chartArea}>
                    {[45, 75, 40, 95, 60, 85, 50].map((h, i) => (
                        <View key={i} style={[styles.bar, { height: h, backgroundColor: theme.primary, opacity: 0.1 + (i * 0.1) }]} />
                    ))}
                </View>
            </View>
        </View>

        <View style={styles.section}>
            <Text style={[typography.h2, { color: theme.text, marginBottom: 20 }]}>{t('quick_actions')}</Text>
            <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.actionCard, { backgroundColor: theme.card }]}
                  onPress={() => router.push('/owner/add-equipment')}
                >
                    <Plus size={24} color={theme.primary} />
                    <Text style={[typography.title, { color: theme.text, marginTop: 12 }]}>{t('add_unit')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.card }]}>
                    <Users size={24} color={theme.primary} />
                    <Text style={[typography.title, { color: theme.text, marginTop: 12 }]}>{t('farmers')}</Text>
                </TouchableOpacity>
            </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.fab}>
          <PremiumButton 
            title={t('list_new_equipment')}
            onPress={() => router.push('/owner/add-equipment')}
            icon={<Plus size={18} color="#FFF" />}
            style={styles.fabBtn}
          />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 28, paddingTop: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 },
  iconBtn: { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  section: { marginBottom: 48 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  metricsList: { paddingRight: 28, marginBottom: 48 },
  metricCard: { width: 240, padding: 24, borderRadius: 32, marginRight: 16, elevation: 2, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
  metricTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  trendText: { color: '#15803D', fontSize: 10, fontWeight: '800', backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  chartBox: { padding: 24, borderRadius: 32, borderWidth: 1.5 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  chartArea: { height: 100, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  bar: { width: 24, borderRadius: 6 },
  actionRow: { flexDirection: 'row', gap: 16 },
  actionCard: { flex: 1, padding: 24, borderRadius: 28, alignItems: 'center', elevation: 2 },
  fab: { position: 'absolute', bottom: 40, left: 28, right: 28 },
  fabBtn: { height: 64, borderRadius: 24, elevation: 8 },
});
