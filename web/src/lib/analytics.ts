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
  
  // In production, this would send data to Mixpanel, PostHog, or Google Analytics
  console.log(`[Analytics] ${timestamp} - ${eventName}`, properties || {});
  
  // Example implementation for future:
  // if (process.env.NODE_ENV === 'production') {
  //   sendToAnalyticsProvider(eventName, { ...properties, timestamp });
  // }
};
