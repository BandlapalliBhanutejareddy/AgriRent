import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../src/store/themeStore';
import { typography } from '../src/theme/typography';
import { ArrowRight, User } from 'lucide-react-native';
import { useAuthStore } from '../src/store/authStore';
import * as Haptics from 'expo-haptics';
import { useTranslation } from "react-i18next";

export default function AuthChoiceScreen() {
    const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useThemeStore();
  const { setGuestMode } = useAuthStore();

  const handleGuest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGuestMode(true);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.logoPlaceholder}>
          <Text style={{ fontSize: 64 }}>🚜</Text>
        </View>
        <Text style={[typography.hero, { color: theme.text, marginTop: 24, textAlign: 'center' }]}>
          {t('welcome_to_agrorent_ai')}</Text>
        <Text style={[typography.body, { color: theme.textSecondary, textAlign: 'center', marginTop: 12, paddingHorizontal: 32 }]}>
          {t('join_thousands_of_farmers_renting_equipm')}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/login')}
          activeOpacity={0.8}
        >
          <Text style={[typography.button, { color: '#FFF' }]}>{t('login_to_account')}</Text>
          <ArrowRight color="#FFF" size={20} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.secondaryButton, { borderColor: theme.border, backgroundColor: theme.card }]}
          onPress={() => router.push('/register')}
          activeOpacity={0.8}
        >
          <Text style={[typography.button, { color: theme.text }]}>{t('create_new_account')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.guestButton}
          onPress={handleGuest}
          activeOpacity={0.6}
        >
          <User color={theme.textMuted} size={16} />
          <Text style={[typography.label, { color: theme.textMuted, marginLeft: 8 }]}>
            {t('continue_as_guest')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
});
