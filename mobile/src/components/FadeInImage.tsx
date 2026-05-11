import React, { useState } from 'react';
import { View, StyleSheet, StyleProp, ImageStyle, TouchableOpacity, Text } from 'react-native';
import { Image } from 'expo-image';
import { useThemeStore } from '../store/themeStore';
import { RefreshCw, ImageOff } from 'lucide-react-native';
import { spacing } from '../theme/spacing';
import { ShimmerLine } from './Shimmers';

interface FadeInImageProps {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain' | 'stretch';
  placeholder?: string;
  showShimmer?: boolean;
}

const DEFAULT_PLACEHOLDER = 'https://images.unsplash.com/photo-1592982537447-6f2b6e1b7823?w=600&h=400&fit=crop';

export const FadeInImage: React.FC<FadeInImageProps> = ({ 
  uri, 
  style, 
  contentFit = 'cover', 
  placeholder,
  showShimmer = true
}) => {
  const { theme } = useThemeStore();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleRetry = () => {
    setError(false);
    setLoading(true);
  };

  if (error || (!uri && !placeholder)) {
    return (
      <View style={[styles.container, style, { backgroundColor: theme.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.border }]}>
        <ImageOff size={24} color={theme.textMuted} opacity={0.5} />
        <TouchableOpacity onPress={handleRetry} style={[styles.retryBtn, { backgroundColor: theme.primary + '10' }]}>
          <RefreshCw size={12} color={theme.primary} />
          <Text style={{ fontSize: 10, color: theme.primary, marginLeft: 4, fontWeight: '700' }}>RETRY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style, { backgroundColor: theme.border }]}>
      <Image
        source={{ uri: uri || placeholder || DEFAULT_PLACEHOLDER }}
        style={[styles.image, style]}
        contentFit={contentFit}
        transition={400}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
            setError(true);
            setLoading(false);
        }}
        cachePolicy="disk"
      />
      {loading && showShimmer && (
        <View style={StyleSheet.absoluteFill}>
          <ShimmerLine style={{ width: '100%', height: '100%', borderRadius: 0 }} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  }
});
