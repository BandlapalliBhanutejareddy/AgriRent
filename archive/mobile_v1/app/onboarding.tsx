import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Tractor, Bot, CloudSun } from 'lucide-react-native';
import { typography } from '../src/theme/typography';
import { useThemeStore } from '../src/store/themeStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Equipment Rental',
    description: 'Rent tractors, harvesters and farming tools near you with complete ease and security.',
    Icon: Tractor,
    color: '#059669', // Emerald 600
  },
  {
    id: '2',
    title: 'AI Farming Assistant',
    description: 'Get intelligent crop guidance, soil recommendations, and smart farming insights.',
    Icon: Bot,
    color: '#3B82F6', // Blue 500
  },
  {
    id: '3',
    title: 'Weather & Alerts',
    description: 'Receive real-time weather updates and automated smart farming alerts for your region.',
    Icon: CloudSun,
    color: '#F59E0B', // Amber 500
  },
];

export default function OnboardingScreen() {
    const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useThemeStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      await finishOnboarding();
    }
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await finishOnboarding();
  };

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace('/language');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Skip Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={[typography.label, { color: theme.textMuted }]}>{t('skip')}</Text>
        </TouchableOpacity>
      </View>

      {/* Carousel */}
      <Animated.ScrollView
        ref={flatListRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      >
        {SLIDES.map((slide, index) => {
          const Icon = slide.Icon;
          return (
            <View key={slide.id} style={[styles.slide, { width }]}>
              <View style={[styles.iconBox, { backgroundColor: slide.color + '15' }]}>
                <Icon size={100} color={slide.color} strokeWidth={1.5} />
              </View>
              <Text style={[typography.hero, styles.title, { color: theme.text }]}>
                {slide.title}
              </Text>
              <Text style={[typography.body, styles.description, { color: theme.textSecondary }]}>
                {slide.description}
              </Text>
            </View>
          );
        })}
      </Animated.ScrollView>

      {/* Footer (Dots & Button) */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, i) => {
            const opacity = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            const scale = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [0.8, 1.2, 0.8],
              extrapolate: 'clamp',
            });
            const widthAnim = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: theme.primary, opacity, transform: [{ scale }], width: widthAnim }
                ]}
              />
            );
          })}
        </View>

        {/* Next Button */}
        <TouchableOpacity 
          style={[styles.nextButton, { backgroundColor: theme.primary }]} 
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={[typography.button, { color: '#FFF' }]}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconBox: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextButton: {
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
