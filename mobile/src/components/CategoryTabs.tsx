import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface Category {
  id: string;
  label: string;
}

interface CategoryTabsProps {
  categories: Category[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
}

export const CategoryTabs = ({ categories, activeId, onSelect }: CategoryTabsProps) => {
  const { theme } = useThemeStore();

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      contentContainerStyle={styles.container}
    >
      {categories.map((item) => {
        const isActive = activeId === item.id || (item.id === 'ALL' && !activeId);
        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            style={[
              styles.chip,
              { 
                backgroundColor: isActive ? theme.primary : theme.card, 
                borderColor: isActive ? theme.primary : theme.border,
                opacity: isActive ? 1 : 0.8
              }
            ]}
            onPress={() => onSelect(item.id === 'ALL' ? null : item.id)}
          >
            <Text style={[
              styles.text, 
              { color: isActive ? '#FFF' : theme.textSecondary }
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingRight: spacing.xl,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
