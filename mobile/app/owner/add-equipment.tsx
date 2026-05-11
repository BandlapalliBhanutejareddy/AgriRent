import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Save, Upload, Loader2, Info } from 'lucide-react-native';
import { useThemeStore } from '../../src/store/themeStore';
import { typography } from '../../src/theme/typography';
import { api } from '../../src/lib/api';
import { PremiumButton } from '../../src/components/PremiumButton';
import { pickAndUploadImage } from '../../src/lib/uploadImage';

export default function AddEquipmentScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'TRACTOR',
    pricePerDay: '',
    description: '',
    location: 'Nashik, Maharashtra',
  });
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const categories = ['TRACTOR', 'HARVESTER', 'IMPLEMENT', 'SEEDER', 'SPRAYER', 'IRRIGATION'];

  const handleSubmit = async () => {
    if (!formData.name || !formData.pricePerDay) {
      Alert.alert('Required Fields', 'Please enter equipment name and price.');
      return;
    }

    require('react-native').Keyboard.dismiss();
    setLoading(true);
    // ... rest same ...
    try {
      await api.post('/equipment', {
        ...formData,
        pricePerDay: parseFloat(formData.pricePerDay),
        imageUrl: imageUrl,
      });
      Alert.alert('Success', 'Equipment listed successfully!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to list equipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[typography.h3, { color: theme.text }]}>List Equipment</Text>
          </View>

          <View style={styles.content}>
            {/* Image Picker */}
            <TouchableOpacity 
              onPress={handlePickImage}
              style={[styles.imagePicker, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              {imageUrl ? (
                <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Image Uploaded ✓</Text>
              ) : (
                <>
                  <Upload size={32} color={theme.primary} />
                  <Text style={[typography.body, { color: theme.textSecondary, marginTop: 12 }]}>Upload Photo</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[typography.label, { color: theme.textSecondary }]}>CATEGORY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setFormData({ ...formData, category: cat })}
                      style={[
                        styles.catChip,
                        { 
                          backgroundColor: formData.category === cat ? theme.primary : theme.surface,
                          borderColor: formData.category === cat ? theme.primary : theme.border
                        }
                      ]}
                    >
                      <Text style={[styles.catText, { color: formData.category === cat ? '#FFF' : theme.text }]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[typography.label, { color: theme.textSecondary }]}>EQUIPMENT NAME</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
                  placeholder="e.g. Mahindra Arjun 555"
                  placeholderTextColor={theme.textMuted}
                  value={formData.name}
                  onChangeText={(val) => setFormData({ ...formData, name: val })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[typography.label, { color: theme.textSecondary }]}>PRICE PER DAY (₹)</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
                  placeholder="2500"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  value={formData.pricePerDay}
                  onChangeText={(val) => setFormData({ ...formData, pricePerDay: val })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[typography.label, { color: theme.textSecondary }]}>DESCRIPTION</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
                  placeholder="Details about condition, attachments, etc."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={4}
                  value={formData.description}
                  onChangeText={(val) => setFormData({ ...formData, description: val })}
                />
              </View>

              <View style={[styles.infoBox, { backgroundColor: theme.primary + '10' }]}>
                <Info size={18} color={theme.primary} />
                <Text style={[typography.caption, { color: theme.primary, marginLeft: 10, flex: 1 }]}>
                  Your listing will be visible to farmers in Nashik area immediately after submission.
                </Text>
              </View>

              <PremiumButton 
                title="Publish Listing"
                onPress={handleSubmit}
                loading={loading}
                style={{ marginTop: 24 }}
                icon={<Save size={20} color="#FFF" />}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, gap: 16 },
  backBtn: { padding: 4 },
  content: { padding: 24 },
  imagePicker: { height: 200, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  input: { height: 56, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 16, fontSize: 16, fontWeight: '600' },
  textArea: { height: 120, paddingTop: 16, textAlignVertical: 'top' },
  infoBox: { flexDirection: 'row', padding: 16, borderRadius: 16, alignItems: 'center' },
  categoryRow: { gap: 10, paddingRight: 24 },
  catChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  catText: { fontSize: 13, fontWeight: '700' },
});
