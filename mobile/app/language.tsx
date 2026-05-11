import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguageStore, SupportedLanguage } from '../src/store/languageStore';
import { useThemeStore } from '../src/store/themeStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Languages, ChevronRight, Check, Globe } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Design System
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';

const LANGUAGES: { id: SupportedLanguage; label: string; native: string }[] = [
  { id: 'en', label: 'English', native: 'English' },
  { id: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { id: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { id: 'te', label: 'Telugu', native: 'తెలుగు' },
  { id: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
];

export default function LanguageSelectionScreen() {
  const router = useRouter();
  const { setLanguage, language } = useLanguageStore();
  const { theme, isDarkMode } = useThemeStore();

  const handleSelect = (lang: SupportedLanguage) => {
    setLanguage(lang);
    router.push('/login');
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
        <Text style={[typography.hero, { color: theme.text, marginTop: spacing.xl }]}>AgroRent AI</Text>
        <Text style={[typography.body, { color: theme.textSecondary, textAlign: 'center', marginTop: 8, maxWidth: '80%' }]}>
            Choose your language to start your journey
        </Text>
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
                onPress={() => handleSelect(item.id)}
                activeOpacity={0.8}
            >
                <View style={styles.langLeft}>
                    <View style={[styles.statusDot, { backgroundColor: isSelected ? theme.primary : theme.border }]} />
                    <View>
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
            SECURE ACCESS • MULTILINGUAL SUPPORT
        </Text>
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
