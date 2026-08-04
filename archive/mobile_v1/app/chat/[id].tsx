import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../src/lib/api';
import { useThemeStore } from '../../src/store/themeStore';
import { useAuthStore } from '../../src/store/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Phone, Info, MoreHorizontal, Plus, Smile } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Design System & Components
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { ShimmerLine } from '../../src/components/Shimmers';
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get('window');

export default function ChatScreen() {
    const { t } = useTranslation();
  const { id: bookingId } = useLocalSearchParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [booking, setBooking] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { theme, isDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages();
    fetchBookingDetails();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [bookingId]);

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/chat/booking/${bookingId}`);
      setMessages(response.data);
    } catch (error) {
      console.log('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingDetails = async () => {
    try {
        const response = await api.get(`/bookings`);
        const currentBooking = response.data.find((b: any) => b.id === bookingId);
        setBooking(currentBooking);
    } catch (e) {
        console.log('Failed to fetch booking context');
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const msgText = newMessage.trim();
    const tempMsg = {
      id: Date.now().toString(),
      message: msgText,
      senderId: user?.id,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
    
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      await api.post(`/chat/booking/${bookingId}`, { message: msgText });
      fetchMessages(); 
    } catch (error) {
      console.log('Failed to send message');
    }
  };

  const renderItem = useCallback(({ item }: { item: any }) => {
    const isMe = item.senderId === user?.id;
    return (
      <View style={[styles.bubbleWrapper, isMe ? styles.myWrapper : styles.theirWrapper]}>
        <View style={[
          styles.messageBubble, 
          isMe ? [styles.myMessage, { backgroundColor: theme.primary }] : [styles.theirMessage, { backgroundColor: theme.card, borderColor: theme.border }]
        ]}>
            {isMe && (
                <LinearGradient
                    colors={[theme.primary, theme.primary + 'CC']}
                    style={StyleSheet.absoluteFill}
                />
            )}
            <Text style={[typography.body, { color: isMe ? '#FFF' : theme.text, lineHeight: 22 }]}>
                {item.message}
            </Text>
        </View>
        <Text style={[styles.timestamp, { color: theme.textMuted }]}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  }, [theme, user]);

  const otherParty = user?.role === 'OWNER' ? booking?.farmer : booking?.owner;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
            <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
                <Text style={[styles.avatarText, { color: theme.primary }]}>{otherParty?.name?.charAt(0) || 'S'}</Text>
            </View>
            <View style={{ marginLeft: spacing.sm }}>
                <Text style={[typography.title, { color: theme.text }]} numberOfLines={1}>
                    {otherParty?.name || 'AgroRent Support'}
                </Text>
                <View style={styles.statusRow}>
                    <View style={[styles.onlineDot, { backgroundColor: theme.success }]} />
                    <Text style={[typography.caption, { color: theme.textMuted }]}>{t('active_now')}</Text>
                </View>
            </View>
        </View>

        <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerIcon}>
                <Phone size={20} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
                <MoreHorizontal size={20} color={theme.textMuted} />
            </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {loading ? (
            <View style={styles.loadingContainer}>
                <ShimmerLine style={{ width: '60%', height: 40, borderRadius: 12, marginBottom: 12, alignSelf: 'flex-end' }} />
                <ShimmerLine style={{ width: '40%', height: 40, borderRadius: 12, marginBottom: 12, alignSelf: 'flex-start' }} />
                <ShimmerLine style={{ width: '70%', height: 40, borderRadius: 12, marginBottom: 12, alignSelf: 'flex-end' }} />
            </View>
        ) : (
            <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
        )}
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
            <TouchableOpacity style={styles.attachBtn}>
                <Plus size={24} color={theme.primary} />
            </TouchableOpacity>
            
            <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder={t('type_a_message')}
                    placeholderTextColor={theme.textMuted}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                />
                <TouchableOpacity style={styles.emojiBtn}>
                    <Smile size={20} color={theme.textMuted} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity 
                style={[styles.sendButton, { backgroundColor: theme.primary, opacity: newMessage.trim() ? 1 : 0.6 }]} 
                onPress={handleSend}
                disabled={!newMessage.trim()}
            >
                <Send size={20} color="#FFF" />
            </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, elevation: 2 },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: spacing.xs },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontWeight: 'bold', fontSize: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { padding: 8, marginLeft: 4 },
  
  loadingContainer: { padding: spacing.md },
  listContainer: { padding: spacing.md, paddingBottom: spacing.lg },
  bubbleWrapper: { marginBottom: spacing.md, maxWidth: '80%' },
  myWrapper: { alignSelf: 'flex-end' },
  theirWrapper: { alignSelf: 'flex-start' },
  
  messageBubble: { padding: spacing.md, borderRadius: 20, overflow: 'hidden' },
  myMessage: { borderBottomRightRadius: 4, elevation: 2 },
  theirMessage: { borderBottomLeftRadius: 4, borderWidth: 1, elevation: 1 },
  timestamp: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  
  inputWrapper: { flexDirection: 'row', padding: spacing.md, alignItems: 'center', gap: 10, borderTopWidth: 1 },
  attachBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  inputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8 },
  input: { flex: 1, fontSize: 15, maxHeight: 100, paddingVertical: 4 },
  emojiBtn: { padding: 4 },
  sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 4 },
});
