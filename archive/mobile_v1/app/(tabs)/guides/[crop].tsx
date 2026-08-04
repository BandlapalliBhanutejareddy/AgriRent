import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../src/lib/api';
import { useThemeStore } from '../../../src/store/themeStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, CheckCircle2, Lightbulb, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Design System & Components
import { typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { FadeInImage } from '../../../src/components/FadeInImage';
import { PremiumButton } from '../../../src/components/PremiumButton';
import { EmptyState } from '../../../src/components/EmptyState';
import { ShimmerLine } from '../../../src/components/Shimmers';
import { useTranslation } from "react-i18next";

function CropGuideScreen() {
    const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { crop } = useLocalSearchParams();
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const { theme, isDarkMode } = useThemeStore();
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchGuide();
  }, [crop]);

  const fetchGuide = async () => {
    try {
      const response = await api.get('/guides');
      const cropGuides = response.data[crop as string] || [];
      cropGuides.sort((a: any, b: any) => a.stepOrder - b.stepOrder);
      setSteps(cropGuides);
    } catch (error) {
      console.log('Failed to fetch guide details');
    } finally {
      setLoading(false);
    }
  };

  const navigateStep = (direction: 'next' | 'prev') => {
    const toValue = direction === 'next' ? -50 : 50;
    
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: toValue, duration: 150, useNativeDriver: true })
    ]).start(() => {
      if (direction === 'next') {
        setCurrentStep(prev => Math.min(steps.length - 1, prev + 1));
      } else {
        setCurrentStep(prev => Math.max(0, prev - 1));
      }
      
      slideAnim.setValue(direction === 'next' ? 50 : -50);
      
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true })
      ]).start();
    });
  };

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}><ShimmerLine style={{ flex: 1 }} /></SafeAreaView>;

  if (steps.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
             <ArrowLeft size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
        <EmptyState 
            icon={<Search size={48} color={theme.textMuted} />}
            title={t('no_lessons_found')}
            subtitle={`We don't have a guide for ${crop} yet.`}
            buttonTitle="Back to Hub"
            onButtonPress={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const stepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
           <ArrowLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[typography.h3, { color: theme.text, textTransform: 'capitalize' }]}>{crop} {t('guide')}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
            <View style={styles.heroContainer}>
                <FadeInImage uri={stepData.imageUrl} style={styles.heroImage} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFillObject} />
                <View style={styles.progressBox}>
                    <Text style={styles.progressText}>{t('step')}{currentStep + 1} / {steps.length}</Text>
                </View>
            </View>
            
            <View style={styles.contentSection}>
                <Text style={[typography.hero, { color: theme.text, marginBottom: 12 }]}>{stepData.stepTitle}</Text>
                <Text style={[typography.body, { color: theme.textSecondary, lineHeight: 28, marginBottom: 32 }]}>
                    {stepData.description}
                </Text>
                
                <View style={[styles.tipBox, { backgroundColor: theme.primary + '05', borderColor: theme.primary + '15' }]}>
                    <View style={styles.tipHeader}>
                        <Lightbulb size={18} color={theme.primary} />
                        <Text style={[typography.title, { color: theme.primary, marginLeft: 10 }]}>{t('pro_tip')}</Text>
                    </View>
                    <Text style={[typography.bodySmall, { color: theme.text, marginTop: 8, lineHeight: 20 }]}>
                        {stepData.smartTip || 'Timing is critical. Plan your operations around the weather forecast.'}
                    </Text>
                </View>

                <View style={styles.toolkitSection}>
                    <Text style={[typography.label, { color: theme.textMuted, marginBottom: 16 }]}>{t('required_tool')}</Text>
                    <TouchableOpacity 
                        style={[styles.toolAction, { backgroundColor: theme.primary }]}
                        onPress={() => router.push({ pathname: '/(tabs)', params: { query: stepData.recommendedEquipment } })}
                    >
                        <Search size={18} color="#FFF" />
                        <Text style={styles.toolActionText}>{stepData.recommendedEquipment || 'Standard Tools'}</Text>
                        <ChevronRight size={18} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
      </ScrollView>

      {/* Simplified Navigation */}
      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.navBtn, { backgroundColor: theme.surface, opacity: currentStep === 0 ? 0.3 : 1 }]}
          onPress={() => currentStep > 0 && navigateStep('prev')}
          disabled={currentStep === 0}
        >
            <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.indicatorStrip}>
            {steps.map((_, idx) => (
                <View 
                    key={idx} 
                    style={[
                        styles.dot, 
                        { backgroundColor: idx === currentStep ? theme.primary : theme.border, width: idx === currentStep ? 24 : 8 }
                    ]} 
                />
            ))}
        </View>

        {currentStep === steps.length - 1 ? (
          <TouchableOpacity 
            style={[styles.finishBtn, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <CheckCircle2 size={20} color="#FFF" />
            <Text style={styles.finishBtnText}>{t('finish')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.navBtn, { backgroundColor: theme.primary }]}
            onPress={() => navigateStep('next')}
          >
            <ChevronRight size={24} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.screenHorizontal, paddingTop: spacing.md, marginBottom: spacing.xl },
  backBtn: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  scrollContent: { paddingBottom: 120 },
  heroContainer: { height: 350, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  progressBox: { position: 'absolute', top: 20, right: 28, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  progressText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  contentSection: { padding: 28, marginTop: -32, backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  tipBox: { padding: 20, borderRadius: 24, borderWidth: 1.5, marginBottom: 32 },
  tipHeader: { flexDirection: 'row', alignItems: 'center' },
  toolkitSection: { marginTop: spacing.xl },
  toolAction: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, gap: 12 },
  toolActionText: { flex: 1, color: '#FFF', fontSize: 15, fontWeight: '700' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28, borderTopWidth: 1 },
  navBtn: { width: 56, height: 56, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  indicatorStrip: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 6, borderRadius: 3 },
  finishBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, height: 56, borderRadius: 20, gap: 10 },
  finishBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});

export default CropGuideScreen;
