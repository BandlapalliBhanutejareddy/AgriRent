import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { spacing } from '../theme/spacing';

interface ShimmerProps {
  style?: any;
}

export const ShimmerLine: React.FC<ShimmerProps> = ({ style }) => {
  const { theme } = useThemeStore();
  const animValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(animValue, { toValue: 0.3, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, [animValue]);

  return (
    <Animated.View style={[style, { backgroundColor: theme.shimmer, opacity: animValue, borderRadius: spacing.borderRadiusSm }]} />
  );
};

export const EquipmentCardSkeleton = () => {
  const { theme } = useThemeStore();
  return (
    <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
      <ShimmerLine style={styles.image} />
      <View style={styles.content}>
        <ShimmerLine style={{ width: '60%', height: 24, marginBottom: spacing.sm }} />
        <ShimmerLine style={{ width: '40%', height: 16, marginBottom: spacing.md }} />
        <View style={styles.ownerRow}>
          <ShimmerLine style={{ width: 24, height: 24, borderRadius: 12, marginRight: spacing.sm }} />
          <ShimmerLine style={{ width: '30%', height: 14 }} />
        </View>
      </View>
    </View>
  );
};

export const BookingCardSkeleton = () => {
  const { theme } = useThemeStore();
  return (
    <View style={[styles.bookingCard, { backgroundColor: theme.card }]}>
      <View style={styles.row}>
        <ShimmerLine style={{ width: '50%', height: 20 }} />
        <ShimmerLine style={{ width: '20%', height: 24, borderRadius: 12 }} />
      </View>
      <ShimmerLine style={{ width: '70%', height: 16, marginTop: spacing.md }} />
      <ShimmerLine style={{ width: '40%', height: 16, marginTop: spacing.sm }} />
      <ShimmerLine style={{ width: '100%', height: 48, borderRadius: spacing.borderRadiusMd, marginTop: spacing.lg }} />
    </View>
  );
};

export const HomeSkeleton = () => {
  const { theme } = useThemeStore();
  return (
    <View style={{ padding: spacing.screenHorizontal }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg }}>
        <View>
          <ShimmerLine style={{ width: 100, height: 16, marginBottom: 8 }} />
          <ShimmerLine style={{ width: 150, height: 32 }} />
        </View>
        <ShimmerLine style={{ width: 44, height: 44, borderRadius: 22 }} />
      </View>
      <ShimmerLine style={{ width: '100%', height: 160, borderRadius: spacing.borderRadiusLg, marginBottom: spacing.xl }} />
      <ShimmerLine style={{ width: 120, height: 24, marginBottom: spacing.md }} />
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <ShimmerLine style={{ width: 280, height: 180, borderRadius: spacing.borderRadiusMd }} />
        <ShimmerLine style={{ width: 280, height: 180, borderRadius: spacing.borderRadiusMd }} />
      </View>
    </View>
  );
};

export const ProfileSkeleton = () => {
  const { theme } = useThemeStore();
  return (
    <View style={{ padding: spacing.screenHorizontal, alignItems: 'center' }}>
      <ShimmerLine style={{ width: 100, height: 100, borderRadius: 50, marginBottom: spacing.md }} />
      <ShimmerLine style={{ width: 180, height: 28, marginBottom: spacing.sm }} />
      <ShimmerLine style={{ width: 140, height: 16, marginBottom: spacing.xl }} />
      <View style={{ width: '100%', gap: spacing.md }}>
        {[1, 2, 3, 4].map(i => (
          <ShimmerLine key={i} style={{ width: '100%', height: 60, borderRadius: spacing.borderRadiusMd }} />
        ))}
      </View>
    </View>
  );
};

export const GuidesSkeleton = () => {
  const { theme } = useThemeStore();
  return (
    <View style={{ padding: spacing.screenHorizontal }}>
      <ShimmerLine style={{ width: 140, height: 32, marginBottom: spacing.xl }} />
      <View style={{ gap: spacing.lg }}>
        {[1, 2, 3].map(i => (
          <View key={i} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
            <ShimmerLine style={{ width: 80, height: 80, borderRadius: spacing.borderRadiusSm }} />
            <View style={{ flex: 1 }}>
              <ShimmerLine style={{ width: '70%', height: 20, marginBottom: 8 }} />
              <ShimmerLine style={{ width: '90%', height: 14 }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: spacing.borderRadiusMd,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 0,
  },
  content: {
    padding: spacing.md,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  bookingCard: {
    borderRadius: spacing.borderRadiusMd,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  }
});
