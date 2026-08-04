import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { typography } from '../src/theme/typography';
import { useThemeStore } from '../src/store/themeStore';
import { Sprout } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from "react-i18next";

export default function SplashScreen() {
    const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useThemeStore();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    const checkState = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 2500)); // Show splash for 2.5s
        
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        const hasSelectedLanguage = await AsyncStorage.getItem('hasSelectedLanguage');
        
        if (!hasSeenOnboarding) {
          router.replace('/onboarding');
        } else if (!hasSelectedLanguage) {
          router.replace('/language');
        } else {
          router.replace('/auth-choice');
        }
      } catch (err) {
        router.replace('/auth-choice');
      }
    };

    checkState();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <Animated.View 
        style={[
          styles.content,
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.iconContainer}>
          <Sprout size={64} color={theme.primary} />
        </View>
        <Animated.Text style={[typography.hero, styles.title]}>
          {t('agrorent_ai')}</Animated.Text>
        <Animated.Text style={[typography.body, styles.tagline]}>
          {t('smart_farming_smarter_renting')}</Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 42,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
