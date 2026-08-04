import React, { useEffect, useState } from 'react';
import { 
  useWindowDimensions, 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl 
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  CloudSun, 
  ArrowRight,
  Bell,
  MapPin,
  Star,
  Sparkles,
  Mic,
  Calendar,
  Tractor,
  Layers,
  Leaf,
  PlusCircle,
  TrendingUp,
  CircleDollarSign,
  TrendingDown,
  Info
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
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeDashboardScreen() {
  const { width } = useWindowDimensions();
  const { theme, isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const { bookings } = useBookingStore();
  const { equipmentList, setCategoryFilter } = useEquipmentStore();
  const { t } = useTranslation();
  const router = useRouter();
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState('Nashik, Maharashtra');
  const [weather, setWeather] = useState({
    temp: '30°C',
    condition: 'Loading weather...',
    tip: 'Fetching meteorological updates for Nashik...'
  });

  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cachedWeather = await AsyncStorage.getItem('agrorent_cached_weather');
        const cachedLocation = await AsyncStorage.getItem('agrorent_cached_location');
        if (cachedWeather) setWeather(JSON.parse(cachedWeather));
        if (cachedLocation) setLocationName(cachedLocation);
      } catch (err) {
        console.log('Failed to load cached weather data');
      }
    };
    loadCachedData();

    setTimeout(() => setLoading(false), 800);

    const fetchWeather = async () => {
      try {
        let lat = 20.0059; // Nashik fallback
        let lon = 73.7898; // Nashik fallback
        let cityName = 'Nashik, Maharashtra';

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          try {
            const loc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            lat = loc.coords.latitude;
            lon = loc.coords.longitude;

            const reverseGeocode = await Location.reverseGeocodeAsync({
              latitude: lat,
              longitude: lon,
            });
            if (reverseGeocode && reverseGeocode.length > 0) {
              const geo = reverseGeocode[0];
              cityName = `${geo.city || geo.district || 'My Location'}, ${geo.region || geo.country || ''}`;
            } else {
              cityName = 'My Location';
            }
          } catch (e) {
            console.log('Location acquisition error, using fallback');
          }
        }

        setLocationName(cityName);
        await AsyncStorage.setItem('agrorent_cached_location', cityName);

        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,rain,weather_code`);
        const data = await res.json();
        if (data && data.current) {
          const temp = Math.round(data.current.temperature_2m);
          const code = data.current.weather_code;
          
          let condition = 'Clear Skies';
          let tip = '☀️ Great weather for harvest and land leveling.';

          if (code >= 1 && code <= 3) {
            condition = 'Partly Cloudy';
            tip = '⛅ Good day for spraying fertilizer and pesticide.';
          } else if (code >= 51 && code <= 65) {
            condition = 'Showers / Rain';
            tip = '🌧️ Heavy showers. Postpone open sowing or dry harvest.';
          } else if (code >= 80 && code <= 99) {
            condition = 'Rain Showers / Storm';
            tip = '⛈️ Severe storms expected. Ensure safe indoor fleet storage.';
          }

          const weatherObj = {
            temp: `${temp}°C`,
            condition,
            tip
          };
          setWeather(weatherObj);
          await AsyncStorage.setItem('agrorent_cached_weather', JSON.stringify(weatherObj));
        }
      } catch (e) {
        console.log('Location or weather dynamic lookup failed.');
        const fallbackWeather = {
          temp: '32°C',
          condition: 'Partly Cloudy',
          tip: '⛅ Demo Weather Data (Chennai: Humidity 68%).'
        };
        setWeather(fallbackWeather);
        setLocationName('Chennai, TN');
      }
    };
    fetchWeather();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <HomeSkeleton />
      </SafeAreaView>
    );
  }

  const isOwner = user?.role === 'OWNER';
  const activeBooking = bookings.find(b => b.status === 'ACTIVE' || b.status === 'ACCEPTED');
  const featuredEquipment = equipmentList.slice(0, 6);

  const categories = [
    { id: 'TRACTOR', label: 'Tractors', icon: '🚜' },
    { id: 'HARVESTER', label: 'Harvesters', icon: '🌾' },
    { id: 'IRRIGATION', label: 'Irrigation', icon: '💧' },
    { id: 'IMPLEMENT', label: 'Implements', icon: '🚚' },
    { id: 'SEEDER', label: 'Others', icon: '🔧' },
  ];

  const handleCategoryPress = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategoryFilter(categoryId as any);
    router.push('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Welcome Header */}
        <View style={styles.header}>
          <View>
            <Text style={[typography.bodySmall, { color: theme.textSecondary }]}>
              {new Date().getHours() < 12 ? 'Good Morning,' : new Date().getHours() < 17 ? 'Good Afternoon,' : 'Good Evening,'}
            </Text>
            <Text style={[typography.h1, { color: theme.text }]}>
              {user?.name?.split(' ')[0] || (isOwner ? 'Owner' : 'Farmer')}
            </Text>
            <View style={styles.headerLocation}>
              <MapPin size={12} color={theme.primary} />
              <Text style={[typography.caption, { color: theme.textSecondary, marginLeft: 4 }]}>
                {locationName}
              </Text>
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

        {/* 2. Weather Card */}
        <LinearGradient
          colors={isDarkMode ? ['#1e293b', '#0f172a'] : ['#15803D', '#166534']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.weatherCard}
        >
          <View style={styles.weatherInfo}>
            <Text style={[typography.hero, { color: '#FFF', fontSize: 32 }]}>{weather.temp}</Text>
            <Text style={[typography.title, { color: '#FFF', marginTop: 4 }]}>{weather.condition}</Text>
            <Text style={[typography.caption, { color: 'rgba(255,255,255,0.8)', marginTop: 4 }]}>
              {weather.tip}
            </Text>
          </View>
          <CloudSun size={64} color="#FFF" opacity={0.3} strokeWidth={1.5} />
        </LinearGradient>

        {/* 3. Quick Actions Grid */}
        <View style={styles.section}>
          <Text style={[typography.h2, { color: theme.text, marginBottom: 16 }]}>{t('quick_actions')}</Text>
          {isOwner ? (
            /* OWNER Actions */
            <View style={styles.grid}>
              <TouchableOpacity 
                style={[styles.gridItem, { backgroundColor: theme.card }]}
                onPress={() => router.push('/owner/dashboard')}
              >
                <TrendingUp size={24} color={theme.primary} />
                <Text style={[typography.label, { color: theme.text, marginTop: 8 }]}>{t('earnings')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.gridItem, { backgroundColor: theme.card }]}
                onPress={() => router.push('/owner/add-equipment')}
              >
                <PlusCircle size={24} color={theme.primary} />
                <Text style={[typography.label, { color: theme.text, marginTop: 8 }]}>{t('list_unit')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.gridItem, { backgroundColor: theme.card }]}
                onPress={() => router.push('/bookings')}
              >
                <Calendar size={24} color={theme.primary} />
                <Text style={[typography.label, { color: theme.text, marginTop: 8 }]}>{t('rentals')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.gridItem, { backgroundColor: theme.card }]}
                onPress={() => router.push('/(tabs)/guides')}
              >
                <Leaf size={24} color={theme.primary} />
                <Text style={[typography.label, { color: theme.text, marginTop: 8 }]}>{t('guides')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* FARMER Actions */
            <View style={styles.grid}>
              <TouchableOpacity 
                style={[styles.gridItem, { backgroundColor: theme.card }]}
                onPress={() => {
                  setCategoryFilter('ALL');
                  router.push('/(tabs)');
                }}
              >
                <Tractor size={24} color={theme.primary} />
                <Text style={[typography.label, { color: theme.text, marginTop: 8 }]}>{t('rent_tools')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.gridItem, { backgroundColor: theme.card }]}
                onPress={() => router.push('/bookings')}
              >
                <Calendar size={24} color={theme.primary} />
                <Text style={[typography.label, { color: theme.text, marginTop: 8 }]}>{t('bookings')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.gridItem, { backgroundColor: theme.card }]}
                onPress={() => router.push('/(tabs)/guides')}
              >
                <Leaf size={24} color={theme.primary} />
                <Text style={[typography.label, { color: theme.text, marginTop: 8 }]}>{t('guides')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.gridItem, { backgroundColor: theme.card }]}
                onPress={() => router.push('/(tabs)')}
              >
                <Layers size={24} color={theme.primary} />
                <Text style={[typography.label, { color: theme.text, marginTop: 8 }]}>{t('marketplace')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 4. AI Assistant Card */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.aiCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/advisor')}
            activeOpacity={0.9}
          >
            <View style={[styles.aiIconCircle, { backgroundColor: theme.primary + '15' }]}>
              <Sparkles size={24} color={theme.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[typography.title, { color: theme.text }]}>{t('smart_ai_advisor')}</Text>
              <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 4 }]}>
                {t('ask_farming_tips_or_get_instant_equipmen')}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.micBtn, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/advisor')}
            >
              <Mic size={18} color="#FFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* 5. Categories Grid / Row */}
        <View style={styles.section}>
          <Text style={[typography.h2, { color: theme.text, marginBottom: 16 }]}>{t('categories')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => handleCategoryPress(cat.id)}
              >
                <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                <Text style={[typography.label, { color: theme.text, marginLeft: 8 }]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 6. Featured Equipment Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[typography.h2, { color: theme.text }]}>{t('featured_equipment')}</Text>
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
            {featuredEquipment.map((item, idx) => (
              <TouchableOpacity 
                key={item.id || idx}
                activeOpacity={0.9}
                style={[styles.carouselCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
                onPress={() => router.push(`/equipment/${item.id}`)}
              >
                <FadeInImage uri={item.imageUrl} style={styles.carouselImage} />
                <View style={styles.carouselContent}>
                  <Text style={[typography.title, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                  <View style={styles.carouselFooter}>
                    <Text style={[typography.title, { color: theme.primary, fontSize: 14 }]}>₹{item.pricePerDay}{t('d')}</Text>
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

        {/* Active Booking Reminder overlay */}
        {activeBooking && (
          <View style={styles.section}>
            <Text style={[typography.h2, { color: theme.text, marginBottom: 12 }]}>{t('current_rental')}</Text>
            <TouchableOpacity 
              style={[styles.activeCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
              activeOpacity={0.9}
              onPress={() => router.push('/(tabs)/bookings')}
            >
              <FadeInImage uri={activeBooking.equipment?.imageUrl} style={styles.activeThumb} />
              <View style={styles.activeContent}>
                <Text style={[typography.title, { color: theme.text }]} numberOfLines={1}>{activeBooking.equipment?.title}</Text>
                <Text style={[typography.caption, { color: theme.success, fontWeight: '800', marginTop: 2 }]}>{activeBooking.status}</Text>
              </View>
              <ArrowRight size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* 7. Daily Farming Tips Section */}
        <View style={styles.section}>
          <Text style={[typography.h2, { color: theme.text, marginBottom: 16 }]}>{t('daily_farming_tips')}</Text>
          <View style={[styles.tipCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.tipIconBox, { backgroundColor: theme.primary + '15' }]}>
              <Info size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[typography.title, { color: theme.text, fontSize: 15 }]}>{t('pest_warning_irrigation')}</Text>
              <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: 4, lineHeight: 20 }]}>
                {t('ensure_correct_soil_moisture_levels_duri')}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 28, paddingTop: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerLocation: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  notificationBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  notifBadge: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: '#FFF' },
  weatherCard: { padding: 24, borderRadius: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  weatherInfo: { flex: 1, marginRight: 16 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  grid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  gridItem: { width: '47%', padding: 18, borderRadius: 24, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 6 },
  aiCard: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 28, borderWidth: 1.5 },
  aiIconCircle: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  micBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  categoryRow: { gap: 12, paddingRight: 24 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1.5 },
  carouselContainer: { paddingRight: 28 },
  carouselCard: { width: 220, marginRight: 16, borderRadius: 28, overflow: 'hidden', elevation: 2, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
  carouselImage: { width: '100%', height: 130 },
  carouselContent: { padding: 16 },
  carouselFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  activeCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, elevation: 2 },
  activeThumb: { width: 50, height: 50, borderRadius: 12 },
  activeContent: { flex: 1, marginLeft: 16 },
  tipCard: { flexDirection: 'row', padding: 20, borderRadius: 28, borderWidth: 1.5 },
  tipIconBox: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});
