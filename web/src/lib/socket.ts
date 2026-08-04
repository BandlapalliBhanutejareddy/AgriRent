import { io, Socket } from 'socket.io-client';
import { useStore } from '../store/useStore';
import { useChatStore } from '../store/chatStore';
import { useNotificationStore } from '../store/notificationStore';

const SOCKET_URL = 'http://localhost:4000'; // Change in prod

let socket: Socket | null = null;

export const initSocketClient = () => {
  const session = useStore.getState().session;
  const token = session?.token;
  const user = useStore.getState().user;

  if (!token || !user || socket) return;

  socket = io(SOCKET_URL, {
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('Connected to socket server');
    socket?.emit('register', user.id);
  });

  socket.on('new_message', (message) => {
    console.log('New realtime message received:', message);
    useChatStore.getState().addMessage(message);
  });

  socket.on('new_notification', (notification) => {
    console.log('New realtime notification received:', notification);
    useNotificationStore.getState().addNotification(notification);
  });
};

export const getSocket = () => socket;
