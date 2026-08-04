import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, User, Calendar, ShieldCheck, MessageCircle, Star } from 'lucide-react-native';
import { api } from '../../src/lib/api';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { FadeInImage } from '../../src/components/FadeInImage';
import { PremiumButton } from '../../src/components/PremiumButton';
import { useTranslation } from "react-i18next";

export default function EquipmentDetail() {
    const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const [equipment, setEquipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      const response = await api.get(`/equipment/${id}`);
      setEquipment(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load equipment details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (user?.role !== 'FARMER') {
      Alert.alert('Role Restricted', 'Only farmers can book equipment.');
      return;
    }

    setBookingLoading(true);
    try {
      // Create a default 3-day booking starting tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const day3 = new Date();
      day3.setDate(day3.getDate() + 4);

      await api.post('/bookings', {
        equipmentId: id,
        startDate: tomorrow.toISOString(),
        endDate: day3.toISOString(),
      });

      Alert.alert('Success', 'Booking request sent to the owner!');
      router.push('/(tabs)/bookings');
    } catch (error: any) {
      Alert.alert('Booking Failed', error.message || 'Could not send booking request.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!equipment) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <FadeInImage uri={equipment.imageUrl} style={styles.image} />
          <TouchableOpacity 
            style={[styles.backBtn, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={[styles.content, { backgroundColor: theme.background }]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.h1, { color: theme.text }]}>{equipment.title}</Text>
              <Text style={[typography.caption, { color: theme.primary, fontWeight: '800', marginTop: 4, letterSpacing: 1 }]}>
                {equipment.category}
              </Text>
            </View>
            <View style={styles.priceTag}>
              <Text style={[typography.h2, { color: theme.primary }]}>₹{equipment.pricePerDay}</Text>
              <Text style={[typography.caption, { color: theme.textMuted }]}>{t('day')}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
               <MapPin size={16} color={theme.textMuted} />
               <Text style={[typography.bodySmall, { color: theme.textSecondary, marginLeft: 6 }]}>{equipment.location || 'Nashik'}</Text>
            </View>
            <View style={styles.statItem}>
               <Star size={16} color="#F59E0B" fill="#F59E0B" />
               <Text style={[typography.bodySmall, { color: theme.textSecondary, marginLeft: 6 }]}>{t('4_9_24_reviews')}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.section}>
            <Text style={[typography.title, { color: theme.text, marginBottom: 12 }]}>{t('description')}</Text>
            <Text style={[typography.body, { color: theme.textSecondary, lineHeight: 24 }]}>
              {equipment.description || 'No description available for this equipment.'}
            </Text>
          </View>

          <View style={[styles.ownerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.ownerAvatar, { backgroundColor: theme.primary + '20' }]}>
               <User size={24} color={theme.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
               <Text style={[typography.title, { color: theme.text }]}>{equipment.owner?.name}</Text>
               <Text style={[typography.caption, { color: theme.textMuted }]}>{t('registered_owner')}</Text>
            </View>
            <TouchableOpacity style={[styles.chatBtn, { backgroundColor: theme.primary }]}>
               <MessageCircle size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
             <Text style={[typography.title, { color: theme.text, marginBottom: 16 }]}>{t('why_rent_this')}</Text>
             <View style={styles.featureItem}>
                <ShieldCheck size={20} color={theme.success} />
                <Text style={[typography.bodySmall, { color: theme.textSecondary, marginLeft: 12 }]}>{t('verified_insured_machinery')}</Text>
             </View>
             <View style={[styles.featureItem, { marginTop: 12 }]}>
                <Calendar size={20} color={theme.primary} />
                <Text style={[typography.bodySmall, { color: theme.textSecondary, marginLeft: 12 }]}>{t('flexible_booking_dates')}</Text>
             </View>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <PremiumButton 
          title={equipment.available ? "Request Rental" : "Currently Unavailable"}
          onPress={handleBooking}
          loading={bookingLoading}
          disabled={!equipment.available}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { width: '100%', height: 350, position: 'relative' },
  image: { width: '100%', height: '100%' },
  backBtn: { position: 'absolute', top: 20, left: 20, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, marginTop: -30, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  priceTag: { alignItems: 'flex-end' },
  statsRow: { flexDirection: 'row', marginTop: 20, gap: 24 },
  statItem: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: 1, marginVertical: 28 },
  section: { marginBottom: 32 },
  ownerCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 32 },
  ownerAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  chatBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  featureItem: { flexDirection: 'row', alignItems: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, borderTopWidth: 1, flexDirection: 'row', gap: 16 },
});
