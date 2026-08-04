import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../../src/lib/api';
import { useThemeStore } from '../../../src/store/themeStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Play, Lightbulb, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Design System & Components
import { typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { FadeInImage } from '../../../src/components/FadeInImage';
import { HomeSkeleton } from '../../../src/components/Shimmers';
import { useTranslation } from "react-i18next";

const CROPS = [
  { id: 'Rice', name: 'Rice', image: 'https://images.unsplash.com/photo-1536657235019-03071263842a?q=80&w=400&fit=crop', steps: 3 },
  { id: 'Potato', name: 'Potato', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=400&fit=crop', steps: 2 },
  { id: 'Wheat', name: 'Wheat', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=400&fit=crop', steps: 5 },
  { id: 'Tomato', name: 'Tomato', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=400&fit=crop', steps: 6 },
  { id: 'Corn', name: 'Corn', image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?q=80&w=400&fit=crop', steps: 4 },
  { id: 'Cotton', name: 'Cotton', image: 'https://images.unsplash.com/photo-1592982537447-6f2b6e1b7823?q=80&w=400&fit=crop', steps: 7 },
];

function GuidesHubScreen() {
    const { t } = useTranslation();
  const [techniques, setTechniques] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { theme, isDarkMode } = useThemeStore();
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const techRes = await api.get('/guides/techniques');
      setTechniques(techRes.data);
    } catch (error) {
      console.log('Failed to fetch guides');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}><HomeSkeleton /></SafeAreaView>;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ArrowLeft size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[typography.h1, { color: theme.text }]}>{t('learning')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Immersive Featured Lesson */}
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.featuredCard, { backgroundColor: theme.card }]}
            onPress={() => techniques.length > 0 && router.push(`/(tabs)/guides/techniques`)}
          >
            <FadeInImage
              uri={techniques[0]?.imageUrl || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=800&fit=crop'}
              style={styles.featuredImage}
            />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.featuredOverlay}
            >
                <View style={styles.featuredContent}>
                    <View style={styles.playBadge}>
                        <Play size={12} color="#FFF" fill="#FFF" />
                        <Text style={styles.playText}>{t('watch_lesson')}</Text>
                    </View>
                    <Text style={[typography.h2, { color: '#FFF', marginTop: 12 }]}>{techniques[0]?.title || 'Precision Irrigation'}</Text>
                </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Premium Grid */}
        <View style={styles.section}>
          <Text style={[typography.h2, { color: theme.text, marginBottom: spacing.xl }]}>{t('masterclasses')}</Text>
          <View style={styles.grid}>
            {CROPS.map((crop) => (
              <TouchableOpacity
                key={crop.id}
                style={[styles.cropCard, { backgroundColor: theme.card }]}
                activeOpacity={0.9}
                onPress={() => router.push(`/(tabs)/guides/${crop.id}`)}
              >
                <FadeInImage uri={crop.image} style={styles.cropImage} />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.85)']}
                  style={styles.cropOverlay}
                >
                  <Text style={[typography.title, { color: '#FFF', fontSize: 15 }]}>{crop.name}</Text>
                  <Text style={styles.lessonCount}>{crop.steps} {t('steps')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Clean Shortcut */}
        <TouchableOpacity 
            style={[styles.aiShortcut, { backgroundColor: isDarkMode ? '#1A1C1E' : '#F0FDF4', borderColor: isDarkMode ? theme.border : '#DCFCE7' }]}
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/ai-advisor')}
        >
            <View style={[styles.aiIcon, { backgroundColor: theme.primary }]}>
                <Lightbulb size={24} color="#FFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={[typography.title, { color: theme.text }]}>{t('ai_advisor')}</Text>
                <Text style={[typography.caption, { color: theme.textSecondary }]}>{t('personalized_tools_for_your_farm')}</Text>
            </View>
            <ChevronRight size={20} color={theme.textMuted} />
        </TouchableOpacity>

        <View style={{ height: spacing.bottomSafe }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.screenHorizontal, paddingTop: spacing.md, marginBottom: spacing.xl },
  backBtn: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  scrollContent: { paddingHorizontal: spacing.screenHorizontal },
  section: { marginBottom: spacing.sectionGap },
  
  featuredCard: { height: 260, borderRadius: 32, overflow: 'hidden', elevation: 4 },
  featuredImage: { width: '100%', height: '100%' },
  featuredOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', justifyContent: 'flex-end', padding: spacing.xl },
  featuredContent: {},
  playBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  playText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cropCard: { width: '48%', height: 180, borderRadius: 24, marginBottom: 16, overflow: 'hidden', elevation: 2 },
  cropImage: { width: '100%', height: '100%' },
  cropOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', padding: 16, justifyContent: 'flex-end' },
  lessonCount: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', marginTop: 2 },

  aiShortcut: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 28, borderWidth: 1.5, marginTop: spacing.md },
  aiIcon: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
});

export default GuidesHubScreen;
