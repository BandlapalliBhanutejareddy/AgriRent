import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useThemeStore } from '../src/store/themeStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, ShieldCheck, Mail, Lock, Eye, EyeOff, X, Key, CheckCircle2, User as UserIcon } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../src/lib/api';

// Design System & Components
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';
import { PremiumButton } from '../src/components/PremiumButton';
import { APP_MODE } from '../src/config/appConfig';
import { useTranslation } from "react-i18next";

export default function LoginScreen() {
    const { t } = useTranslation();
  const router = useRouter();
  const { login } = useAuthStore();
  const { theme, isDarkMode } = useThemeStore();
  
  const [email, setEmail] = useState(APP_MODE === 'demo' ? 'farmer@agrorent.ai' : '');
  const [password, setPassword] = useState(APP_MODE === 'demo' ? '123456' : '');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot Password Flow States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Registration & OTP Flow States
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [registerName, setRegisterName] = useState('');
  const [showRegisterOtpModal, setShowRegisterOtpModal] = useState(false);
  const [registerOtpInput, setRegisterOtpInput] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<string>('');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (showRegisterOtpModal && email) {
      setDeliveryStatus('Sending email via secure transport...');
      api.get(`/auth/dev-otp?email=${email}`)
         .then(res => {
            if (res.data.otp) setDevOtp(res.data.otp);
            setDeliveryStatus('Email dispatched securely.');
         })
         .catch(() => setDeliveryStatus('Email delivery failed or pending.'));
    }
  }, [showRegisterOtpModal, email]);

  useEffect(() => {
    if (registerOtpInput.length === 6 && !loading) {
      handleVerifyRegisterOtp(registerOtpInput);
    }
  }, [registerOtpInput]);

  const handleRegister = async () => {
    if (!email || !password || !registerName) {
      Alert.alert('Missing Fields', 'Please enter your name, email, and password.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        name: registerName,
        email,
        password,
        role: 'FARMER' // Defaulting to FARMER for mobile
      });
      if (response.data.success) {
        setRegisterOtpInput('');
        setShowRegisterOtpModal(true);
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.error || 'Could not register account.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRegisterOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || registerOtpInput;
    if (!code || code.length < 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP code.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', { email, otp: code, purpose: 'REGISTER' });
      if (response.data.success) {
        setShowRegisterOtpModal(false);
        setDevOtp(null);
        await login(email, password); // Log them in now that they are verified
        const user = useAuthStore.getState().user;
        if (user?.role === 'OWNER') router.replace('/owner/dashboard');
        else router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.error?.includes('expired')) {
        Alert.alert('OTP Expired', 'This OTP code has expired. Please request a new one.');
      } else {
        Alert.alert('Verification Failed', 'Invalid or expired OTP code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !email) return;
    setLoading(true);
    try {
      const response = await api.post('/auth/resend-otp', { email, purpose: 'REGISTER' });
      if (response.data.success) {
        setResendCooldown(60);
      }
    } catch (err: any) {
      Alert.alert('Failed', 'Could not resend OTP. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthAction = () => {
    if (isLoginMode) handleLogin();
    else handleRegister();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      // Redirect based on role
      const user = useAuthStore.getState().user;
      if (user?.role === 'OWNER') {
        router.replace('/owner/dashboard');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (error: any) {
      const isNetworkError = error.message?.includes('Network Error') || !error.response;
      if (isNetworkError) {
        Alert.alert('Network Error', error.message || 'Service Temporarily Unavailable');
      } else {
        Alert.alert('Login Failed', error.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotOtp = async () => {
    if (!forgotEmail) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    setForgotLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: forgotEmail });
      if (response.data.success) {
        Alert.alert('OTP Sent', 'A secure verification OTP has been sent to your email.');
        setForgotStep(2);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not send reset OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyForgotOtp = async () => {
    if (!otpInput || otpInput.length < 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP code.');
      return;
    }
    setForgotLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', {
        email: forgotEmail,
        otp: otpInput,
        purpose: 'FORGOT_PASSWORD'
      });
      if (response.data.success) {
        setForgotStep(3);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Invalid or expired OTP code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setForgotLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        email: forgotEmail,
        otp: otpInput,
        newPassword
      });
      if (response.data.success) {
        setForgotSuccess(true);
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotEmail('');
          setOtpInput('');
          setNewPassword('');
          setConfirmPassword('');
          setForgotStep(1);
          setForgotSuccess(false);
        }, 1500);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
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
            
            {APP_MODE === 'demo' && (
              <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 16 }}>
                <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 12 }}>{t('running_in_demo_mode')}</Text>
              </View>
            )}

            <Text style={[typography.hero, { color: theme.text, marginTop: APP_MODE === 'demo' ? 16 : 32 }]}>
              {isLoginMode ? 'Welcome Back' : 'Create Account'}
            </Text>
            <Text style={[typography.body, { color: theme.textSecondary, textAlign: 'center', marginTop: 12, maxWidth: '80%' }]}>
              {isLoginMode 
                ? 'Access your smart farming dashboard and equipment marketplace.'
                : 'Join AgroRent AI and revolutionize your farming operations.'}
            </Text>
          </View>

          <View style={[styles.form, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <View>
              {/* Registration Fields */}
              {!isLoginMode && (
                <>
                  <Text style={[typography.label, { color: theme.textMuted, marginBottom: 16 }]}>{t('full_name')}</Text>
                  <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <UserIcon size={20} color={theme.primary} />
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      placeholder={t('your_name')}
                      placeholderTextColor={theme.textMuted}
                      value={registerName}
                      onChangeText={setRegisterName}
                    />
                  </View>
                  <View style={{ height: 24 }} />
                </>
              )}

              <Text style={[typography.label, { color: theme.textMuted, marginBottom: 16 }]}>{t('email')}</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Mail size={20} color={theme.primary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder={t('your_email_com')}
                  placeholderTextColor={theme.textMuted}
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>
              
              <Text style={[typography.label, { color: theme.textMuted, marginBottom: 16, marginTop: 24 }]}>{t('password')}</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Lock size={20} color={theme.primary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder={t('your_password')}
                  placeholderTextColor={theme.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} color={theme.textMuted} /> : <Eye size={20} color={theme.textMuted} />}
                </TouchableOpacity>
              </View>

              {/* Forgot Password trigger link */}
              {isLoginMode && (
                <TouchableOpacity 
                  style={styles.forgotBtn}
                  onPress={() => {
                    setForgotStep(1);
                    setShowForgotModal(true);
                  }}
                >
                  <Text style={[typography.caption, { color: theme.primary, fontWeight: '800' }]}>{t('forgot_password')}</Text>
                </TouchableOpacity>
              )}

              <PremiumButton 
                title={isLoginMode ? "Login" : "Sign Up"} 
                onPress={handleAuthAction} 
                loading={loading}
                style={{ marginTop: 24 }}
                icon={<ArrowRight size={18} color="#FFF" />}
              />
            </View>
          </View>
          
          <TouchableOpacity 
            style={{ marginTop: 32, alignSelf: 'center', padding: 12 }}
            onPress={() => setIsLoginMode(!isLoginMode)}
          >
            <Text style={[typography.caption, { color: theme.textMuted, fontSize: 15 }]}>
              {isLoginMode ? "Don't have an account? " : "Already have an account? "}
              <Text style={{ color: theme.primary, fontWeight: '800' }}>
                {isLoginMode ? "Sign Up" : "Log In"}
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Registration OTP Modal */}
      <Modal
        visible={showRegisterOtpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRegisterOtpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.keyIconCircle, { backgroundColor: theme.primary + '15' }]}>
                <CheckCircle2 size={24} color={theme.primary} />
              </View>
            </View>

            <Text style={[typography.h2, { color: theme.text, textAlign: 'center', marginTop: 16 }]}>{t('verify_account')}</Text>
            <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 16 }]}>
              {t('we_ve_sent_a_6_digit_otp_to')}{email}.
            </Text>

            {deliveryStatus ? (
              <Text style={[typography.caption, { color: theme.primary, textAlign: 'center', marginTop: 8, fontWeight: 'bold' }]}>
                {deliveryStatus}
              </Text>
            ) : null}

            {devOtp && (
              <View style={{ marginTop: 12, backgroundColor: '#fef3c7', padding: 8, borderRadius: 8, alignItems: 'center' }}>
                <Text style={{ color: '#92400e', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                  {t('dev_mode_otp')}{devOtp}
                </Text>
              </View>
            )}

            <View style={{ marginTop: 28 }}>
              <Text style={[typography.label, { color: theme.textMuted, marginBottom: 12, textAlign: 'center' }]}>{t('enter_6_digit_otp')}</Text>
              <View style={[styles.modalInputBox, { backgroundColor: theme.surface, borderColor: theme.border, justifyContent: 'center' }]}>
                <TextInput
                  style={[styles.input, { color: theme.text, textAlign: 'center', letterSpacing: 8, fontSize: 20, fontWeight: '900' }]}
                  placeholder="••••••"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={registerOtpInput}
                  onChangeText={setRegisterOtpInput}
                />
              </View>
              <PremiumButton 
                title={t('verify_code')} 
                onPress={() => handleVerifyRegisterOtp()} 
                loading={loading}
                style={{ marginTop: 24 }}
              />

              <View style={{ marginTop: 20, alignItems: 'center', gap: 12 }}>
                <TouchableOpacity onPress={handleResendOtp} disabled={resendCooldown > 0 || loading}>
                  <Text style={[typography.caption, { color: theme.primary, fontWeight: 'bold', opacity: (resendCooldown > 0 || loading) ? 0.5 : 1 }]}>
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => setShowRegisterOtpModal(false)}>
                  <Text style={[typography.caption, { color: theme.textMuted }]}>
                    {t('change_email_address')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowForgotModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            
            <View style={styles.modalHeader}>
              <View style={[styles.keyIconCircle, { backgroundColor: theme.primary + '15' }]}>
                <Key size={24} color={theme.primary} />
              </View>
              <TouchableOpacity 
                style={styles.closeBtn} 
                onPress={() => setShowForgotModal(false)}
              >
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text style={[typography.h2, { color: theme.text, textAlign: 'center', marginTop: 16 }]}>{t('recover_password')}</Text>
            <Text style={[typography.caption, { color: theme.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 16 }]}>
              {t('verify_your_security_credentials_to_set')}</Text>

            {forgotSuccess ? (
              <View style={styles.successBox}>
                <CheckCircle2 size={48} color="#10B981" />
                <Text style={[typography.title, { color: theme.success, marginTop: 12 }]}>{t('password_reset_success')}</Text>
                <Text style={[typography.caption, { color: theme.textMuted, marginTop: 4, textAlign: 'center' }]}>{t('returning_you_back_to_portal_access')}</Text>
              </View>
            ) : (
              <View style={{ marginTop: 28 }}>
                {forgotStep === 1 && (
                  <View>
                    <Text style={[typography.label, { color: theme.textMuted, marginBottom: 12 }]}>{t('account_email_address')}</Text>
                    <View style={[styles.modalInputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <Mail size={20} color={theme.primary} />
                      <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder={t('your_email_com')}
                        placeholderTextColor={theme.textMuted}
                        keyboardType="email-address"
                        value={forgotEmail}
                        onChangeText={setForgotEmail}
                        autoCapitalize="none"
                      />
                    </View>
                    <PremiumButton 
                      title={t('request_otp_code')} 
                      onPress={handleSendForgotOtp} 
                      loading={forgotLoading}
                      style={{ marginTop: 24 }}
                    />
                  </View>
                )}

                {forgotStep === 2 && (
                  <View>
                    <Text style={[typography.label, { color: theme.textMuted, marginBottom: 12, textAlign: 'center' }]}>{t('enter_4_digit_verification_otp')}</Text>
                    <View style={[styles.modalInputBox, { backgroundColor: theme.surface, borderColor: theme.border, justifyContent: 'center' }]}>
                      <TextInput
                        style={[styles.input, { color: theme.text, textAlign: 'center', letterSpacing: 8, fontSize: 20, fontWeight: '900' }]}
                        placeholder="••••"
                        placeholderTextColor={theme.textMuted}
                        keyboardType="number-pad"
                        maxLength={4}
                        value={otpInput}
                        onChangeText={setOtpInput}
                      />
                    </View>
                    <PremiumButton 
                      title={t('verify_code')} 
                      onPress={handleVerifyForgotOtp} 
                      style={{ marginTop: 24 }}
                    />
                  </View>
                )}

                {forgotStep === 3 && (
                  <View>
                    <Text style={[typography.label, { color: theme.textMuted, marginBottom: 12 }]}>{t('new_secure_password')}</Text>
                    <View style={[styles.modalInputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <Lock size={20} color={theme.primary} />
                      <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder={t('at_least_6_characters')}
                        placeholderTextColor={theme.textMuted}
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                      />
                    </View>

                    <Text style={[typography.label, { color: theme.textMuted, marginBottom: 12, marginTop: 20 }]}>{t('confirm_new_password')}</Text>
                    <View style={[styles.modalInputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <Lock size={20} color={theme.primary} />
                      <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder={t('re_type_new_password')}
                        placeholderTextColor={theme.textMuted}
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                    </View>

                    <PremiumButton 
                      title={t('save_and_update_password')} 
                      onPress={handleResetPassword} 
                      loading={forgotLoading}
                      style={{ marginTop: 24 }}
                    />
                  </View>
                )}
              </View>
            )}

          </View>
        </View>
      </Modal>
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
  input: { flex: 1, fontSize: 16, fontWeight: '700' },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modalCard: { padding: 28, borderRadius: 36, borderWidth: 1.5, elevation: 20, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  keyIconCircle: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  closeBtn: { padding: 4 },
  modalInputBox: { flexDirection: 'row', alignItems: 'center', height: 60, borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 16, gap: 12 },
  successBox: { alignItems: 'center', marginTop: 32, paddingVertical: 16 },
});
