type FeatureFlag = 
  | 'enable_ai_advisor' 
  | 'enable_payments' 
  | 'enable_notifications' 
  | 'experimental_voice_search';

const flags: Record<FeatureFlag, boolean> = {
  'enable_ai_advisor': true,
  'enable_payments': false, // Still in development
  'enable_notifications': true,
  'experimental_voice_search': false,
};

export const isFeatureEnabled = (flag: FeatureFlag): boolean => {
  return flags[flag] ?? false;
};
