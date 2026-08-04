import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Send a push notification to one or more Expo push tokens.
 * Silently ignores invalid/expired tokens.
 */
export async function sendPushNotification(
  pushTokens: string | string[],
  payload: PushPayload
): Promise<void> {
  const tokens = Array.isArray(pushTokens) ? pushTokens : [pushTokens];

  const messages: ExpoPushMessage[] = tokens
    .filter(token => Expo.isExpoPushToken(token))
    .map(token => ({
      to: token,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      priority: 'high',
    }));

  if (messages.length === 0) return;

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      const tickets: ExpoPushTicket[] = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, i) => {
        if (ticket.status === 'error') {
          console.warn(`Push notification error for token ${messages[i]?.to}:`, ticket.message);
        }
      });
    } catch (err) {
      console.error('Push chunk send failed:', err);
    }
  }
}
