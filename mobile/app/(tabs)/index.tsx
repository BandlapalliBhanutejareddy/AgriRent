import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SlidersHorizontal, MapPin, Search as SearchIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

// Design System & Components
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { useThemeStore } from '../../src/store/themeStore';
import { useEquipmentStore } from '../../src/store/equipmentStore';
import { api } from '../../src/lib/api';
import { EquipmentCardSkeleton } from '../../src/components/Shimmers';
import { EmptyState } from '../../src/components/EmptyState';
import { EquipmentCard } from '../../src/components/EquipmentCard';
import { SearchBar } from '../../src/components/SearchBar';
import { CategoryTabs } from '../../src/components/CategoryTabs';

import { FilterModal } from '../../src/components/FilterModal';

const CATEGORIES = [
  { id: 'ALL', label: 'All' },
  { id: 'TRACTOR', label: 'Tractors' },
  { id: 'HARVESTER', label: 'Harvesters' },
  { id: 'IMPLEMENT', label: 'Implements' },
  { id: 'SEEDER', label: 'Seeders' },
  { id: 'IRRIGATION', label: 'Irrigation' },
];

function MarketplaceScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useThemeStore();
  const { 
    equipmentList, 
    setEquipmentList, 
    searchQuery, 
    setSearchQuery, 
    categoryFilter, 
    setCategoryFilter 
  } = useEquipmentStore();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [filterVisible, setFilterVisible] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    category: 'All',
    minPrice: '',
    maxPrice: '',
    location: ''
  });

  useEffect(() => {
    fetchEquipment();
  }, []);

  // Debounce search query update
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const fetchEquipment = async () => {
    try {
      const response = await api.get('/equipment');
      setEquipmentList(response.data);
    } catch (error) {
      console.error('Failed to fetch equipment', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEquipment();
  }, []);

  const filteredEquipment = equipmentList.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter && categoryFilter !== 'ALL' ? item.category === categoryFilter : 
                           (advancedFilters.category !== 'All' ? item.category.toUpperCase() === advancedFilters.category.toUpperCase() : true);
    
    const matchesMinPrice = advancedFilters.minPrice ? item.pricePerDay >= parseFloat(advancedFilters.minPrice) : true;
    const matchesMaxPrice = advancedFilters.maxPrice ? item.pricePerDay <= parseFloat(advancedFilters.maxPrice) : true;
    const matchesLocation = advancedFilters.location ? item.location?.toLowerCase().includes(advancedFilters.location.toLowerCase()) : true;

    return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesLocation;
  });

  const handleApplyFilters = (newFilters: any) => {
    setAdvancedFilters(newFilters);
    if (newFilters.category !== 'All') {
      setCategoryFilter(newFilters.category.toUpperCase() as any);
    } else {
      setCategoryFilter('ALL');
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View>
          <Text style={[typography.h1, { color: theme.text }]}>Marketplace</Text>
          <View style={styles.locationRow}>
            <MapPin size={12} color={theme.primary} />
            <Text style={[typography.caption, { color: theme.textSecondary, marginLeft: 4 }]}>
              Available in Nashik
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.filterBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => setFilterVisible(true)}
        >
          <SlidersHorizontal size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrapper}>
        <SearchBar 
            value={localSearch}
            onChangeText={setLocalSearch}
            onClear={() => setLocalSearch('')}
        />
      </View>

      <View style={styles.categoryContainer}>
        <CategoryTabs 
          categories={CATEGORIES}
          activeId={categoryFilter || 'ALL'}
          onSelect={(id) => {
            setCategoryFilter(id as any);
            setAdvancedFilters(prev => ({ ...prev, category: id === 'ALL' ? 'All' : id.charAt(0) + id.slice(1).toLowerCase() }));
          }}
        />
      </View>

      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        filters={advancedFilters}
        onApply={handleApplyFilters}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <FlatList
        data={filteredEquipment}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EquipmentCard 
            item={item} 
            onPress={(id) => router.push(`/equipment/${id}`)} 
          />
        )}
        ListHeaderComponent={renderHeader()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListEmptyComponent={
          loading ? (
            <View style={{ padding: spacing.xl }}>
              <EquipmentCardSkeleton />
              <EquipmentCardSkeleton />
            </View>
          ) : (
            <EmptyState 
              icon={<SearchIcon size={40} color={theme.textMuted} />}
              title="No results found"
              subtitle="Try adjusting your filters to find equipment."
              buttonTitle="Reset Filters"
              onButtonPress={() => {
                setLocalSearch('');
                setSearchQuery('');
                setCategoryFilter(null);
              }}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.screenHorizontal, paddingTop: spacing.xl },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  filterBtn: { width: 52, height: 52, borderRadius: 18, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  searchWrapper: { marginBottom: spacing.lg },
  categoryContainer: { marginBottom: spacing.sectionGap },
  listContainer: { paddingBottom: spacing.bottomSafe },
});

export default MarketplaceScreen;
