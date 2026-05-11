import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
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
  Heart
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore } from '../../src/store/themeStore';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, isDarkMode, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    logout();
    router.replace('/login');
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
            <Text style={[typography.h1, { color: theme.text, marginTop: 16 }]}>{user?.name || 'User'}</Text>
            <Text style={[typography.body, { color: theme.textSecondary }]}>{user?.email}</Text>
            <View style={[styles.roleBadge, { backgroundColor: theme.surface }]}>
                <Text style={[styles.roleText, { color: theme.primary }]}>{user?.role || 'FARMER'}</Text>
            </View>
        </View>

        {/* Grouped Settings Sections */}
        <View style={styles.section}>
            <Text style={[typography.label, { color: theme.textMuted, marginLeft: spacing.screenHorizontal, marginBottom: 12 }]}>PREFERENCES</Text>
            <View style={[styles.groupCard, { backgroundColor: theme.card }]}>
                <SettingRow 
                    icon={Bell} 
                    label="Notifications" 
                    onPress={() => router.push('/notifications')} 
                />
                <SettingRow 
                    icon={Globe} 
                    label="Language" 
                    onPress={() => router.push('/language')} 
                />
                <SettingRow 
                    icon={Settings} 
                    label="Dark Mode" 
                    type="switch"
                    value={isDarkMode}
                    onPress={toggleTheme}
                />
            </View>
        </View>

        <View style={styles.section}>
            <Text style={[typography.label, { color: theme.textMuted, marginLeft: spacing.screenHorizontal, marginBottom: 12 }]}>ACCOUNT</Text>
            <View style={[styles.groupCard, { backgroundColor: theme.card }]}>
                <SettingRow 
                    icon={Heart} 
                    label="Wishlist" 
                    onPress={() => router.push('/saved')} 
                />
                <SettingRow 
                    icon={CreditCard} 
                    label="Payments" 
                    onPress={() => {}} 
                />
                <SettingRow 
                    icon={Shield} 
                    label="Security" 
                    onPress={() => {}} 
                />
            </View>
        </View>

        <View style={styles.section}>
            <View style={[styles.groupCard, { backgroundColor: theme.card }]}>
                <SettingRow 
                    icon={HelpCircle} 
                    label="Support" 
                    onPress={() => {}} 
                />
                <SettingRow 
                    icon={LogOut} 
                    label="Logout" 
                    onPress={handleLogout} 
                />
            </View>
        </View>

        <View style={styles.footer}>
            <Text style={[typography.caption, { color: theme.textMuted }]}>AgroRent AI v1.2.0</Text>
        </View>
        
        <View style={{ height: spacing.bottomSafe }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingVertical: 40 },
  avatar: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, fontWeight: '800' },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginTop: 12 },
  roleText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  section: { marginBottom: spacing.xl },
  groupCard: { marginHorizontal: spacing.screenHorizontal, borderRadius: 28, overflow: 'hidden', elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  footer: { alignItems: 'center', paddingVertical: 40 },
});
