type EventName = 
  | 'login_success' 
  | 'login_failure' 
  | 'booking_created' 
  | 'equipment_created' 
  | 'filter_applied' 
  | 'ai_advisor_used' 
  | 'payment_attempt';

export const trackEvent = (eventName: EventName, properties?: Record<string, any>) => {
  const timestamp = new Date().toISOString();
  
  // Consolidate mobile analytics logs
  console.log(`[Mobile Analytics] ${timestamp} - ${eventName}`, properties || {});
};
