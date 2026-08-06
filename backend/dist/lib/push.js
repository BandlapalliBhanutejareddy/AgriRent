"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotification = sendPushNotification;
const expo_server_sdk_1 = require("expo-server-sdk");
const expo = new expo_server_sdk_1.Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
/**
 * Send a push notification to one or more Expo push tokens.
 * Silently ignores invalid/expired tokens.
 */
function sendPushNotification(pushTokens, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokens = Array.isArray(pushTokens) ? pushTokens : [pushTokens];
        const messages = tokens
            .filter(token => expo_server_sdk_1.Expo.isExpoPushToken(token))
            .map(token => ({
            to: token,
            sound: 'default',
            title: payload.title,
            body: payload.body,
            data: payload.data || {},
            priority: 'high',
        }));
        if (messages.length === 0)
            return;
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            try {
                const tickets = yield expo.sendPushNotificationsAsync(chunk);
                tickets.forEach((ticket, i) => {
                    var _a;
                    if (ticket.status === 'error') {
                        console.warn(`Push notification error for token ${(_a = messages[i]) === null || _a === void 0 ? void 0 : _a.to}:`, ticket.message);
                    }
                });
            }
            catch (err) {
                console.error('Push chunk send failed:', err);
            }
        }
    });
}
