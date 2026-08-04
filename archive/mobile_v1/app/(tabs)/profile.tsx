import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  Globe,
  CreditCard,
  Heart,
  FileText
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTranslation } from "react-i18next";

export default function ProfileScreen() {
    const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, isDarkMode, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/login');
          }
        }
      ]
    );
  };

  const SettingRow = ({ icon: Icon, label, onPress, value, type = 'link' }: any) => (
    <TouchableOpacity 
      style={[styles.row, { borderBottomColor: theme.border }]} 
      onPress={onPress}
      disabled={type === 'switch'}
    >
      <View style={[styles.iconBox, { backgroundColor: theme.surface }]}>
        <Icon size={20} color={theme.primary} />
      </View>
      <Text style={[typography.title, { color: theme.text, flex: 1, marginLeft: 16 }]}>{label}</Text>
      {type === 'link' && <ChevronRight size={20} color={theme.textMuted} />}
      {type === 'switch' && (
        <Switch 
          value={value} 
          onValueChange={onPress} 
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor="#FFF"
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Calm Hero Header */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: theme.primary + '15' }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>{user?.name?.charAt(0) || 'U'}</Text>
          </View>
          <Text style={[typography.h1, { color: theme.text, marginTop: 16 }]}>{user?.name || 'AgroRent User'}</Text>
          <Text style={[typography.body, { color: theme.textSecondary }]}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: theme.surface }]}>
            <Text style={[styles.roleText, { color: theme.primary }]}>{user?.role || 'FARMER'}</Text>
          </View>
        </View>

        {/* 1. ACCOUNT */}
        <View style={styles.section}>
          <Text style={[typography.label, { color: theme.textMuted, marginLeft: 28, marginBottom: 12 }]}>{t('account')}</Text>
          <View style={[styles.groupCard, { backgroundColor: theme.card }]}>
            <SettingRow 
              icon={Heart} 
              label={t('wishlist_saved')} 
              onPress={() => router.push('/saved')} 
            />
            <SettingRow 
              icon={CreditCard} 
              label={t('payments_history')} 
              onPress={() => Alert.alert('Payments', 'Payment details is linked to bookings state.')} 
            />
            <SettingRow 
              icon={Shield} 
              label={t('security_authentication')} 
              onPress={() => Alert.alert('Security', 'Your session is securely encrypted via AgroRent authentication.')} 
            />
          </View>
        </View>

        {/* 2. PREFERENCES */}
        <View style={styles.section}>
          <Text style={[typography.label, { color: theme.textMuted, marginLeft: 28, marginBottom: 12 }]}>{t('preferences')}</Text>
          <View style={[styles.groupCard, { backgroundColor: theme.card }]}>
            <SettingRow 
              icon={Settings} 
              label={t('dark_mode_accent')} 
              type="switch"
              value={isDarkMode}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleTheme();
              }}
            />
          </View>
        </View>

        {/* 3. LANGUAGE */}
        <View style={styles.section}>
          <Text style={[typography.label, { color: theme.textMuted, marginLeft: 28, marginBottom: 12 }]}>{t('language')}</Text>
          <View style={[styles.groupCard, { backgroundColor: theme.card }]}>
            <SettingRow 
              icon={Globe} 
              label={t('change_language_settings')} 
              onPress={() => router.push('/language')} 
            />
          </View>
        </View>

        {/* 4. NOTIFICATIONS */}
        <View style={styles.section}>
          <Text style={[typography.label, { color: theme.textMuted, marginLeft: 28, marginBottom: 12 }]}>{t('notifications')}</Text>
          <View style={[styles.groupCard, { backgroundColor: theme.card }]}>
            <SettingRow 
              icon={Bell} 
              label={t('notification_preferences')} 
              onPress={() => router.push('/notifications')} 
            />
          </View>
        </View>

        {/* 5. SUPPORT */}
        <View style={styles.section}>
          <Text style={[typography.label, { color: theme.textMuted, marginLeft: 28, marginBottom: 12 }]}>{t('support')}</Text>
          <View style={[styles.groupCard, { backgroundColor: theme.card }]}>
            <SettingRow 
              icon={HelpCircle} 
              label={t('help_support_desk')} 
              onPress={() => Alert.alert('Support Desk', 'Need assistance? Email support@agrorent.ai')} 
            />
          </View>
        </View>

        {/* 6. TERMS & PRIVACY */}
        <View style={styles.section}>
          <Text style={[typography.label, { color: theme.textMuted, marginLeft: 28, marginBottom: 12 }]}>{t('legal')}</Text>
          <View style={[styles.groupCard, { backgroundColor: theme.card }]}>
            <SettingRow 
              icon={FileText} 
              label={t('terms_privacy_guidelines')} 
              onPress={() => Alert.alert('Legal Guidelines', 'AgroRent AI platform ensures all rentals comply with localized safety policies.')} 
            />
            <SettingRow 
              icon={LogOut} 
              label={t('log_out_of_session')} 
              onPress={handleLogout} 
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[typography.caption, { color: theme.textMuted }]}>{t('agrorent_ai_v1_2_0')}</Text>
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingVertical: 36 },
  avatar: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, fontWeight: '800' },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginTop: 12 },
  roleText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  section: { marginBottom: 24 },
  groupCard: { marginHorizontal: 28, borderRadius: 28, overflow: 'hidden', elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  footer: { alignItems: 'center', paddingVertical: 32 },
});
