import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle, 
  Animated,
  Platform 
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeStore } from '../store/themeStore';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'large' | 'medium' | 'small';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PremiumButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}: PremiumButtonProps) => {
  const { theme } = useThemeStore();
  const animatedScale = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(animatedScale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animatedScale, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!loading && !disabled) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress();
    }
  };

  const getBackgroundColor = () => {
    if (disabled) return theme.border;
    switch (variant) {
      case 'primary': return theme.primary;
      case 'secondary': return theme.primaryLight;
      case 'outline':
      case 'ghost': return 'transparent';
      default: return theme.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.textMuted;
    switch (variant) {
      case 'primary': return '#FFFFFF';
      case 'secondary':
      case 'ghost':
      case 'outline': return theme.primary;
      default: return '#FFFFFF';
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: animatedScale }] }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || loading}
        style={[
          styles.base,
          styles[size],
          { 
            backgroundColor: getBackgroundColor(),
            borderColor: variant === 'outline' ? theme.primary : 'transparent',
            borderWidth: variant === 'outline' ? 1.5 : 0,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={getTextColor()} size="small" />
        ) : (
          <>
            {icon && icon}
            <Text style={[
              styles.text,
              { color: getTextColor() },
              size === 'large' ? typography.title : typography.bodySmall,
              textStyle
            ]}>
              {title}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  large: {
    height: 58,
    paddingHorizontal: 28,
  },
  medium: {
    height: 48,
    paddingHorizontal: 22,
  },
  small: {
    height: 38,
    paddingHorizontal: 18,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
