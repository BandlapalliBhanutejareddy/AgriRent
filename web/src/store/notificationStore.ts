import { create } from 'zustand';

interface NotificationState {
  notifications: any[];
  setNotifications: (notifications: any[]) => void;
  addNotification: (notification: any) => void;
  markAsRead: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) => set((state) => ({ 
    notifications: [notification, ...state.notifications] 
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    )
  }))
}));
