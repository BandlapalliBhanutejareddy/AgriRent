import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Mic, 
  Send, 
  Volume2, 
  VolumeX, 
  Bot, 
  Sparkles, 
  Leaf, 
  Droplets, 
  Map, 
  ChevronRight, 
  MessageSquare, 
  BrainCircuit,
  ArrowLeft
} from 'lucide-react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../src/store/themeStore';
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';
import { api } from '../src/lib/api';
import { PremiumButton } from '../src/components/PremiumButton';
import { useRouter } from 'expo-router';

export default function AdvisorScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  // Mode Selection: 'chat' or 'form'
  const [activeMode, setActiveMode] = useState<'chat' | 'form'>('chat');

  // ================= CHAT MODE STATE =================
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Hello! I am your AgroRent AI Advisor. How can I help you with your farming today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const language = 'English'; 

  // ================= FORM MODE STATE =================
  const [crop, setCrop] = useState('');
  const [soilType, setSoilType] = useState('');
  const [acreage, setAcreage] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formResult, setFormResult] = useState<any>(null);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  // ================= CHAT HANDLERS =================
  const handleChatSend = async (textToProcess: string) => {
    if (!textToProcess.trim()) return;

    const userText = textToProcess.trim();
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const response = await api.post('/ai/advisor', { 
        prompt: userText,
        language 
      });
      
      const aiText = response.data.reply;
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (voiceEnabled) {
        Speech.speak(aiText, {
          language: 'en-IN',
          rate: 0.9,
          pitch: 1.0,
        });
      }

    } catch (error) {
      console.error('AI Error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I am having trouble connecting to the network right now.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const toggleRecording = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRecording) {
      setIsRecording(false);
      const demoSpeech = "What is the best tractor for plowing 5 acres?";
      setChatInput(demoSpeech);
    } else {
      Speech.stop();
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        setChatInput("What is the best tractor for plowing 5 acres?");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 2000);
    }
  };

  // ================= FORM HANDLERS =================
  const handleGetAdvice = async () => {
    if (!crop.trim()) {
      Alert.alert('Input Required', 'Please enter a crop name.');
      return;
    }

    setFormLoading(true);
    setFormResult(null);

    try {
      const response = await api.post('/ai/recommend-equipment', {
        crop,
        soil_type: soilType || undefined,
        acreage: acreage ? parseFloat(acreage) : undefined
      });
      setFormResult(response.data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn('AI Service unreachable, using local fallback');
      setFormResult({
        reasoning: `Based on local agricultural best practices for ${crop}, we recommend versatile machinery suitable for ${soilType || 'standard'} soil conditions.`,
        recommendations: [
          {
            name: "Multi-Purpose Tractor",
            category: "TRACTOR",
            why: "Essential for primary tillage and haulage for almost all crop types."
          },
          {
            name: "Seed Drill",
            category: "SEEDER",
            why: "Ensures uniform sowing and proper seed-to-soil contact for optimal germination."
          }
        ]
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Calm Elegant Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={[styles.aiIcon, { backgroundColor: theme.primary + '15' }]}>
            <Bot size={24} color={theme.primary} />
          </View>
          <View>
            <Text style={[typography.h2, { color: theme.text }]}>{t('ai_advisor')}</Text>
            <Text style={[typography.caption, { color: theme.primary, fontWeight: 'bold' }]}>{t('online_multilingual')}</Text>
          </View>
        </View>
        
        {activeMode === 'chat' && (
          <TouchableOpacity 
            style={[styles.headerBtn, { backgroundColor: voiceEnabled ? theme.primary + '15' : theme.card }]}
            onPress={() => setVoiceEnabled(!voiceEnabled)}
          >
            {voiceEnabled ? <Volume2 size={20} color={theme.primary} /> : <VolumeX size={20} color={theme.textMuted} />}
          </TouchableOpacity>
        )}
      </View>

      {/* Modern Segmented Controller */}
      <View style={[styles.segmentContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.segmentBtn, activeMode === 'chat' && { backgroundColor: theme.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveMode('chat');
          }}
        >
          <MessageSquare size={16} color={activeMode === 'chat' ? '#FFF' : theme.textSecondary} />
          <Text style={[styles.segmentText, { color: activeMode === 'chat' ? '#FFF' : theme.textSecondary }]}>{t('chat_advisor')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.segmentBtn, activeMode === 'form' && { backgroundColor: theme.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveMode('form');
          }}
        >
          <BrainCircuit size={16} color={activeMode === 'form' ? '#FFF' : theme.textSecondary} />
          <Text style={[styles.segmentText, { color: activeMode === 'form' ? '#FFF' : theme.textSecondary }]}>{t('smart_form')}</Text>
        </TouchableOpacity>
      </View>

      {activeMode === 'chat' ? (
        // ================= CHAT INTERFACE =================
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView 
            contentContainerStyle={styles.chatContainer} 
            showsVerticalScrollIndicator={false}
            ref={(ref) => ref?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg, index) => (
              <View 
                key={index} 
                style={[
                  styles.messageBubble, 
                  msg.role === 'user' ? [styles.userBubble, { backgroundColor: theme.primary }] : [styles.aiBubble, { backgroundColor: theme.card, borderColor: theme.border }]
                ]}
              >
                <Text style={[
                  typography.body, 
                  msg.role === 'user' ? { color: '#FFF' } : { color: theme.text }
                ]}>
                  {msg.text}
                </Text>
              </View>
            ))}
            {chatLoading && (
              <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: theme.card, borderColor: theme.border, alignSelf: 'flex-start', paddingHorizontal: 20 }]}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            )}
          </ScrollView>

          <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
              placeholder={t('ask_about_machinery_crops_weather')}
              placeholderTextColor={theme.textMuted}
              value={chatInput}
              onChangeText={setChatInput}
              onSubmitEditing={() => handleChatSend(chatInput)}
            />
            
            {chatInput.length > 0 ? (
              <TouchableOpacity 
                style={[styles.sendBtn, { backgroundColor: theme.primary }]}
                onPress={() => handleChatSend(chatInput)}
              >
                <Send size={20} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.micBtn, isRecording && { backgroundColor: '#EF4444' }]}
                onPress={toggleRecording}
              >
                <Mic size={22} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      ) : (
        // ================= FORM RECOMMITTER INTERFACE =================
        <ScrollView 
          contentContainerStyle={styles.formContainer} 
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.formCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <View style={styles.inputSection}>
              <Text style={[typography.label, { color: theme.textMuted, marginBottom: 12 }]}>{t('crop_type')}</Text>
              <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Leaf size={18} color={theme.primary} />
                <TextInput
                  style={[styles.formInput, { color: theme.text }]}
                  placeholder={t('e_g_wheat')}
                  placeholderTextColor={theme.textMuted}
                  value={crop}
                  onChangeText={setCrop}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputSection, { flex: 1 }]}>
                <Text style={[typography.label, { color: theme.textMuted, marginBottom: 12 }]}>{t('soil_type')}</Text>
                <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Droplets size={18} color={theme.primary} />
                  <TextInput
                    style={[styles.formInput, { color: theme.text }]}
                    placeholder={t('loamy')}
                    placeholderTextColor={theme.textMuted}
                    value={soilType}
                    onChangeText={setSoilType}
                  />
                </View>
              </View>
              <View style={[styles.inputSection, { flex: 1, marginLeft: 12 }]}>
                <Text style={[typography.label, { color: theme.textMuted, marginBottom: 12 }]}>{t('area_acres')}</Text>
                <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Map size={18} color={theme.primary} />
                  <TextInput
                    style={[styles.formInput, { color: theme.text }]}
                    placeholder="5"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    value={acreage}
                    onChangeText={setAcreage}
                  />
                </View>
              </View>
            </View>

            <PremiumButton 
              title={t('get_machine_suggestions')}
              onPress={handleGetAdvice}
              loading={formLoading}
              style={{ marginTop: 12 }}
              icon={<Sparkles size={18} color="#FFF" />}
            />
          </View>

          {formResult && (
            <View style={styles.resultContainer}>
              <View style={styles.resultHeader}>
                <Sparkles size={18} color={theme.primary} />
                <Text style={[typography.h3, { color: theme.text, marginLeft: 10 }]}>{t('ai_recommendation')}</Text>
              </View>

              <View style={[styles.reasoningBox, { backgroundColor: theme.primary + '05', borderColor: theme.primary + '15' }]}>
                <Text style={[typography.body, { color: theme.text, lineHeight: 26 }]}>{formResult.reasoning}</Text>
              </View>

              {formResult.recommendations.map((item: any, index: number) => (
                <View key={index} style={[styles.recCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                  <View style={styles.recTop}>
                    <View style={[styles.recIcon, { backgroundColor: theme.primary + '10' }]}>
                      <ChevronRight size={18} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[typography.title, { color: theme.text }]}>{item.name}</Text>
                      <Text style={[typography.caption, { color: theme.primary, fontWeight: '700' }]}>{item.category}</Text>
                    </View>
                  </View>
                  <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: 12, lineHeight: 20 }]}>{item.why}</Text>
                </View>
              ))}

              <PremiumButton 
                title={t('browse_marketplace')}
                onPress={() => router.push('/(tabs)')}
                variant="outline"
                style={{ marginTop: 24 }}
              />
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backBtn: {
    padding: 4,
  },
  aiIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    gap: 8,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  chatContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    marginRight: 12,
  },
  sendBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981', 
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  formCard: {
    padding: 24,
    borderRadius: 28,
    elevation: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  formInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    height: '100%',
  },
  row: {
    flexDirection: 'row',
  },
  resultContainer: {
    marginTop: 36,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  reasoningBox: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    marginBottom: 24,
  },
  recCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    elevation: 2,
  },
  recTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
