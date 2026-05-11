type FeatureFlag = 
  | 'enable_ai_advisor' 
  | 'enable_payments' 
  | 'enable_notifications' 
  | 'experimental_voice_search';

const flags: Record<FeatureFlag, boolean> = {
  'enable_ai_advisor': true,
  'enable_payments': false,
  'enable_notifications': true,
  'experimental_voice_search': true, // Testing on mobile
};

import { Platform } from 'react-native';

export const isFeatureEnabled = (flag: FeatureFlag): boolean => {
  const isEnabled = flags[flag] ?? false;

  // Platform Guards for Native-only features
  if (Platform.OS === 'web') {
    if (flag === 'experimental_voice_search' || flag === 'enable_notifications') {
      return false;
    }
  }

  return isEnabled;
};
