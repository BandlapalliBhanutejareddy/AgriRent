import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  TextInput 
} from 'react-native';
import { X, Check, MapPin, Tag, Banknote } from 'lucide-react-native';
import { useThemeStore } from '../store/themeStore';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { PremiumButton } from './PremiumButton';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: any;
  onApply: (newFilters: any) => void;
}

export const FilterModal = ({ visible, onClose, filters, onApply }: FilterModalProps) => {
  const { theme } = useThemeStore();
  const [localFilters, setLocalFilters] = useState(filters);

  const categories = ['All', 'Tractor', 'Harvester', 'Implement', 'Seeder', 'Other'];

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({
      category: 'All',
      minPrice: '',
      maxPrice: '',
      location: ''
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: theme.background }]}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[typography.h3, { color: theme.text }]}>Filters</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Category Section */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <Tag size={18} color={theme.primary} />
                <Text style={[typography.label, { color: theme.textSecondary, marginLeft: 8 }]}>CATEGORY</Text>
              </View>
              <View style={styles.chipRow}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setLocalFilters({ ...localFilters, category: cat })}
                    style={[
                      styles.chip,
                      { 
                        backgroundColor: localFilters.category === cat ? theme.primary : theme.surface,
                        borderColor: localFilters.category === cat ? theme.primary : theme.border
                      }
                    ]}
                  >
                    <Text style={[
                      styles.chipText,
                      { color: localFilters.category === cat ? '#FFF' : theme.text }
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Section */}
            <View style={styles.section}>
              <div className="flex items-center mb-4">
                <Banknote size={18} color={theme.primary} />
                <Text style={[typography.label, { color: theme.textSecondary, marginLeft: 8 }]}>PRICE RANGE (₹ / Day)</Text>
              </div>
              <View style={styles.row}>
                <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <TextInput
                    placeholder="Min"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.input, { color: theme.text }]}
                    keyboardType="numeric"
                    value={localFilters.minPrice}
                    onChangeText={(val) => setLocalFilters({ ...localFilters, minPrice: val })}
                  />
                </View>
                <View style={styles.divider} />
                <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <TextInput
                    placeholder="Max"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.input, { color: theme.text }]}
                    keyboardType="numeric"
                    value={localFilters.maxPrice}
                    onChangeText={(val) => setLocalFilters({ ...localFilters, maxPrice: val })}
                  />
                </View>
              </View>
            </View>

            {/* Location Section */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <MapPin size={18} color={theme.primary} />
                <Text style={[typography.label, { color: theme.textSecondary, marginLeft: 8 }]}>LOCATION</Text>
              </View>
              <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <TextInput
                  placeholder="e.g. Nashik"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.input, { color: theme.text }]}
                  value={localFilters.location}
                  onChangeText={(val) => setLocalFilters({ ...localFilters, location: val })}
                />
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
              <Text style={[typography.body, { color: theme.textMuted }]}>Reset All</Text>
            </TouchableOpacity>
            <PremiumButton
              title="Apply Filters"
              onPress={handleApply}
              style={{ flex: 1, marginLeft: 20 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '80%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 8,
  },
  scroll: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputBox: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    width: 12,
    height: 2,
    backgroundColor: '#CCC',
    marginHorizontal: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderTopWidth: 1,
  },
  resetBtn: {
    paddingVertical: 12,
  },
});
