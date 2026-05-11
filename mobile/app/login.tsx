import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useThemeStore } from '../src/store/themeStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Smartphone, ShieldCheck, Mail } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Design System & Components
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';
import { PremiumButton } from '../src/components/PremiumButton';

export default function LoginScreen() {
  const router = useRouter();
  const { login, setDemoUser } = useAuthStore();
  const { theme, isDarkMode } = useThemeStore();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number.');
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setStep('otp');
      setLoading(false);
    }, 1000);
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 4) {
        Alert.alert('Invalid OTP', 'Please enter the 4-digit code.');
        return;
    }
    setLoading(true);
    try {
      await login(phoneNumber, otp);
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Login Failed', 'The code you entered is incorrect.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: 'FARMER' | 'OWNER') => {
    setDemoUser(role);
    router.replace('/(tabs)/home');
  };

  return (
// ... existing jsx ...
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <LinearGradient
                    colors={[theme.primary, '#166534']}
                    style={styles.logoBox}
                >
                    <ShieldCheck size={40} color="#FFF" />
                </LinearGradient>
                <Text style={[typography.hero, { color: theme.text, marginTop: 32 }]}>Welcome Back</Text>
                <Text style={[typography.body, { color: theme.textSecondary, textAlign: 'center', marginTop: 12, maxWidth: '80%' }]}>
                    Access your smart farming dashboard and equipment marketplace.
                </Text>
            </View>

            <View style={[styles.form, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                {step === 'phone' ? (
                    <View>
                        <Text style={[typography.label, { color: theme.textMuted, marginBottom: 16 }]}>PHONE NUMBER</Text>
                        <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Smartphone size={20} color={theme.primary} />
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                placeholder="98765 43210"
                                placeholderTextColor={theme.textMuted}
                                keyboardType="phone-pad"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                            />
                        </View>
                        <PremiumButton 
                            title="Send Code" 
                            onPress={handleSendOTP} 
                            loading={loading}
                            style={{ marginTop: 24 }}
                            icon={<ArrowRight size={18} color="#FFF" />}
                        />
                    </View>
                ) : (
                    <View>
                        <Text style={[typography.label, { color: theme.textMuted, marginBottom: 16 }]}>VERIFICATION CODE</Text>
                        <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Mail size={20} color={theme.primary} />
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                placeholder="0000"
                                placeholderTextColor={theme.textMuted}
                                keyboardType="number-pad"
                                value={otp}
                                onChangeText={setOtp}
                                maxLength={4}
                            />
                        </View>
                        <PremiumButton 
                            title="Verify & Login" 
                            onPress={handleVerifyOTP} 
                            loading={loading}
                            style={{ marginTop: 24 }}
                        />
                        <TouchableOpacity style={styles.resendBtn} onPress={() => setStep('phone')}>
                            <Text style={[typography.caption, { color: theme.primary, fontWeight: '700' }]}>Change Phone Number</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <Text style={[typography.bodySmall, { color: theme.textSecondary, marginBottom: 16 }]}>Or explore the platform as:</Text>
                <View style={styles.demoRow}>
                    <TouchableOpacity 
                        style={[styles.demoChip, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]} 
                        onPress={() => handleDemoLogin('FARMER')}
                    >
                        <Text style={[styles.demoChipText, { color: theme.primary }]}>Farmer Demo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.demoChip, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]} 
                        onPress={() => handleDemoLogin('OWNER')}
                    >
                        <Text style={[styles.demoChipText, { color: theme.primary }]}>Owner Demo</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 60 },
  logoBox: { width: 88, height: 88, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  form: { padding: 28, borderRadius: 32, elevation: 8, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.04, shadowRadius: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', height: 64, borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 20, gap: 12 },
  input: { flex: 1, fontSize: 18, fontWeight: '700' },
  resendBtn: { alignItems: 'center', marginTop: 20 },
  footer: { marginTop: 40, alignItems: 'center' },
  demoRow: { flexDirection: 'row', gap: 12 },
  demoChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  demoChipText: { fontSize: 13, fontWeight: '700' },
});
