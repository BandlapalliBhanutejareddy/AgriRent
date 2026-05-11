import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { PremiumButton } from './PremiumButton';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  buttonTitle?: string;
  onButtonPress?: () => void;
}

export const EmptyState = ({
  icon,
  title,
  subtitle,
  buttonTitle,
  onButtonPress,
}: EmptyStateProps) => {
  const { theme } = useThemeStore();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: theme.primary + '08' }]}>
        {icon}
      </View>
      <Text style={[typography.h2, { color: theme.text, marginTop: spacing.xl, textAlign: 'center' }]}>
        {title}
      </Text>
      <Text style={[typography.body, { color: theme.textSecondary, marginTop: spacing.sm, textAlign: 'center', maxWidth: '80%' }]}>
        {subtitle}
      </Text>
      {buttonTitle && onButtonPress && (
        <PremiumButton
          title={buttonTitle}
          onPress={onButtonPress}
          variant="secondary"
          size="medium"
          style={{ marginTop: spacing.xl }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginTop: spacing.xxl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
