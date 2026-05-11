import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Leaf, Droplets, Map, Search, ChevronRight, Sparkles, BrainCircuit } from 'lucide-react-native';
import axios from 'axios';
import { useThemeStore } from '../../src/store/themeStore';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { PremiumButton } from '../../src/components/PremiumButton';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const aiApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
});

export default function AiAdvisorScreen() {
  const router = useRouter();
  const [crop, setCrop] = useState('');
  const [soilType, setSoilType] = useState('');
  const [acreage, setAcreage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { theme, isDarkMode } = useThemeStore();
  const { t } = useTranslation();

  const handleGetAdvice = async () => {
    if (!crop.trim()) {
      Alert.alert(t('input_required'), t('enter_crop_name'));
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await aiApi.post('/recommend-equipment', {
        crop,
        soil_type: soilType || undefined,
        acreage: acreage ? parseFloat(acreage) : undefined
      });
      setResult(response.data);
    } catch (error) {
      console.warn('AI Service unreachable, using local fallback');
      // Graceful fallback with mock data
      setResult({
        reasoning: `Based on local agricultural best practices for ${crop}, we recommend versatile machinery suitable for ${soilType || 'standard'} soil conditions.`,
        recommendations: [
          {
            name: "Multi-Purpose Tractor",
            category: "TRACTOR",
            why: "Essential for primary tillage and haulage for almost all crop types including yours."
          },
          {
            name: "Seed Drill",
            category: "SEEDER",
            why: "Ensures uniform sowing and proper seed-to-soil contact for optimal germination."
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
            <LinearGradient
                colors={[theme.primary, '#166534']}
                style={styles.aiIcon}
            >
                <BrainCircuit size={32} color="#FFF" />
            </LinearGradient>
            <Text style={[typography.hero, { color: theme.text, marginTop: 24 }]}>AI Advisor</Text>
            <Text style={[typography.body, { color: theme.textSecondary, textAlign: 'center', marginTop: 12, maxWidth: '85%' }]}>
                Personalized farming insights powered by machine learning.
            </Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
          <View style={styles.inputSection}>
            <Text style={[typography.label, { color: theme.textMuted, marginBottom: 12 }]}>CROP TYPE</Text>
            <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Leaf size={18} color={theme.primary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="e.g. Wheat"
                placeholderTextColor={theme.textMuted}
                value={crop}
                onChangeText={setCrop}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputSection, { flex: 1 }]}>
              <Text style={[typography.label, { color: theme.textMuted, marginBottom: 12 }]}>SOIL</Text>
              <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Droplets size={18} color={theme.primary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Loamy"
                  placeholderTextColor={theme.textMuted}
                  value={soilType}
                  onChangeText={setSoilType}
                />
              </View>
            </View>
            <View style={[styles.inputSection, { flex: 1, marginLeft: 12 }]}>
              <Text style={[typography.label, { color: theme.textMuted, marginBottom: 12 }]}>AREA</Text>
              <View style={[styles.inputBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Map size={18} color={theme.primary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Acre"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  value={acreage}
                  onChangeText={setAcreage}
                />
              </View>
            </View>
          </View>

          <PremiumButton 
            title="Get Advice"
            onPress={handleGetAdvice}
            loading={loading}
            style={{ marginTop: 12 }}
            icon={<Sparkles size={18} color="#FFF" />}
          />
        </View>

        {result && (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
                <Sparkles size={18} color={theme.primary} />
                <Text style={[typography.h3, { color: theme.text, marginLeft: 10 }]}>Recommendations</Text>
            </View>

            <View style={[styles.reasoningBox, { backgroundColor: theme.primary + '05', borderColor: theme.primary + '15' }]}>
              <Text style={[typography.body, { color: theme.text, lineHeight: 26 }]}>{result.reasoning}</Text>
            </View>

            {result.recommendations.map((item: any, index: number) => (
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
                title="Search Marketplace"
                onPress={() => router.push('/(tabs)')}
                variant="outline"
                style={{ marginTop: 24 }}
            />
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 28, paddingTop: 40 },
  header: { alignItems: 'center', marginBottom: 48 },
  aiIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  formCard: { padding: 24, borderRadius: 32, elevation: 4, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 20 },
  inputSection: { marginBottom: 20 },
  inputBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, borderRadius: 16, borderWidth: 1.5, gap: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row' },
  resultContainer: { marginTop: 48 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  reasoningBox: { padding: 20, borderRadius: 24, borderWidth: 1.5, marginBottom: 24 },
  recCard: { padding: 20, borderRadius: 24, marginBottom: 16, elevation: 2 },
  recTop: { flexDirection: 'row', alignItems: 'center' },
  recIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
});
