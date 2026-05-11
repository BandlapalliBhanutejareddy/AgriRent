import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Search, Mic, X } from 'lucide-react-native';
import { useThemeStore } from '../store/themeStore';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onMicPress?: () => void;
  onClear?: () => void;
}

export const SearchBar = ({ 
  value, 
  onChangeText, 
  placeholder = 'Search equipment...', 
  onMicPress,
  onClear 
}: SearchBarProps) => {
  const { theme } = useThemeStore();
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.card, 
        borderColor: isFocused ? theme.primary : theme.border,
      }
    ]}>
      <Search size={18} color={isFocused ? theme.primary : theme.textMuted} />
      <TextInput
        style={[styles.input, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {value.length > 0 ? (
        <TouchableOpacity onPress={onClear}>
          <X size={18} color={theme.textMuted} />
        </TouchableOpacity>
      ) : (
        onMicPress && (
          <TouchableOpacity 
            style={[styles.micBtn, { backgroundColor: theme.primary + '08' }]}
            onPress={onMicPress}
          >
            <Mic size={18} color={theme.primary} />
          </TouchableOpacity>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  micBtn: {
    padding: 8,
    borderRadius: 12,
  },
});
