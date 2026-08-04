import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { api } from '../src/lib/api';
import { useThemeStore } from '../src/store/themeStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, ArrowLeft, MapPin } from 'lucide-react-native';

// Design System & Components
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';
import { FadeInImage } from '../src/components/FadeInImage';
import { EmptyState } from '../src/components/EmptyState';
import { ShimmerLine } from '../src/components/Shimmers';
import { useTranslation } from "react-i18next";

export default function SavedEquipmentScreen() {
    const { t } = useTranslation();
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { theme } = useThemeStore();
  const router = useRouter();

  useEffect(() => {
    fetchSaved();
  }, []);

  const fetchSaved = async () => {
    try {
      const response = await api.get('/saved');
      setSavedItems(response.data);
    } catch (error) {
      console.error('Failed to fetch saved items', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSaved();
  }, []);

  const renderItem = ({ item }: { item: any }) => {
    const eq = item.equipment;
    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
        activeOpacity={0.9}
        onPress={() => router.push(`/equipment/${eq.id}`)}
      >
        <View style={styles.imageContainer}>
            <FadeInImage uri={eq.imageUrl} style={styles.image} />
            <TouchableOpacity style={[styles.heartBtn, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
                <Heart size={14} color="#EF4444" fill="#EF4444" />
            </TouchableOpacity>
        </View>
        <View style={styles.contentContainer}>
          <Text style={[typography.title, { color: theme.text }]} numberOfLines={1}>{eq.name}</Text>
          <View style={styles.priceRow}>
            <Text style={[typography.title, { color: theme.primary }]}>₹{eq.pricePerDay}</Text>
            <Text style={[typography.caption, { color: theme.textSecondary }]}>{t('day')}</Text>
          </View>
          <View style={styles.locationRow}>
            <MapPin size={12} color={theme.textMuted} />
            <Text style={[typography.caption, { color: theme.textSecondary, marginLeft: 4 }]} numberOfLines={1}>
              {eq.location || 'Nashik'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ArrowLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[typography.h1, { color: theme.text }]}>{t('wishlist')}</Text>
        <View style={{ width: 48 }} />
      </View>

      {loading ? (
        <View style={styles.listContainer}>
          <View style={styles.skeletonRow}>
             <ShimmerLine style={{ flex: 1, height: 200, borderRadius: 24, marginRight: 12 }} />
             <ShimmerLine style={{ flex: 1, height: 200, borderRadius: 24 }} />
          </View>
        </View>
      ) : (
        <FlatList
          data={savedItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={
            <EmptyState 
              icon={<Heart size={48} color={theme.textMuted} />}
              title={t('nothing_saved_yet')}
              subtitle="Save equipment while browsing to find them here later."
              buttonTitle="Discover Equipment"
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.screenHorizontal, paddingTop: spacing.md, marginBottom: spacing.xl },
  backBtn: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  listContainer: { paddingHorizontal: spacing.screenHorizontal, paddingBottom: spacing.bottomSafe },
  columnWrapper: { justifyContent: 'space-between' },
  skeletonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { width: '48%', borderRadius: 24, marginBottom: spacing.lg, overflow: 'hidden', elevation: 4, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 140 },
  heartBtn: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  contentContainer: { padding: spacing.md },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4, marginBottom: 8, gap: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
});
