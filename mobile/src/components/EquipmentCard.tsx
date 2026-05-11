import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { MapPin, Star } from 'lucide-react-native';
import { useThemeStore } from '../store/themeStore';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { FadeInImage } from './FadeInImage';

interface EquipmentCardProps {
  item: any;
  onPress: (id: string) => void;
}

export const EquipmentCard = ({ item, onPress }: EquipmentCardProps) => {
  const { theme } = useThemeStore();
  const { width } = useWindowDimensions();
  const cardWidth = width - (28 * 2); // Matching 28px screen margins

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          backgroundColor: theme.card, 
          shadowColor: theme.shadow,
          width: cardWidth
        }
      ]}
      activeOpacity={0.9}
      onPress={() => onPress(item.id)}
    >
      <View style={styles.imageContainer}>
        <FadeInImage 
          uri={item.imageUrl} 
          style={styles.image} 
        />
        <View style={styles.priceOverlay}>
          <Text style={styles.priceText}>₹{item.pricePerDay}</Text>
          <Text style={styles.priceUnit}>/day</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[typography.title, { color: theme.text, flex: 1, fontWeight: '800' }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.ratingBox}>
            <Star size={12} color="#F59E0B" fill="#F59E0B" />
            <Text style={[typography.meta, { color: theme.text, fontWeight: '800', marginLeft: 4 }]}>4.9</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.locationBox}>
            <MapPin size={12} color={theme.textMuted} />
            <Text style={[typography.caption, { color: theme.textSecondary, marginLeft: 4 }]} numberOfLines={1}>
              {item.location || 'Nashik'}
            </Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: theme.primary + '08' }]}>
            <Text style={[styles.categoryText, { color: theme.primary }]}>
              {item.category?.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 32,
    marginBottom: 32,
    overflow: 'hidden',
    elevation: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.01)',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 240, 
  },
  image: {
    width: '100%',
    height: '100%',
  },
  priceOverlay: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#121416', // Always dark for premium contrast
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  priceUnit: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginLeft: 2,
    fontWeight: '600',
  },
  content: {
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F610',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
