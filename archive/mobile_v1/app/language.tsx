import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguageStore, SupportedLanguage } from '../src/store/languageStore';
import { useThemeStore } from '../src/store/themeStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Languages, ChevronRight, Check, Globe } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Design System
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';
import { useTranslation } from "react-i18next";

const LANGUAGES: { id: SupportedLanguage; label: string; native: string }[] = [
  { id: 'en', label: 'English', native: 'English' },
  { id: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { id: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { id: 'te', label: 'Telugu', native: 'తెలుగు' },
  { id: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { id: 'ml', label: 'Malayalam (Coming Soon)', native: 'മലയാളം' },
  { id: 'mr', label: 'Marathi (Coming Soon)', native: 'मराठी' },
  { id: 'bn', label: 'Bengali (Coming Soon)', native: 'বাংলা' },
  { id: 'gu', label: 'Gujarati (Coming Soon)', native: 'ગુજરાતી' },
  { id: 'pa', label: 'Punjabi (Coming Soon)', native: 'ਪੰਜਾਬੀ' },
  { id: 'or', label: 'Odia (Coming Soon)', native: 'ଓଡ଼ିଆ' },
];

export default function LanguageSelectionScreen() {
    const { t } = useTranslation();
  const router = useRouter();
  const { setLanguage, language } = useLanguageStore();
  const { theme, isDarkMode } = useThemeStore();

  const handleSelect = async (lang: SupportedLanguage) => {
    setLanguage(lang);
    await AsyncStorage.setItem('hasSelectedLanguage', 'true');
    router.push('/auth-choice');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <LinearGradient
        colors={isDarkMode ? ['#1A1C1E', theme.background] : [theme.primary + '08', theme.background]}
        style={styles.header}
      >
        <View style={[styles.logoBox, { backgroundColor: theme.primary + '15' }]}>
            <Globe color={theme.primary} size={40} />
        </View>
        <Text style={[typography.hero, { color: theme.text, marginTop: spacing.xl }]}>{t('agrorent_ai')}</Text>
        <Text style={[typography.body, { color: theme.textSecondary, textAlign: 'center', marginTop: 8, maxWidth: '80%' }]}>
            {t('choose_your_language_to_start_your_journ')}</Text>
      </LinearGradient>

      <FlatList
        data={LANGUAGES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = language === item.id;
          return (
            <TouchableOpacity
                style={[
                    styles.langCard, 
                    { 
                        backgroundColor: theme.card, 
                        borderColor: isSelected ? theme.primary : theme.border,
                        shadowColor: theme.shadow 
                    }
                ]}
                onPress={() => {
                  if (!item.label.includes('Coming Soon')) {
                    handleSelect(item.id);
                  }
                }}
                activeOpacity={item.label.includes('Coming Soon') ? 1 : 0.8}
            >
                <View style={styles.langLeft}>
                    <View style={[styles.statusDot, { backgroundColor: isSelected ? theme.primary : theme.border }]} />
                    <View style={{ opacity: item.label.includes('Coming Soon') ? 0.4 : 1 }}>
                        <Text style={[typography.title, { color: theme.text, fontWeight: '700' }]}>{item.label}</Text>
                        <Text style={[typography.caption, { color: theme.textMuted }]}>{item.native}</Text>
                    </View>
                </View>
                {isSelected ? (
                    <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]}>
                        <Check size={14} color="#FFF" />
                    </View>
                ) : (
                    <ChevronRight color={theme.textMuted} size={20} />
                )}
            </TouchableOpacity>
          );
        }}
      />
      
      <View style={styles.footer}>
        <Text style={[typography.label, { color: theme.textMuted }]}>
            {t('secure_access_multilingual_support')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: spacing.xl },
  logoBox: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: spacing.screenHorizontal, paddingBottom: 40 },
  langCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 20, 
    borderRadius: 24, 
    borderWidth: 1.5, 
    marginBottom: 16, 
    elevation: 4, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 10 
  },
  langLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  activeIndicator: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  footer: { padding: 32, alignItems: 'center' },
});
