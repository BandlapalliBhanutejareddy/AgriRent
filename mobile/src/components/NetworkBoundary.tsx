import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { useThemeStore } from '../store/themeStore';

export default function NetworkBoundary({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const { theme } = useThemeStore();

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsConnected(true);
      return;
    }
    
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const handleRetry = () => {
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
    });
  };

  if (isConnected === false) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.iconContainer, { backgroundColor: theme.error + '20' }]}>
          <WifiOff size={48} color={theme.error} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>No Internet Connection</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Please check your network settings and try again. AgroRent AI requires an active internet connection to sync equipment and bookings.
        </Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.primary }]} 
          onPress={handleRetry}
        >
          <RefreshCw size={20} color="#FFF" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
