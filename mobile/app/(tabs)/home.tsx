import React, { useEffect, useState } from 'react';
import { useWindowDimensions, View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  CloudSun, 
  ArrowRight,
  Bell,
  Zap,
  MapPin,
  Star,
  Play
} from 'lucide-react-native';

// Design System & Components
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { useBookingStore } from '../../src/store/bookingStore';
import { useEquipmentStore } from '../../src/store/equipmentStore';
import { FadeInImage } from '../../src/components/FadeInImage';
import { HomeSkeleton } from '../../src/components/Shimmers';

function HomeDashboardScreen() {
  const { width } = useWindowDimensions();
  const { theme, isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { bookings } = useBookingStore();
  const { equipmentList } = useEquipmentStore();
  const { t } = useTranslation();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}><HomeSkeleton /></SafeAreaView>;

  const isOwner = user?.role === 'OWNER';
  const activeBooking = bookings.find(b => b.status === 'ACTIVE' || b.status === 'ACCEPTED');
  const nearbyEquipment = equipmentList.slice(0, 5);
  const myEquipment = equipmentList.filter(e => e.ownerId === user?.id);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Calm Header */}
        <View style={styles.header}>
          <View>
            <Text style={[typography.h1, { color: theme.text }]}>Hello, {user?.name?.split(' ')[0] || (isOwner ? 'Owner' : 'Farmer')}</Text>
            <View style={styles.headerLocation}>
                <MapPin size={12} color={theme.primary} />
                <Text style={[typography.caption, { color: theme.textSecondary, marginLeft: 4 }]}>Nashik, Maharashtra</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.notificationBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/notifications')}
          >
            <Bell size={20} color={theme.text} />
            <View style={[styles.notifBadge, { backgroundColor: theme.primary }]} />
          </TouchableOpacity>
        </View>

        {isOwner ? (
          /* Owner-Specific View */
          <>
            <View style={styles.section}>
              <View style={[styles.ownerStatsRow, { gap: spacing.md }]}>
                <View style={[styles.ownerStatCard, { backgroundColor: theme.card, flex: 1 }]}>
                  <Text style={[typography.caption, { color: theme.textSecondary }]}>Earnings</Text>
                  <Text style={[typography.h2, { color: theme.primary }]}>₹45.2k</Text>
                </View>
                <View style={[styles.ownerStatCard, { backgroundColor: theme.card, flex: 1 }]}>
                  <Text style={[typography.caption, { color: theme.textSecondary }]}>Rentals</Text>
                  <Text style={[typography.h2, { color: theme.text }]}>{bookings.length}</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[typography.h2, { color: theme.text }]}>My Fleet</Text>
                <TouchableOpacity onPress={() => router.push('/owner/dashboard')}>
                  <ArrowRight size={20} color={theme.primary} />
                </TouchableOpacity>
              </View>
              {myEquipment.length === 0 ? (
                <View style={[styles.emptyFleet, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[typography.body, { color: theme.textSecondary }]}>No equipment listed yet.</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {myEquipment.map(item => (
                    <TouchableOpacity key={item.id} style={[styles.miniCard, { backgroundColor: theme.card }]}>
                      <FadeInImage uri={item.imageUrl} style={styles.miniThumb} />
                      <Text style={[typography.caption, { color: theme.text, marginTop: 8 }]} numberOfLines={1}>{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </>
        ) : (
          /* Farmer View (Existing) */
          <>
            <LinearGradient
              colors={isDarkMode ? ['#1A1C1E', '#121416'] : ['#15803D', '#166534']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.weatherCard}
            >
              <View style={styles.weatherInfo}>
                <Text style={[typography.hero, { color: '#FFF', fontSize: 32 }]}>32°C</Text>
                <Text style={[typography.bodySmall, { color: 'rgba(255,255,255,0.8)', marginTop: 2 }]}>Perfect for harvesting today</Text>
              </View>
              <CloudSun size={60} color="#FFF" opacity={0.4} strokeWidth={1.5} />
            </LinearGradient>

            <View style={styles.section}>
              <View style={[styles.insightCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.insightIcon, { backgroundColor: '#FEFCE8' }]}>
                    <Zap size={16} color="#EAB308" fill="#EAB308" />
                </View>
                <Text style={[typography.bodySmall, { color: theme.textSecondary, flex: 1, marginLeft: 16 }]}>
                    Market prices for <Text style={{ fontWeight: 'bold', color: theme.text }}>Rice</Text> are up 12% this week.
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Common Sections */}
        {!isOwner && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[typography.h2, { color: theme.text }]}>{t('nearby_equipment')}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)')}>
                <ArrowRight size={20} color={theme.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContainer}
              snapToInterval={240 + spacing.md}
              decelerationRate="fast"
            >
              {nearbyEquipment.map((item, idx) => (
                <TouchableOpacity 
                  key={item.id || idx}
                  activeOpacity={0.9}
                  style={[styles.carouselCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
                  onPress={() => router.push(`/equipment/${item.id}`)}
                >
                  <FadeInImage uri={item.imageUrl} style={styles.carouselImage} />
                  <View style={styles.carouselContent}>
                      <Text style={[typography.title, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                      <View style={styles.carouselFooter}>
                          <Text style={[typography.title, { color: theme.primary, fontSize: 14 }]}>₹{item.pricePerDay}/d</Text>
                          <View style={styles.ratingRow}>
                              <Star size={10} color="#F59E0B" fill="#F59E0B" />
                              <Text style={[typography.meta, { color: theme.textMuted, marginLeft: 4 }]}>4.9</Text>
                          </View>
                      </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {activeBooking && (
          <View style={styles.section}>
            <Text style={[typography.h2, { color: theme.text, marginBottom: spacing.lg }]}>{isOwner ? 'Active Rental (Your Fleet)' : 'Your Active Rental'}</Text>
            <TouchableOpacity 
              style={[styles.activeCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
              activeOpacity={0.9}
              onPress={() => router.push('/(tabs)/bookings')}
            >
              <FadeInImage uri={activeBooking.equipment?.imageUrl} style={styles.activeThumb} />
              <View style={styles.activeContent}>
                <Text style={[typography.title, { color: theme.text }]} numberOfLines={1}>{activeBooking.equipment?.name}</Text>
                <Text style={[typography.caption, { color: theme.success, fontWeight: '700', marginTop: 2 }]}>{activeBooking.status}</Text>
              </View>
              <ArrowRight size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[typography.h2, { color: theme.text, marginBottom: spacing.lg }]}>Knowledge Hub</Text>
          <TouchableOpacity 
            style={[styles.guideCard, { backgroundColor: theme.card }]}
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/guides/Rice')}
          >
            <FadeInImage 
                uri="https://images.unsplash.com/photo-1536657235019-03071263842a?w=800&fit=crop" 
                style={styles.guideImage} 
            />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.guideOverlay}
            >
                <View style={styles.playBtn}>
                    <Play size={16} color="#FFF" fill="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[typography.title, { color: '#FFF' }]}>Modern Farming Techniques</Text>
                    <Text style={[typography.caption, { color: 'rgba(255,255,255,0.7)' }]}>Watch and learn from experts</Text>
                </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.bottomSafe }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.screenHorizontal, paddingTop: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  headerLocation: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  notificationBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  notifBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: '#FFF' },
  weatherCard: { padding: spacing.xl, borderRadius: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  weatherInfo: { flex: 1 },
  section: { marginBottom: spacing.sectionGap },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  insightCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: 24, borderWidth: 1.5 },
  insightIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  activeCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: 28, elevation: 2, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  activeThumb: { width: 56, height: 56, borderRadius: 14 },
  activeContent: { flex: 1, marginLeft: 16 },
  carouselContainer: { paddingRight: spacing.screenHorizontal },
  carouselCard: { width: 240, marginRight: spacing.md, borderRadius: 28, overflow: 'hidden', elevation: 2, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  carouselImage: { width: '100%', height: 150 },
  carouselContent: { padding: spacing.lg },
  carouselFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  guideCard: { borderRadius: 32, overflow: 'hidden', elevation: 4 },
  guideImage: { width: '100%', height: 180 },
  guideOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.xl, flexDirection: 'row', alignItems: 'center' },
  playBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  ownerStatsRow: { flexDirection: 'row', marginBottom: spacing.xl },
  ownerStatCard: { padding: 20, borderRadius: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  emptyFleet: { padding: 30, borderRadius: 24, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  miniCard: { width: 120, marginRight: spacing.md, padding: 12, borderRadius: 20, alignItems: 'center' },
  miniThumb: { width: '100%', height: 80, borderRadius: 12 },
});

export default HomeDashboardScreen;
